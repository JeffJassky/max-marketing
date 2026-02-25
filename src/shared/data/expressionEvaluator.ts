/**
 * Evaluates SQL-like expressions in JavaScript context.
 * Supports common SQL functions and arithmetic operations.
 */

/**
 * Safely divide two numbers, returning 0 if divisor is 0 or either is undefined/null.
 */
function safeDivide(numerator: any, denominator: any): number {
  const num = typeof numerator === 'number' ? numerator : 0;
  const denom = typeof denominator === 'number' ? denominator : 0;
  return denom === 0 ? 0 : num / denom;
}

/**
 * Evaluate a SQL-like expression in a JavaScript context with a data row.
 * Supports:
 * - SAFE_DIVIDE(a, b) - safe division
 * - Basic arithmetic: +, -, *, /
 * - Field references (e.g., spent, revenue)
 * - Parentheses
 *
 * @param expression SQL expression string (e.g. "SAFE_DIVIDE(conversions_value, spend)")
 * @param row Data row with field values
 * @returns Evaluated result or 0 if evaluation fails
 */
export function evaluateSQLExpression(expression: string, row: Record<string, any>): number {
  try {
    // Replace SAFE_DIVIDE calls with safeDivide function calls
    let jsExpression = expression.replace(
      /SAFE_DIVIDE\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi,
      (match, arg1, arg2) => {
        const num = arg1.trim();
        const denom = arg2.trim();
        return `safeDivide(${num}, ${denom})`;
      }
    );

    // Create a safe evaluation context with the row data and safeDivide function
    const context = {
      ...row,
      safeDivide,
    };

    // Use Function constructor instead of eval for better control
    const func = new Function(...Object.keys(context), `return ${jsExpression}`);
    const result = func(...Object.values(context));

    return typeof result === 'number' && isFinite(result) ? result : 0;
  } catch (error) {
    console.warn(`Failed to evaluate expression "${expression}":`, error);
    return 0;
  }
}
