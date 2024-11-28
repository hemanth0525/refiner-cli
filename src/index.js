#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { analyzeProject, cleanProject } from './commands.js';

const program = new Command();

program
    .name('refiner')
    .description('Clean unused files and dependencies from JavaScript projects')
    .version('1.0.1');

program
    .command('analyze')
    .description('Display unused dependencies and files')
    .action(async (options) => {
        const spinner = ora('Analyzing project...').start();
        try {
            const analysis = await analyzeProject(process.cwd());
            spinner.succeed('Analysis complete');

            if (analysis.unusedDependencies.length === 0 && analysis.unusedFiles.length === 0) {
                console.log(chalk.green('\n✨ Your project is clean! No unused dependencies or files found.'));
                return;
            }

            if (analysis.unusedDependencies.length > 0) {
                console.log(chalk.yellow('\nUnused Dependencies:'));
                analysis.unusedDependencies.forEach(dep => {
                    console.log(chalk.red(`  • ${dep.name} (${dep.version})`));
                    if (dep.size) {
                        console.log(chalk.gray(`    Size: ${(dep.size / 1024 / 1024).toFixed(2)} MB`));
                    }
                });
            }

            if (analysis.unusedFiles.length > 0) {
                console.log(chalk.yellow('\nUnused Files:'));
                analysis.unusedFiles.forEach(file => {
                    console.log(chalk.red(`  • ${file.path}`));
                    console.log(chalk.gray(`    Last modified: ${file.lastModified}`));
                    console.log(chalk.gray(`    Size: ${(file.size ? file.size / 1024 : 0).toFixed(2)} KB`));
                });
            }

            console.log(chalk.blue('\nPotential savings:'));
            const totalDepsSize = analysis.unusedDependencies.reduce((acc, dep) => acc + (dep.size || 0), 0);
            const totalFilesSize = analysis.unusedFiles.reduce((acc, file) => acc + (file.size || 0), 0);
            console.log(chalk.green(`  • ${(totalDepsSize / 1024 / 1024).toFixed(2)} MB from dependencies`));
            console.log(chalk.green(`  • ${(totalFilesSize / 1024).toFixed(2)} KB from files`));

        } catch (error) {
            spinner.fail('Analysis failed');
            console.error(chalk.red('\nError:'), error.message);
            process.exit(1);
        }
    });

program
    .command('clean')
    .description('Remove unused dependencies and files ( for dry run use clean --dry-run or -d ) ( for skipping confirmation use clean --yes or -y )')
    .option('-d, --dry-run', 'Show what would be deleted without deleting')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (options) => {
        const spinner = ora('Analyzing project...').start();
        try {
            const analysis = await analyzeProject(process.cwd());
            spinner.succeed('Analysis complete');

            if (analysis.unusedDependencies.length === 0 && analysis.unusedFiles.length === 0) {
                console.log(chalk.green('\n✨ Your project is already clean!'));
                return;
            }

            console.log(chalk.yellow('\nItems to be removed:'));

            if (analysis.unusedDependencies.length > 0) {
                console.log(chalk.yellow('\nDependencies:'));
                analysis.unusedDependencies.forEach(dep => {
                    console.log(chalk.red(`  • ${dep.name}`));
                });
            }

            if (analysis.unusedFiles.length > 0) {
                console.log(chalk.yellow('\nFiles:'));
                analysis.unusedFiles.forEach(file => {
                    console.log(chalk.red(`  • ${file.path}`));
                });
            }

            if (!options.yes && !options.dryRun) {
                const readline = (await import('readline')).createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                const confirm = await new Promise(resolve => {
                    readline.question(chalk.yellow('\nDo you want to proceed with cleanup? (y/N) '), answer => {
                        readline.close();
                        resolve(answer.toLowerCase() === 'y');
                    });
                });

                if (!confirm) {
                    console.log(chalk.yellow('\nCleanup cancelled'));
                    return;
                }
            }

            if (options.dryRun) {
                console.log(chalk.blue('\n🔍 Dry run complete - no changes made'));
                return;
            }

            spinner.start('Cleaning project...');
            const result = await cleanProject(process.cwd(), analysis);
            spinner.succeed('Cleanup complete');

            console.log(chalk.green('\n✨ Cleanup Results:'));
            console.log(chalk.yellow('\nRemoved Dependencies:'));
            if (result.removedDependencies.length > 0) {
                result.removedDependencies.forEach(dep => {
                    console.log(chalk.green(`  • ${dep}`));
                });
            } else {
                console.log(chalk.green('  • None'));
            }

            console.log(chalk.yellow('\nRemoved Files:'));
            if (result.removedFiles.length > 0) {
                result.removedFiles.forEach(file => {
                    console.log(chalk.green(`  • ${file}`));
                });
            } else {
                console.log(chalk.green('  • None'));
            }

            console.log(chalk.yellow('\nRemoved Directories:'));
            if (result.removedDirs.length > 0) {
                result.removedDirs.forEach(dir => {
                    console.log(chalk.green(`  • ${dir}`));
                });
            } else {
                console.log(chalk.green('  • None'));
            }

            console.log(chalk.blue('\nSpace freed:'));
            console.log(chalk.green(`  • ${(result.freedSpace / 1024 / 1024).toFixed(2)} MB total`));

        } catch (error) {
            spinner.fail('Cleanup failed');
            console.error(chalk.red('\nError:'), error.message);
            process.exit(1);
        }
    });

program.parse();