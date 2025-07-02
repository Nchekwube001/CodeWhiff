import * as vscode from "vscode";
import { makeDiag, SmellDetector } from "./data/smellDetector";

// Python smell detector implementation

export class PythonSmellDetector implements SmellDetector {
  detect(root: any, doc: vscode.TextDocument): vscode.Diagnostic[] {
    const diags: vscode.Diagnostic[] = [];

    // Class-level
    root.descendantsOfType("class_definition").forEach((cls: any) => {
      this.detectDataClass(cls, doc, diags);
      this.detectGodClass(cls, doc, diags);
      this.detectLargeClass(cls, doc, diags);
    });

    // Function-level
    root.descendantsOfType("function_definition").forEach((fn: any) => {
      this.detectDeepNesting(fn, doc, diags);
      this.detectFeatureEnvy(fn, doc, diags);
      this.detectLongFunction(fn, doc, diags);
      this.detectLongParameterList(fn, doc, diags);
    });

    // Match-case
    root
      .descendantsOfType("match_statement")
      .forEach((m: any) => this.detectLongMatch(m, doc, diags));

    // Exception-level
    root
      .descendantsOfType("try_statement")
      .forEach((t: any) => this.detectManyExcepts(t, doc, diags));
    root
      .descendantsOfType("except_clause")
      .forEach((e: any) => this.detectEmptyExcept(e, doc, diags));

    return diags;
  }

  private detectLongFunction(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const stmts =
      node
        .childForFieldName("body")
        ?.namedChildren.filter((n: any) => /Statement$/.test(n.type)).length ||
      0;
    if (stmts > 30) {
      out.push(makeDiag(node, doc, `Long function: ${stmts} statements (>30)`));
    }
  }

  private detectDeepNesting(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    let maxDepth = 0;
    const targets = ["if_statement", "for_statement", "while_statement"];
    (function walk(n: any, depth = 0) {
      if (targets.includes(n.type)) {
        depth++;
        maxDepth = Math.max(maxDepth, depth);
      }
      n.namedChildren.forEach((c: any) => walk(c, depth));
    })(node);
    if (maxDepth > 4) {
      out.push(makeDiag(node, doc, `Deep nesting: ${maxDepth} levels (>4)`));
    }
  }

  private detectLongParameterList(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const count =
      node.childForFieldName("parameters")?.namedChildren.length || 0;
    if (count > 5) {
      out.push(
        makeDiag(node, doc, `Long parameter list: ${count} params (>5)`)
      );
    }
  }

  private detectDataClass(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const fields = node.namedChildren.filter(
      (n: any) => n.type === "assignment"
    ).length;
    const methods = node.namedChildren.filter(
      (n: any) => n.type === "function_definition"
    ).length;
    if (fields >= 3 && methods === 0) {
      out.push(makeDiag(node, doc, `Data class: ${fields} fields, no methods`));
    }
  }

  private detectGodClass(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const cnt =
      node.namedChildren.filter((n: any) =>
        ["assignment", "expression_statement"].includes(n.type)
      ).length +
      node.namedChildren.filter((n: any) => n.type === "function_definition")
        .length;
    if (cnt > 20) {
      out.push(makeDiag(node, doc, `God class: ${cnt} members (>20)`));
    }
  }

  private detectLongMatch(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const cases = node.descendantsOfType("case_pattern").length;
    if (cases > 8) {
      out.push(makeDiag(node, doc, `Large match-case: ${cases} cases (>8)`));
    }
  }

  private detectManyExcepts(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const handlers =
      node.childForFieldName("handlers")?.namedChildren.length || 0;
    if (handlers > 3) {
      out.push(makeDiag(node, doc, `Too many except blocks: ${handlers} (>3)`));
    }
  }

  private detectEmptyExcept(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const body = node.childForFieldName("block");
    if (body?.namedChildren.length === 0) {
      out.push(makeDiag(node, doc, `Empty except block`));
    }
  }

  private detectLargeClass(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const start = doc.positionAt(node.startIndex).line;
    const end = doc.positionAt(node.endIndex).line;
    const lines = end - start + 1;
    if (lines > 500) {
      out.push(makeDiag(node, doc, `Large class: ${lines} lines (>500)`));
    }
  }

  private detectFeatureEnvy(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const accesses = node
      .descendantsOfType("attribute")
      .filter((n: any) => n.childForFieldName("value")?.type !== "self").length;
    if (accesses > 10) {
      out.push(
        makeDiag(node, doc, `Feature envy: ${accesses} external accesses (>10)`)
      );
    }
  }
}

// export class PythonSmellDetector implements SmellDetector {
//   detect(root: any, doc: vscode.TextDocument): vscode.Diagnostic[] {
//     const diagnostics: vscode.Diagnostic[] = [];
//     root.descendantsOfType("class_definition").forEach((cls: any) => {
//       this.detectGodClass(cls, doc, diagnostics);
//       this.detectDataClass(cls, doc, diagnostics);
//       //   this.detectLargeClass(cls, doc, diagnostics);
//     });
//     root.descendantsOfType("function_definition").forEach((fn: any) => {
//       this.detectLongFunction(fn, doc, diagnostics);
//       this.detectDeepNesting(fn, doc, diagnostics);
//       this.detectLongParameterList(fn, doc, diagnostics);
//       //   this.detectFeatureEnvy(fn, doc, diagnostics);
//     });
//     // root.descendantsOfType("match_statement").forEach((m: any) => {
//     //   this.detectLongMatch(m, doc, diagnostics);
//     // });
//     return diagnostics;
//   }
//   private detectLongFunction(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     const stmts =
//       node
//         .childForFieldName("body")
//         ?.namedChildren.filter((n: any) => n.type.endsWith("statement"))
//         .length || 0;
//     if (stmts > 30) {
//       out.push(makeDiag(node, doc, `Long function: ${stmts} statements (>30)`));
//     }
//   }
//   private detectDeepNesting(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     let max = 0;
//     function walk(n: any, depth = 0) {
//       if (
//         ["if_statement", "for_statement", "while_statement"].includes(n.type)
//       ) {
//         depth++, (max = Math.max(max, depth));
//       }
//       n.namedChildren.forEach((c: any) => walk(c, depth));
//     }
//     walk(node);
//     if (max > 4) {
//       out.push(makeDiag(node, doc, `Deep nesting: ${max} levels (>4)`));
//     }
//   }
//   private detectLongParameterList(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     const params =
//       node.childForFieldName("parameters")?.namedChildren.length || 0;
//     if (params > 5) {
//       out.push(
//         makeDiag(node, doc, `Long parameter list: ${params} params (>5)`)
//       );
//     }
//   }
//   private detectGodClass(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     const fields = node.namedChildren.filter((n: any) =>
//       ["assignment", "expression_statement"].includes(n.type)
//     ).length;
//     const methods = node.namedChildren.filter(
//       (n: any) => n.type === "function_definition"
//     ).length;
//     if (fields + methods > 20) {
//       out.push(
//         makeDiag(node, doc, `God class: ${fields}+${methods} members (>20)`)
//       );
//     }
//   }
//   private detectDataClass(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     const fields = node.namedChildren.filter(
//       (n: any) => n.type === "assignment"
//     ).length;
//     const methods = node.namedChildren.filter(
//       (n: any) => n.type === "function_definition"
//     ).length;
//     if (fields >= 3 && methods === 0) {
//       out.push(makeDiag(node, doc, `Data class: ${fields} fields, no methods`));
//     }
//   }
// }
