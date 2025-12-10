import jsep from "jsep";

// Configure jsep once with operators we rely on in predicates.
jsep.addBinaryOp("in", 6);
jsep.addBinaryOp("AND", 2);
jsep.addBinaryOp("and", 2);
jsep.addBinaryOp("OR", 1);
jsep.addBinaryOp("or", 1);

export type AliasMap = Record<string, string>;

/**
 * Translate a JS-like predicate expression (parsed by jsep) into a SQL fragment.
 * Supports optional alias replacement for HAVING contexts.
 */
export function predicateToSql(expression: string, aliasMap: AliasMap = {}): string {
  if (!expression) return "";
  const ast = jsep(expression);
  return astToSql(ast, aliasMap);
}

function astToSql(node: jsep.Expression, aliasMap: AliasMap): string {
  switch (node.type) {
    case "BinaryExpression": {
      const binary = node as jsep.BinaryExpression;
      const left = astToSql(binary.left, aliasMap);
      const op = mapOperator(binary.operator);

      // Normalize null comparisons to IS [NOT] NULL for SQL correctness
      if (isNullLiteral(binary.right)) {
        if (op === "=") return `${left} IS NULL`;
        if (op === "<>") return `${left} IS NOT NULL`;
      }
      if (isNullLiteral(binary.left)) {
        const right = astToSql(binary.right, aliasMap);
        if (op === "=") return `${right} IS NULL`;
        if (op === "<>") return `${right} IS NOT NULL`;
      }

      if (op.toLowerCase() === "in") {
        if (binary.right.type !== "ArrayExpression") {
          throw new Error('Right side of "in" operator must be an array expression.');
        }
        const rightVals = (binary.right as jsep.ArrayExpression).elements
          .filter((e): e is jsep.Expression => e !== null)
          .map((e) => astToSql(e, aliasMap))
          .join(", ");
        return `${left} IN (${rightVals})`;
      }

      const right = astToSql(binary.right, aliasMap);
      return `(${left} ${op} ${right})`;
    }

    case "LogicalExpression": {
      const logical = node as jsep.BinaryExpression;
      const left = astToSql(logical.left, aliasMap);
      const right = astToSql(logical.right, aliasMap);
      const op = logical.operator === "&&" ? "AND" : "OR";
      return `(${left} ${op} ${right})`;
    }

    case "Identifier": {
      const name = (node as jsep.Identifier).name;
      return aliasMap[name] ?? name;
    }

    case "Literal": {
      const literal = node as jsep.Literal;
      return typeof literal.value === "string" ? `'${literal.value}'` : String(literal.value);
    }

    case "ArrayExpression": {
      const arr = node as jsep.ArrayExpression;
      return arr.elements
        .filter((e): e is jsep.Expression => e !== null)
        .map((e) => astToSql(e, aliasMap))
        .join(", ");
    }

    case "CallExpression": {
      const call = node as jsep.CallExpression;
      const callee = astToSql(call.callee, aliasMap);
      const args = call.arguments.map((arg) => astToSql(arg, aliasMap)).join(", ");
      return `${callee}(${args})`;
    }

    default:
      throw new Error(`Unsupported expression type: ${node.type}`);
  }
}

function mapOperator(op: string): string {
  switch (op) {
    case "==":
    case "===":
      return "=";
    case "!=":
    case "!==":
      return "<>";
    default:
      return op;
  }
}

function isNullLiteral(node: jsep.Expression | null): node is jsep.Literal {
  return !!node && node.type === "Literal" && (node as jsep.Literal).value === null;
}
