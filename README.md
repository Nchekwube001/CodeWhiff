# CodeWhiff

**Static Code Smell Detector for Java & Python in VS Code**

CodeWhiff helps developers identify and manage code smells directly in Visual Studio Code. It uses Tree‑sitter parsers to scan Java and Python files for a rich set of smells, provides a colorful, interactive report view, and offers extensive customization and CLI integration.

---

## 🚀 Features

- **Real-time diagnostics** on file open, save, or change
- **Comprehensive smell library** for Java & Python:

  - Long Methods/Functions
  - Deep Nesting
  - Long Parameter Lists
  - Too Many Boolean Parameters (Java)
  - Data Classes (fields only)
  - God Classes (too many members)
  - Interface Overload (Java)
  - Large Switch / Match-Case
  - Too Many Catches/Excepts
  - Empty Catch/Except
  - Large Class (line count)
  - Feature Envy (external mem access)

- **Configurable thresholds & toggles** via Settings UI
- **Project-wide Smell Report** in a styled Webview (Tailwind-based)
- **Welcome & onboarding UI** on first activation
- **Persistent rule-sets**: export/import to `.codewhiffrc.json`
- **Legacy command** to quickly scan current file and show count
- **CLI tool**: traverse directories, parse files, output JSON

---

## 📦 Installation

1. **Install in VS Code**

   1. Clone or download this repository.
   2. Run `npm install` in the root.
   3. Compile: `npm run build`.
   4. In VS Code: **Run Extension** from Debug sidebar.
   5. Or **Package** with `vsce package` and install the generated `.vsix`.

2. **(Optional) CLI setup**

   - After build, link CLI:

     ```bash
     npm link   # creates global `codewhiff` command
     ```

   - Or run locally:

     ```bash
     node dist/cli.js ./path/to/project
     ```

---

## ⚙️ Usage

### Commands

| Command                       | Default Keybinding | Description                                    |
| ----------------------------- | ------------------ | ---------------------------------------------- |
| CodeWhiff: Show Smell Report  | `⇧⌘R`              | Show districtated report panel for open files  |
| CodeWhiff: Show Smell Summary | `⇧⌘T`              | Scan current file and show smell count         |
| CodeWhiff: Export Settings    | `⇧⌘E`              | Export current rule-set to `.codewhiffrc.json` |
| CodeWhiff: Import Settings    | `⇧⌘I`              | Import rule-set from `.codewhiffrc.json`       |

Invoke these via the Command Palette (`Cmd+Shift+P`).

### Settings

All settings are under **Extensions → CodeWhiff** (namespace `codewhiff`). Example keys:

```json
"codewhiff.java.enableLongMethod": true,
"codewhiff.java.longMethodThreshold": 30,
"codewhiff.python.enableLongFunction": true,
"codewhiff.python.longFunctionThreshold": 30
```

Adjust thresholds or disable specific smells to suit your code style.

### Welcome & Onboarding

On first activation, CodeWhiff displays:

- A prompt to **Open Settings** or **View Docs**
- A vibrant Webview panel with usage tips and quick buttons

You can revisit docs anytime via the **View Documentation** button or the Command Palette.

### Persistence

Create or update `.codewhiffrc.json` in your workspace:

```bash
Cmd+Shift+E → Export Settings
# then commit .codewhiffrc.json
```

Share that file across your team; re-import with **CodeWhiff: Import Settings**.

---

## 🖥️ CLI

Scan an entire project outside VS Code:

```bash
# global install via npm link or published package
codewhiff ./src > smell-report.json
```

Outputs JSON array of `{ file: string, smells: string[] }` for CI or reporting.

---

## 📚 Extending & Configuring

- **Add new smells** by editing `smellDetectors.ts` under `JavaSmellDetector` or `PythonSmellDetector`.
- **Update settings schema** in `package.json > contributes.configuration` to expose new toggles/thresholds.
- **Customize report UI** in `extension.ts > showReportPanel` with your own styling.

---

## 🤝 Contributing

1. Fork & clone.
2. `npm install` & `npm run build`.
3. Create a feature branch, implement changes, and update README/test.
4. Submit a pull request.

---

## 📄 License

MIT © Toby

---

_Happy smell-free coding!_
