# **RefineR** ♻️

### The ultimate tool to clean and refine your JavaScript projects!

[![npm version](https://img.shields.io/npm/v/refiner.svg?style=flat-square)](https://www.npmjs.com/package/refiner-cli)  
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## **What is RefineR?**

RefineR is your personal cleanup assistant for JavaScript and Node.js projects. It analyzes your codebase, detects unused dependencies and files, and helps you declutter your project. With just a few commands, keep your project lightweight, efficient, and refined!

---

## **Features** ✨

- 🛠 **Dependency Analysis**: Detect unused `package.json` dependencies.
- 📂 **File Cleanup**: Identify and delete unused files in your project.
- 📦 **Node Modules Cleaner**: Remove unused `node_modules` for a slimmer project.
- 💡 **Safe Mode**: Run in a `--dry-run` mode to preview changes.
- ⚡ **Extensible**: Designed to support future enhancements.

---

## **Installation**

Install RefineR globally using npm:

```bash
npm install -g refiner
```

---

## **Usage**

RefineR provides a simple and intuitive CLI interface.

### **1. Analyze Your Project**

Check for unused dependencies and files:

```bash
refineR analyze
```

**Example Output**:

```
Unused dependencies:
- lodash
- moment

Unused files:
- src/old.js
- tests/data/sample.json
```

### **2. Clean Up Your Project**

Remove unused dependencies, files, and node modules:

```bash
refiner clean
```

Add `--dry-run` to preview changes without making any modifications:

```bash
refiner clean --dry-run
```

### **3. Skip Confirmation Prompts**

Automatically clean up without confirmation using `--yes`:

```bash
refiner clean --yes
```

---

## **Commands**

| Command           | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `refiner analyze` | Analyze and display unused dependencies and files.   |
| `refiner clean`   | Remove unused dependencies, files, and node modules. |

### **Options**

- `--dry-run`: Preview changes without applying them.
- `--yes`: Skip confirmation prompts for clean operations.

---

## **Examples**

### **Example 1: Analyze Unused Files and Dependencies**

```bash
refiner analyze
```

### **Example 2: Clean Without Confirmation**

```bash
refiner clean --yes
```

### **Example 3: Test Before Cleaning**

```bash
refiner clean --dry-run
```

---

## **Why refiner?**

Modern development moves fast, and codebases grow even faster! refiner ensures your project stays:

- **Lightweight**: Removes unnecessary bloat.
- **Efficient**: Improves performance by eliminating unused resources.
- **Organized**: Keeps your project clean and maintainable.

---

## **Contributing** 🤝

We welcome contributions! To contribute:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

---

## **License** 📜

This project is licensed under the MIT License. See the [LICENSE](https://github.com/hemanth0525/refiner-cli?tab=MIT-1-ov-file) file for details.

---

## **Support Us** ❤️

If you love refiner, give it a star ⭐ on GitHub and share it with your developer friends!

---

## **Future Roadmap** 🛤

- Add support for TypeScript projects.
- Provide a web interface for reports.
- Expand to Python and other languages.

---

**Made with 💻 by JavaScript Enthusiasts.**
