import ast, sys, json
tree = ast.parse(open(sys.argv[1]).read())
# Example: Walk AST and return a list of smells
# Return JSON string to stdou