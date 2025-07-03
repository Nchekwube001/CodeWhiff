import * as vscode from "vscode";

/**
 * Returns the workspace configuration for CodeWhiff extension.
 * All settings are grouped under the 'codewhiff' namespace.
 */
export function getConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration("codewhiff");
}
