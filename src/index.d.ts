declare module "node-tree-sitter" {
  class Parser {
    constructor();
    setLanguage(lang: any): void;
    parse(source: string): { rootNode: any };
    // you can add whatever other methods you use here…
  }
  export = Parser;
}
