import * as vscode from "vscode";

// Base interface for smell detectors
export interface SmellDetector {
  detect(root: any, doc: vscode.TextDocument): vscode.Diagnostic[];
}

export function makeDiag(node: any, doc: vscode.TextDocument, message: string) {
  return new vscode.Diagnostic(
    new vscode.Range(
      doc.positionAt(node.startIndex),
      doc.positionAt(node.endIndex)
    ),
    message,
    vscode.DiagnosticSeverity.Warning
  );
}

export function showReportPanel(
  ctx: vscode.ExtensionContext,
  diagnostics: vscode.DiagnosticCollection
) {
  const panel = vscode.window.createWebviewPanel(
    "codewhiffReport",
    "CodeWhiff Smell Report",
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  // Include Tailwind CSS for styling
  const styleUri = panel.webview.asWebviewUri(
    vscode.Uri.parse(
      "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
    )
  );

  // Collect diagnostics across open files
  const all = vscode.workspace.textDocuments
    .filter((d) => ["java", "python"].includes(d.languageId))
    .map((d) => ({
      uri: d.uri.fsPath.split("/").pop(),
      diags: diagnostics.get(d.uri) || [],
    }));

  // Generate report items
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
