// import { CstNode, parse as parseJava } from "java-parser";
// import { exec } from "child_process";
// import * as fs from "fs";
// import * as path from "path";

// const diagnosticCollection =
//   vscode.languages.createDiagnosticCollection("codeSmells");
// context.subscriptions.push(diagnosticCollection);

// vscode.workspace.onDidSaveTextDocument(async (document) => {
//   if (document.languageId !== "java" && document.languageId !== "python") {
//     return;
//   }

//   const uri = document.uri;
//   const text = document.getText();

//   let diagnostics: vscode.Diagnostic[] = [];

//   if (document.languageId === "java") {
//     diagnostics = detectJavaSmells(document);
//   } else if (document.languageId === "python") {
//     diagnostics = await detectPythonSmells(document);
//   }

//   diagnosticCollection.set(uri, diagnostics);
// });
