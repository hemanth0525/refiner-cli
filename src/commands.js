import { readFile, stat, unlink, writeFile, rm, readdir, rmdir } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { glob } from 'glob';
import { execSync } from 'child_process';
import { parse } from 'acorn';
import { simple as walk } from 'acorn-walk';

export async function analyzeProject(projectPath) {
    try {
        const packageJsonPath = join(projectPath, 'package.json');
        const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

        // Get all dependencies
        const allDependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
        };

        // Find all JS/TS files
        const files = await glob('**/*.{js,jsx,ts,tsx}', {
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
            cwd: projectPath,
            absolute: true
        });

        const usedDependencies = new Set();
        const unusedFiles = [];
        const fileImports = new Map();

        // Analyze each file
        for (const file of files) {
            const content = await readFile(file, 'utf8');
            const fileStat = await stat(file);
            let isUsed = false;

            try {
                // Parse the file with acorn
                const ast = parse(content, {
                    sourceType: 'module',
                    ecmaVersion: 'latest'
                });

                // Track imports and requires
                walk(ast, {
                    ImportDeclaration(node) {
                        const importPath = node.source.value;
                        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
                            const packageName = importPath.split('/')[0];
                            usedDependencies.add(packageName);
                        } else {
                            const resolvedPath = resolve(dirname(file), importPath);
                            fileImports.set(resolvedPath, true);
                            isUsed = true;
                        }
                    },
                    CallExpression(node) {
                        if (node.callee.name === 'require') {
                            const arg = node.arguments[0];
                            if (arg && arg.type === 'Literal') {
                                const requirePath = arg.value;
                                if (!requirePath.startsWith('.') && !requirePath.startsWith('/')) {
                                    const packageName = requirePath.split('/')[0];
                                    usedDependencies.add(packageName);
                                } else {
                                    const resolvedPath = resolve(dirname(file), requirePath);
                                    fileImports.set(resolvedPath, true);
                                    isUsed = true;
                                }
                            }
                        }
                    }
                });

                // Check if this file is imported by others
                if (!isUsed && !fileImports.has(file)) {
                    unusedFiles.push({
                        path: file.replace(projectPath + '/', ''),
                        lastModified: fileStat.mtime.toISOString(),
                        size: fileStat.size
                    });
                }
            } catch (error) {
                console.warn(`Warning: Could not parse ${file}: ${error.message}`);
            }
        }

        // Find unused dependencies
        const unusedDependencies = [];
        for (const [name, version] of Object.entries(allDependencies)) {
            if (!usedDependencies.has(name)) {
                const depPath = join(projectPath, 'node_modules', name);
                let size;
                try {
                    size = await getFolderSize(depPath);
                } catch (error) {
                    // Dependency might not be installed
                    size = 0;
                }
                unusedDependencies.push({ name, version, size });
            }
        }

        return {
            unusedDependencies,
            unusedFiles
        };
    } catch (error) {
        throw new Error(`Failed to analyze project: ${error.message}`);
    }
}

export async function cleanProject(projectPath, analysis) {
    const removedDependencies = [];
    const removedFiles = [];
    const removedDirs = [];
    let freedSpace = 0;

    // Remove unused dependencies
    for (const dep of analysis.unusedDependencies) {
        try {
            // Remove from package.json
            const packageJsonPath = join(projectPath, 'package.json');
            const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

            if (packageJson.dependencies?.[dep.name]) {
                delete packageJson.dependencies[dep.name];
            }
            if (packageJson.devDependencies?.[dep.name]) {
                delete packageJson.devDependencies[dep.name];
            }

            await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

            removedDependencies.push(dep.name);
        } catch (err) {
            console.error(`Error removing dependency ${dep.name}: ${err.message}`);
        }
    }

    // Remove unused files
    for (const file of analysis.unusedFiles) {
        try {
            const fullPath = resolve(projectPath, file.path);
            if (await stat(fullPath).catch(() => false)) {
                const fileStat = await stat(fullPath);
                freedSpace += fileStat.size;
                await unlink(fullPath);
                removedFiles.push(file.path);
            }
        } catch (error) {
            console.warn(`Warning: Could not remove file ${file.path}: ${error.message}`);
        }
    }

    // Remove empty directories
    await removeEmptyDirectories(projectPath);

    // Remove node_modules directory
    try {
        const nodeModulesPath = join(projectPath, 'node_modules');
        if (await stat(nodeModulesPath).catch(() => false)) {
            await rm(nodeModulesPath, { recursive: true });
            removedDirs.push('node_modules');
            console.log('node_modules directory removed');
        }
    } catch (error) {
        console.warn('Warning: Could not remove node_modules directory');
    }

    // Run npm install to update package-lock.json and reinstall dependencies
    try {
        execSync('npm install', { cwd: projectPath, stdio: 'ignore' });
    } catch (error) {
        console.warn('Warning: Could not update package-lock.json');
    }

    return {
        removedDependencies,
        removedFiles,
        removedDirs,
        freedSpace
    };
}

async function removeEmptyDirectories(directory) {
    const files = await readdir(directory);
    if (files.length === 0) {
        await rmdir(directory);
        return true;
    }

    let isEmpty = true;
    for (const file of files) {
        const fullPath = join(directory, file);
        const stats = await stat(fullPath);
        if (stats.isDirectory()) {
            const removed = await removeEmptyDirectories(fullPath);
            if (!removed) {
                isEmpty = false;
            }
        } else {
            isEmpty = false;
        }
    }

    if (isEmpty) {
        await rmdir(directory);
        return true;
    }

    return false;
}

async function getFolderSize(folderPath) {
    try {
        const files = await glob('**/*', {
            cwd: folderPath,
            absolute: true,
            nodir: true
        });

        let totalSize = 0;
        for (const file of files) {
            const stats = await stat(file);
            totalSize += stats.size;
        }

        return totalSize;
    } catch (error) {
        return 0;
    }
}