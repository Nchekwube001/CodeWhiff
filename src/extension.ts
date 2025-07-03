// src/smellDetectors.ts
import * as vscode from "vscode";
import Parser = require("node-tree-sitter");
import Java = require("tree-sitter-java");
import Python = require("tree-sitter-python");
import { JavaSmellDetector } from "./parsers/javaParser";
import { PythonSmellDetector } from "./parsers/pythonParser";
import { showReportPanel } from "./parsers/data/smellDetector";

// Generic parser factory
class ParserFactory {
  private static javaParser: Parser;
  private static pythonParser: Parser;

  static getJavaParser(): Parser {
    if (!this.javaParser) {
      this.javaParser = new Parser();
      this.javaParser.setLanguage(Java);
    }
    return this.javaParser;
  }

  static getPythonParser(): Parser {
    if (!this.pythonParser) {
      this.pythonParser = new Parser();
      this.pythonParser.setLanguage(Python);
    }
    return this.pythonParser;
  }
}

let diagnostics: vscode.DiagnosticCollection;

export function activate(ctx: vscode.ExtensionContext) {
  diagnostics = vscode.languages.createDiagnosticCollection("codeSmells");
  ctx.subscriptions.push(diagnostics);
  const reportCmd = vscode.commands.registerCommand(
    "codewhiff.showReport",
    () => {
      showReportPanel(ctx, diagnostics);
    }
  );
  ctx.subscriptions.push(reportCmd);
  const javaDetector = new JavaSmellDetector();
  const pythonDetector = new PythonSmellDetector();

  function checkDocument(doc: vscode.TextDocument) {
    let diags: vscode.Diagnostic[] = [];
    const text = doc.getText();
    let root: any;

    if (doc.languageId === "java") {
      root = ParserFactory.getJavaParser().parse(text).rootNode;
      diags = javaDetector.detect(root, doc);
    } else if (doc.languageId === "python") {
      root = ParserFactory.getPythonParser().parse(text).rootNode;
      diags = pythonDetector.detect(root, doc);
    } else {
      diagnostics.delete(doc.uri);
      return;
    }

    diagnostics.set(doc.uri, diags);
  }

  ctx.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(checkDocument),
    vscode.workspace.onDidChangeTextDocument((e) => checkDocument(e.document))
  );

  const disposable = vscode.commands.registerCommand(
    "codewhiff.showSmellSummary",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return vscode.window.showInformationMessage("No active editor.");
      }
      checkDocument(editor.document);
      const count = diagnostics.get(editor.document.uri)?.length || 0;
      vscode.window.showInformationMessage(`Found ${count} smell(s).`);
    }
  );
  ctx.subscriptions.push(disposable);
}

export function deactivate() {
  diagnostics.clear();
}
