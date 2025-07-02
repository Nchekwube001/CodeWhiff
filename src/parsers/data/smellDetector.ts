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
