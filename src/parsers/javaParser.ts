import * as vscode from "vscode";
import { makeDiag, SmellDetector } from "./data/smellDetector";

// Java smell detector implementation
// export class JavaSmellDetector implements SmellDetector {
//   detect(root: any, doc: vscode.TextDocument): vscode.Diagnostic[] {
//     const diagnostics: vscode.Diagnostic[] = [];
//     root.descendantsOfType("class_declaration").forEach((cls: any) => {
//       this.detectGodClass(cls, doc, diagnostics);
//       this.detectDataClass(cls, doc, diagnostics);
//       this.detectLargeClass(cls, doc, diagnostics);
//     });
//     root.descendantsOfType("method_declaration").forEach((m: any) => {
//       this.detectLongMethod(m, doc, diagnostics);
//       this.detectDeepNesting(m, doc, diagnostics);
//       this.detectLongParameterList(m, doc, diagnostics);
//       this.detectFeatureEnvy(m, doc, diagnostics);
//     });
//     root.descendantsOfType("switch_expression").forEach((sw: any) => {
//       this.detectLongSwitch(sw, doc, diagnostics);
//     });
//     return diagnostics;
//   }
//   private detectLongMethod(
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
//       out.push(makeDiag(node, doc, `Long method: ${stmts} statements (>30)`));
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
//         [
//           "if_statement",
//           "for_statement",
//           "while_statement",
//           "switch_statement",
//         ].includes(n.type)
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
//     const fields = node.namedChildren.filter(
//       (n: any) => n.type === "field_declaration"
//     ).length;
//     const methods = node.namedChildren.filter(
//       (n: any) => n.type === "method_declaration"
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
//       (n: any) => n.type === "field_declaration"
//     ).length;
//     const methods = node.namedChildren.filter(
//       (n: any) => n.type === "method_declaration"
//     ).length;
//     if (fields >= 3 && methods === 0) {
//       out.push(makeDiag(node, doc, `Data class: ${fields} fields, no methods`));
//     }
//   }
//   private detectLongSwitch(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     const cases = node.descendantsOfType("switch_label").length;
//     if (cases > 8) {
//       out.push(makeDiag(node, doc, `Large switch: ${cases} cases (>8)`));
//     }
//   }
//   private detectLargeClass(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     const loc =
//       doc.positionAt(node.endIndex).line -
//       doc.positionAt(node.startIndex).line +
//       1;
//     if (loc > 500) {
//       out.push(makeDiag(node, doc, `Large class: ${loc} lines (>500)`));
//     }
//   }
//   private detectFeatureEnvy(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     const calls = node
//       .descendantsOfType("field_access")
//       .filter(
//         (n: any) => n.childForFieldName("object")?.type !== "this"
//       ).length;
//     if (calls > 10) {
//       out.push(
//         makeDiag(node, doc, `Feature envy: ${calls} external calls (>10)`)
//       );
//     }
//   }
// }

export class JavaSmellDetector implements SmellDetector {
  detect(root: any, doc: vscode.TextDocument): vscode.Diagnostic[] {
    const diags: vscode.Diagnostic[] = [];

    // Class-level smells
    root.descendantsOfType("class_declaration").forEach((cls: any) => {
      this.detectDataClass(cls, doc, diags);
      this.detectGodClass(cls, doc, diags);
      this.detectLargeClass(cls, doc, diags);
      this.detectInterfaceOverload(cls, doc, diags);
      this.detectDeepNesting(cls, doc, diags);
      this.detectLongMethod(cls, doc, diags);
      this.detectLongParameterList(cls, doc, diags);
    });

    // Method-level smells
    root.descendantsOfType("method_declaration").forEach((m: any) => {
      this.detectDeepNesting(m, doc, diags);
      this.detectFeatureEnvy(m, doc, diags);
      this.detectLongMethod(m, doc, diags);
      this.detectLongParameterList(m, doc, diags);
      this.detectBooleanParameterList(m, doc, diags);
    });

    // Switch-level smell
    root.descendantsOfType("switch_expression").forEach((sw: any) => {
      this.detectLongSwitch(sw, doc, diags);
    });

    // Exception-level smells
    root.descendantsOfType("try_statement").forEach((t: any) => {
      this.detectManyCatches(t, doc, diags);
    });
    root.descendantsOfType("catch_clause").forEach((c: any) => {
      this.detectEmptyCatch(c, doc, diags);
    });

    return diags;
  }

  private detectLongMethod(
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
      out.push(makeDiag(node, doc, `Long method: ${stmts} statements (>30)`));
    }
  }

  private detectDeepNesting(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    let maxDepth = 0;
    const targets = [
      "if_statement",
      "for_statement",
      "while_statement",
      "switch_statement",
    ];
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

  private detectBooleanParameterList(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const params =
      node
        .childForFieldName("parameters")
        ?.namedChildren.filter(
          (p: any) => p.childForFieldName("type")?.type === "boolean"
        ).length || 0;
    if (params > 3) {
      out.push(makeDiag(node, doc, `Too many boolean params: ${params} (>3)`));
    }
  }

  private detectDataClass(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const fields = node.namedChildren.filter(
      (n: any) => n.type === "field_declaration"
    ).length;
    const methods = node.namedChildren.filter(
      (n: any) => n.type === "method_declaration"
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
    const cnt = node.namedChildren.filter((n: any) =>
      ["field_declaration", "method_declaration"].includes(n.type)
    ).length;
    if (cnt > 20) {
      out.push(makeDiag(node, doc, `God class: ${cnt} members (>20)`));
    }
  }

  private detectInterfaceOverload(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const intf =
      node.childForFieldName("interfaces")?.namedChildren.length || 0;
    if (intf > 3) {
      out.push(makeDiag(node, doc, `Too many interfaces: ${intf} (>3)`));
    }
  }

  private detectLongSwitch(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const cases = node.descendantsOfType("switch_label").length;
    if (cases > 8) {
      out.push(makeDiag(node, doc, `Large switch: ${cases} cases (>8)`));
    }
  }

  private detectManyCatches(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const catches =
      node.childForFieldName("catch_clauses")?.namedChildren.length || 0;
    if (catches > 3) {
      out.push(makeDiag(node, doc, `Too many catch blocks: ${catches} (>3)`));
    }
  }

  private detectEmptyCatch(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const body = node.childForFieldName("block");
    if (body?.namedChildren.length === 0) {
      out.push(makeDiag(node, doc, `Empty catch block`));
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
    const calls = node
      .descendantsOfType("field_access")
      .filter(
        (n: any) => n.childForFieldName("object")?.type !== "this"
      ).length;
    if (calls > 10) {
      out.push(
        makeDiag(node, doc, `Feature envy: ${calls} external calls (>10)`)
      );
    }
  }
}
