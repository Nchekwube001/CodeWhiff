#!/usr/bin/env node
// src/cli.js

const fs = require("fs");
const path = require("path");
const Parser = require("node-tree-sitter");
const Java = require("tree-sitter-java");
const Python = require("tree-sitter-python");
const { JavaSmellDetector } = require("./parsers/javaParser");
const { PythonSmellDetector } = require("./parsers/pythonParser");

const javaParser = new Parser();
javaParser.setLanguage(Java);
const pyParser = new Parser();
pyParser.setLanguage(Python);

const javaDetector = new JavaSmellDetector();
const pythonDetector = new PythonSmellDetector();

function walk(dir, callback) {
  fs.readdirSync(dir).forEach((name) => {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, callback);
    } else if (
      stat.isFile() &&
      (full.endsWith(".java") || full.endsWith(".py"))
    ) {
      callback(full);
    }
  });
}

const results = [];

walk(process.argv[2] || ".", (file) => {
  const code = fs.readFileSync(file, "utf8");
  const parser = file.endsWith(".java") ? javaParser : pyParser;
  const tree = parser.parse(code).rootNode;
  const diags = file.endsWith(".java")
    ? javaDetector.detect(tree, {
        uri: { fsPath: file },
        getText: () => code,
        languageId: "java",
        positionAt: (pos) => ({ line: 0, character: 0 }),
      })
    : pythonDetector.detect(tree, {
        uri: { fsPath: file },
        getText: () => code,
        languageId: "python",
        positionAt: (pos) => ({ line: 0, character: 0 }),
      });
  results.push({ file, smells: diags.map((d) => d.message) });
});

console.log(JSON.stringify(results, null, 2));
