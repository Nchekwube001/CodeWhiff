// src/extension.ts
import * as vscode from "vscode";
import { JavaSmellDetector } from "./parsers/javaParser";
import { PythonSmellDetector } from "./parsers/pythonParser";
import { getConfiguration } from "./parsers/config";

let diagnostics: vscode.DiagnosticCollection;
let javaDetector: JavaSmellDetector;
let pythonDetector: PythonSmellDetector;
const readMeUrl =
  "https://github.com/Nchekwube001/CodeWhiff/blob/main/README.md";
export function activate(ctx: vscode.ExtensionContext) {
  // On first activation, display welcome prompt and panel
  const hasShown = ctx.globalState.get<boolean>("welcomeShown");
  // if (!hasShown) {
  vscode.window
    .showInformationMessage(
      "Welcome to CodeWhiff — your static code smell assistant!",
      "Open Settings",
      "View Docs"
    )
    .then((choice) => {
      if (choice === "Open Settings") {
        vscode.commands.executeCommand(
          "workbench.action.openSettings",
          "codewhiff"
        );
      } else if (choice === "View Docs") {
        vscode.env.openExternal(vscode.Uri.parse(readMeUrl));
      }
    });
  showWelcomePanel(ctx);
  ctx.globalState.update("welcomeShown", true);
  // }
  diagnostics = vscode.languages.createDiagnosticCollection("codewhiff");
  diagnostics = vscode.languages.createDiagnosticCollection("codewhiff");
  ctx.subscriptions.push(diagnostics);

  javaDetector = new JavaSmellDetector();
  pythonDetector = new PythonSmellDetector();

  // Watch for document open/change/save to update diagnostics
  ctx.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => scanFile(doc.uri)),
    vscode.workspace.onDidChangeTextDocument((e) => scanFile(e.document.uri)),
    vscode.workspace.onDidSaveTextDocument((doc) => scanFile(doc.uri))
  );

  // Register summary report command
  const reportCmd = vscode.commands.registerCommand(
    "codewhiff.showReport",
    () => {
      showReportPanel(ctx);
    }
  );

  // Legacy summary command: re-scan current file and show count
  const legacyCmd = vscode.commands.registerCommand(
    "codewhiff.showSmellSummary",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No active editor to scan.");
        return;
      }
      await scanFile(editor.document.uri);
      const diags = diagnostics.get(editor.document.uri) || [];
      vscode.window.showInformationMessage(
        `Found ${diags.length} smell(s) in current file.`
      );
    }
  );

  ctx.subscriptions.push(reportCmd, legacyCmd);

  // Persistence commands (export/import settings)
  registerPersistenceCommands(ctx);
}

/**
 * Scans a single file by URI, runs detectors, and updates diagnostics.
 */
async function scanFile(uri: vscode.Uri) {
  const doc = await vscode.workspace.openTextDocument(uri);
  let diags: vscode.Diagnostic[] = [];
  try {
    let root: any;
    if (doc.languageId === "java") {
      root = ParserFactory.getJavaParser().parse(doc.getText()).rootNode;
      diags = javaDetector.detect(root, doc);
    } else if (doc.languageId === "python") {
      root = ParserFactory.getPythonParser().parse(doc.getText()).rootNode;
      diags = pythonDetector.detect(root, doc);
    } else {
      diagnostics.delete(uri);
      return;
    }
    diagnostics.set(uri, diags);
  } catch (err) {
    console.error("Error scanning file:", uri.fsPath, err);
  }
}

function showReportPanel(ctx: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    "codewhiffReport",
    "CodeWhiff Smell Report",
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  const styleUri = panel.webview.asWebviewUri(
    vscode.Uri.parse(
      "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
    )
  );

  const all = vscode.workspace.textDocuments
    .filter((d) => ["java", "python"].includes(d.languageId))
    .map((d) => ({
      uri: d.uri.fsPath.split("/").pop(),
      diags: diagnostics.get(d.uri) || [],
    }));

  const itemsHtml = all.length
    ? all
        .map(
          (file) => `
      <div class="p-4 bg-white rounded-lg shadow mb-4">
        <h2 class="text-lg font-semibold mb-2">${file.uri}</h2>
        <ul class="list-disc list-inside space-y-1">
          ${file.diags
            .map(
              (diag) => `
            <li class="text-sm text-gray-700">
              <span class="font-medium">${diag.message}</span>
              <span class="text-xs text-gray-500">(Line ${
                diag.range.start.line + 1
              }, Col ${diag.range.start.character + 1})</span>
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
    `
        )
        .join("")
    : '<p class="text-center text-gray-600">No smells detected in open files.</p>';

  panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleUri}" rel="stylesheet">
      <title>CodeWhiff Smell Report</title>
    </head>
    <body class="bg-gray-100 p-6">
      <div class="max-w-4xl mx-auto">
        <header class="mb-6">
          <h1 class="text-2xl font-bold text-gray-800">CodeWhiff Smell Report</h1>
          <p class="text-gray-600">Summary of detected code smells across open Java & Python files.</p>
        </header>
        ${itemsHtml}
      </div>
    </body>
    </html>
  `;
}

function showWelcomePanel(ctx: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    "codewhiffWelcome",
    "Welcome to CodeWhiff",
    vscode.ViewColumn.One,
    { enableScripts: true }
  );
  const styleUri = panel.webview.asWebviewUri(
    vscode.Uri.parse(
      "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
    )
  );
  panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>Welcome to CodeWhiff</title>
</head>
<body class="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 min-h-screen flex items-center justify-center">
  <div class="bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-lg">
    <h1 class="text-4xl font-extrabold text-purple-700 mb-4 text-center">Welcome to <span class="text-red-600">CodeWhiff</span>!</h1>
    <p class="text-gray-800 mb-6 text-center">Your vibrant static code smell assistant for Java & Python.</p>
    <div class="space-y-4">
      <button onclick="vscode.postMessage({ command: 'openSettings' })" class="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">Open Settings</button>
      <button onclick="vscode.postMessage({ command: 'viewDocs' })" class="w-full py-2 px-4 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition">View Documentation</button>
    </div>
    <footer class="mt-6 text-center text-gray-600 text-sm">
      <p>Get started by scanning a file or viewing the report.</p>
    </footer>
      <ul>
     <li>Press <code>⇧⌘R</code> to view the Smell Report.</li>
     <li>Press <code>⇧⌘T</code> to scan the current file.</li>
     <li>Customize smell thresholds in <strong>Settings → Extensions → CodeWhiff</strong>.</li>
     <li>Export or import your rule-set via the Command Palette.</li>
   </ul>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    window.addEventListener('message', event => {});
  </script>
</body>
</html>`;
  // Handle messages from webview
  panel.webview.onDidReceiveMessage((msg) => {
    if (msg.command === "openSettings") {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "codewhiff"
      );
    } else if (msg.command === "viewDocs") {
      vscode.env.openExternal(vscode.Uri.parse(readMeUrl));
    }
  });
}

export function deactivate() {
  diagnostics.clear();
}

// Inline ParserFactory for convenience
class ParserFactory {
  private static javaParser: any;
  private static pythonParser: any;

  static getJavaParser(): any {
    if (!this.javaParser) {
      this.javaParser = new (require("node-tree-sitter"))();
      this.javaParser.setLanguage(require("tree-sitter-java"));
    }
    return this.javaParser;
  }

  static getPythonParser(): any {
    if (!this.pythonParser) {
      this.pythonParser = new (require("node-tree-sitter"))();
      this.pythonParser.setLanguage(require("tree-sitter-python"));
    }
    return this.pythonParser;
  }
}

// Rule-set persistence commands
export function registerPersistenceCommands(ctx: vscode.ExtensionContext) {
  // Export current settings to .codewhiffrc.json in workspace
  const exportCmd = vscode.commands.registerCommand(
    "codewhiff.exportSettings",
    async () => {
      if (!vscode.workspace.workspaceFolders) {
        return vscode.window.showErrorMessage("No workspace open.");
      }
      const config = getConfiguration();
      const all = config;
      const workspaceUri = vscode.workspace.workspaceFolders[0].uri;
      const fileUri = vscode.Uri.joinPath(workspaceUri, ".codewhiffrc.json");
      const data: Record<string, any> = {};
      for (const key of Object.keys(all)) {
        data[key] = config.get(key);
      }
      await vscode.workspace.fs.writeFile(
        fileUri,
        Buffer.from(JSON.stringify(data, null, 2))
      );
      vscode.window.showInformationMessage(
        "CodeWhiff settings exported to .codewhiffrc.json"
      );
    }
  );

  // Import settings from .codewhiffrc.json
  const importCmd = vscode.commands.registerCommand(
    "codewhiff.importSettings",
    async () => {
      if (!vscode.workspace.workspaceFolders) {
        return vscode.window.showErrorMessage("No workspace open.");
      }
      const workspaceUri = vscode.workspace.workspaceFolders[0].uri;
      const fileUri = vscode.Uri.joinPath(workspaceUri, ".codewhiffrc.json");
      try {
        const data = await vscode.workspace.fs.readFile(fileUri);
        const obj = JSON.parse(data.toString());
        const config = getConfiguration();
        for (const [key, value] of Object.entries(obj)) {
          await config.update(key, value, vscode.ConfigurationTarget.Workspace);
        }
        vscode.window.showInformationMessage(
          "CodeWhiff settings imported from .codewhiffrc.json"
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(
          "Failed to import settings: " + err.message
        );
      }
    }
  );

  ctx.subscriptions.push(exportCmd, importCmd);
}

// Register persistence commands in activate
// Add inside activate (after reportCmd, legacyCmd):
// registerPersistenceCommands(ctx);
