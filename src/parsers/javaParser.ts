import * as vscode from "vscode";
import { makeDiag, SmellDetector } from "./data/smellDetector";
import { getConfiguration } from "./config";
import { log } from "console";

// export class JavaSmellDetector implements SmellDetector {
//   detect(root: any, doc: vscode.TextDocument): vscode.Diagnostic[] {
//     const diags: vscode.Diagnostic[] = [];

//     // Class-level smells
//     root.descendantsOfType("class_declaration").forEach((cls: any) => {
//       this.detectDataClass(cls, doc, diags);
//       this.detectGodClass(cls, doc, diags);
//       this.detectLargeClass(cls, doc, diags);
//       this.detectInterfaceOverload(cls, doc, diags);
//       this.detectDeepNesting(cls, doc, diags);
//       this.detectLongMethod(cls, doc, diags);
//       this.detectLongParameterList(cls, doc, diags);
//     });

//     // Method-level smells
//     root.descendantsOfType("method_declaration").forEach((m: any) => {
//       this.detectDeepNesting(m, doc, diags);
//       this.detectFeatureEnvy(m, doc, diags);
//       this.detectLongMethod(m, doc, diags);
//       this.detectLongParameterList(m, doc, diags);
//       this.detectBooleanParameterList(m, doc, diags);
//     });

//     // Switch-level smell
//     root.descendantsOfType("switch_expression").forEach((sw: any) => {
//       this.detectLongSwitch(sw, doc, diags);
//     });

//     // Exception-level smells
//     root.descendantsOfType("try_statement").forEach((t: any) => {
//       this.detectManyCatches(t, doc, diags);
//     });
//     root.descendantsOfType("catch_clause").forEach((c: any) => {
//       this.detectEmptyCatch(c, doc, diags);
//     });

//     return diags;
//   }

//   private detectLongMethod(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     const stmts =
//       node
//         .childForFieldName("body")
//         ?.namedChildren.filter((n: any) => /Statement$/.test(n.type)).length ||
//       0;
//     if (stmts > 30) {
//       out.push(makeDiag(node, doc, `Long method: ${stmts} statements (>30)`));
//     }
//   }

//   private detectDeepNesting(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     let maxDepth = 0;
//     const targets = [
//       "if_statement",
//       "for_statement",
//       "while_statement",
//       "switch_statement",
//     ];
//     (function walk(n: any, depth = 0) {
//       if (targets.includes(n.type)) {
//         depth++;
//         maxDepth = Math.max(maxDepth, depth);
//       }
//       n.namedChildren.forEach((c: any) => walk(c, depth));
//     })(node);
//     if (maxDepth > 4) {
//       out.push(makeDiag(node, doc, `Deep nesting: ${maxDepth} levels (>4)`));
//     }
//   }

//   private detectLongParameterList(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     const count =
//       node.childForFieldName("parameters")?.namedChildren.length || 0;
//     if (count > 5) {
//       out.push(
//         makeDiag(node, doc, `Long parameter list: ${count} params (>5)`)
//       );
//     }
//   }

//   private detectBooleanParameterList(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     const params =
//       node
//         .childForFieldName("parameters")
//         ?.namedChildren.filter(
//           (p: any) => p.childForFieldName("type")?.type === "boolean"
//         ).length || 0;
//     if (params > 3) {
//       out.push(makeDiag(node, doc, `Too many boolean params: ${params} (>3)`));
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

//   private detectGodClass(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     const cnt = node.namedChildren.filter((n: any) =>
//       ["field_declaration", "method_declaration"].includes(n.type)
//     ).length;
//     if (cnt > 20) {
//       out.push(makeDiag(node, doc, `God class: ${cnt} members (>20)`));
//     }
//   }

//   private detectInterfaceOverload(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     const intf =
//       node.childForFieldName("interfaces")?.namedChildren.length || 0;
//     if (intf > 3) {
//       out.push(makeDiag(node, doc, `Too many interfaces: ${intf} (>3)`));
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

//   private detectManyCatches(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     const catches =
//       node.childForFieldName("catch_clauses")?.namedChildren.length || 0;
//     if (catches > 3) {
//       out.push(makeDiag(node, doc, `Too many catch blocks: ${catches} (>3)`));
//     }
//   }

//   private detectEmptyCatch(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     const body = node.childForFieldName("block");
//     if (body?.namedChildren.length === 0) {
//       out.push(makeDiag(node, doc, `Empty catch block`));
//     }
//   }

//   private detectLargeClass(
//     node: any,
//     doc: vscode.TextDocument,
//     out: vscode.Diagnostic[]
//   ) {
//     const start = doc.positionAt(node.startIndex).line;
//     const end = doc.positionAt(node.endIndex).line;
//     const lines = end - start + 1;
//     if (lines > 500) {
//       out.push(makeDiag(node, doc, `Large class: ${lines} lines (>500)`));
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
    const cfg = getConfiguration();
    console.log({
      logFromJava: cfg.get<number>("java.dataClassFieldThreshold"),
    });

    // Class-level smells
    root.descendantsOfType("class_declaration").forEach((cls: any) => {
      if (cfg.get<boolean>("java.enableDataClass")) {
        this.detectDataClass(
          cls,
          doc,
          diags,
          cfg.get<number>("java.dataClassFieldThreshold")!
        );
      }
      if (cfg.get<boolean>("java.enableGodClass")) {
        this.detectGodClass(
          cls,
          doc,
          diags,
          cfg.get<number>("java.godClassMemberThreshold")!
        );
      }
      if (cfg.get<boolean>("java.enableInterfaceOverload")) {
        this.detectInterfaceOverload(
          cls,
          doc,
          diags,
          cfg.get<number>("java.interfaceOverloadThreshold")!
        );
      }
      if (cfg.get<boolean>("java.enableLargeClass")) {
        this.detectLargeClass(
          cls,
          doc,
          diags,
          cfg.get<number>("java.largeClassLineThreshold")!
        );
      }
    });

    // Method-level smells
    root.descendantsOfType("method_declaration").forEach((m: any) => {
      if (cfg.get<boolean>("java.enableDeepNesting")) {
        this.detectDeepNesting(
          m,
          doc,
          diags,
          cfg.get<number>("java.deepNestingThreshold")!
        );
      }
      if (cfg.get<boolean>("java.enableFeatureEnvy")) {
        this.detectFeatureEnvy(
          m,
          doc,
          diags,
          cfg.get<number>("java.featureEnvyThreshold")!
        );
      }
      if (cfg.get<boolean>("java.enableLongMethod")) {
        this.detectLongMethod(
          m,
          doc,
          diags,
          cfg.get<number>("java.longMethodThreshold")!
        );
      }
      if (cfg.get<boolean>("java.enableLongParameterList")) {
        this.detectLongParameterList(
          m,
          doc,
          diags,
          cfg.get<number>("java.longParameterListThreshold")!
        );
      }
      if (cfg.get<boolean>("java.enableBooleanParameterList")) {
        this.detectBooleanParameterList(
          m,
          doc,
          diags,
          cfg.get<number>("java.booleanParameterListThreshold")!
        );
      }
    });

    // Switch-level smell
    root.descendantsOfType("switch_expression").forEach((sw: any) => {
      if (cfg.get<boolean>("java.enableLongSwitch")) {
        this.detectLongSwitch(
          sw,
          doc,
          diags,
          cfg.get<number>("java.longSwitchThreshold")!
        );
      }
    });

    // Exception-level smells
    root.descendantsOfType("try_statement").forEach((t: any) => {
      if (cfg.get<boolean>("java.enableManyCatches")) {
        this.detectManyCatches(
          t,
          doc,
          diags,
          cfg.get<number>("java.manyCatchesThreshold")!
        );
      }
    });
    root.descendantsOfType("catch_clause").forEach((c: any) => {
      if (cfg.get<boolean>("java.enableEmptyCatch")) {
        this.detectEmptyCatch(c, doc, diags);
      }
    });

    return diags;
  }

  private detectLongMethod(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[],
    threshold: number
  ) {
    const stmts =
      node
        .childForFieldName("body")
        ?.namedChildren.filter((n: any) => /Statement$/.test(n.type)).length ||
      0;
    if (stmts > threshold)
      out.push(
        makeDiag(node, doc, `Long method: ${stmts} statements (>${threshold})`)
      );
  }

  private detectDeepNesting(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[],
    threshold: number
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
    if (maxDepth > threshold)
      out.push(
        makeDiag(node, doc, `Deep nesting: ${maxDepth} levels (>${threshold})`)
      );
  }

  private detectLongParameterList(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[],
    threshold: number
  ) {
    const count =
      node.childForFieldName("parameters")?.namedChildren.length || 0;
    if (count > threshold)
      out.push(
        makeDiag(
          node,
          doc,
          `Long parameter list: ${count} params (>${threshold})`
        )
      );
  }

  private detectBooleanParameterList(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[],
    threshold: number
  ) {
    const params =
      node
        .childForFieldName("parameters")
        ?.namedChildren.filter(
          (p: any) => p.childForFieldName("type")?.type === "boolean"
        ).length || 0;
    if (params > threshold)
      out.push(
        makeDiag(
          node,
          doc,
          `Too many boolean params: ${params} (>${threshold})`
        )
      );
  }

  private detectDataClass(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[],
    threshold: number
  ) {
    const fields = node.namedChildren.filter(
      (n: any) => n.type === "field_declaration"
    ).length;
    const methods = node.namedChildren.filter(
      (n: any) => n.type === "method_declaration"
    ).length;
    if (fields >= threshold && methods === 0)
      out.push(makeDiag(node, doc, `Data class: ${fields} fields, no methods`));
  }

  private detectGodClass(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[],
    threshold: number
  ) {
    const cnt = node.namedChildren.filter((n: any) =>
      ["field_declaration", "method_declaration"].includes(n.type)
    ).length;
    if (cnt > threshold)
      out.push(
        makeDiag(node, doc, `God class: ${cnt} members (>${threshold})`)
      );
  }

  private detectInterfaceOverload(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[],
    threshold: number
  ) {
    const intf =
      node.childForFieldName("interfaces")?.namedChildren.length || 0;
    if (intf > threshold)
      out.push(
        makeDiag(node, doc, `Too many interfaces: ${intf} (>${threshold})`)
      );
  }

  private detectLongSwitch(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[],
    threshold: number
  ) {
    const cases = node.descendantsOfType("switch_label").length;
    if (cases > threshold)
      out.push(
        makeDiag(node, doc, `Large switch: ${cases} cases (>${threshold})`)
      );
  }

  private detectManyCatches(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[],
    threshold: number
  ) {
    const catches =
      node.childForFieldName("catch_clauses")?.namedChildren.length || 0;
    if (catches > threshold)
      out.push(
        makeDiag(node, doc, `Too many catch blocks: ${catches} (>${threshold})`)
      );
  }

  private detectEmptyCatch(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[]
  ) {
    const body = node.childForFieldName("block");
    if (body?.namedChildren.length === 0)
      out.push(makeDiag(node, doc, `Empty catch block`));
  }

  private detectLargeClass(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[],
    threshold: number
  ) {
    const start = doc.positionAt(node.startIndex).line;
    const end = doc.positionAt(node.endIndex).line;
    const lines = end - start + 1;
    if (lines > threshold)
      out.push(
        makeDiag(node, doc, `Large class: ${lines} lines (>${threshold})`)
      );
  }

  private detectFeatureEnvy(
    node: any,
    doc: vscode.TextDocument,
    out: vscode.Diagnostic[],
    threshold: number
  ) {
    const calls = node
      .descendantsOfType("field_access")
      .filter(
        (n: any) => n.childForFieldName("object")?.type !== "this"
      ).length;
    if (calls > threshold)
      out.push(
        makeDiag(
          node,
          doc,
          `Feature envy: ${calls} external calls (>${threshold})`
        )
      );
  }
}
