// @ts-ignore
import A from "arcsecond";
import * as T from "./types";
import { peek, hexImmediate, operator, variable } from "./common";

const priorities: Record<string, number> = {
    "OP_MULTIPLY": 2,
    "OP_PLUS": 1,
    "OP_MINUS": 0,
};

export const disambiguateOrderOfOperations = (expr: any): any => {
    if (expr.type !== "SQUARE_BRACKET_EXPRESSION" && expr.type !== "BRACKETED_EXPRESSION") {
        return expr;
    }

    if (expr.value.length === 1) {
        return expr.value[0];
    }

    let candidateExpression = { priority: -Infinity, a: -1, b: -1, op: null };

    for (let i = 1; i < expr.value.length; i += 2) {
        const level = priorities[expr.value[i].type];
        if (level > candidateExpression.priority) {
            candidateExpression = {
                priority: level,
                a: i - 1,
                b: i + 1,
                op: expr.value[i]
            };
        }
    }

    const newExpression = T.bracketedExpression([
        ...expr.value.slice(0, candidateExpression.a),
        T.binaryOperation({
            a: disambiguateOrderOfOperations(expr.value[candidateExpression.a]),
            b: disambiguateOrderOfOperations(expr.value[candidateExpression.b]),
            op: candidateExpression.op
        }),
        ...expr.value.slice(candidateExpression.b + 1)
    ]);

    return disambiguateOrderOfOperations(newExpression);
};

const last = (a: any[]) => a[a.length - 1];

const typifyBracketedExpression = (expr: any[]): any => {
    return T.bracketedExpression(expr.map(element => {
        if (Array.isArray(element)) {
            return typifyBracketedExpression(element);
        }
        return element;
    }));
};

export const bracketedExpr = A.coroutine(function* () {
    const states = {
        OPEN_BRACKET: 0,
        OPERATOR_OR_CLOSING_BRACKET: 1,
        ELEMENT_OR_OPENING_BRACKET: 2,
        CLOSE_BRACKET: 3
    };

    let state = states.ELEMENT_OR_OPENING_BRACKET;
    const expr: any[] = [];
    const stack = [expr];
    yield A.char("(");

    while (true) {
        const nextChar: any = yield peek;

        if (state === states.OPEN_BRACKET) {
            yield A.char("(");
            const newLevel: any[] = [];
            last(stack).push(newLevel);
            stack.push(newLevel);
            yield A.optionalWhitespace;
            state = states.ELEMENT_OR_OPENING_BRACKET;
        } else if (state === states.CLOSE_BRACKET) {
            yield A.char(")");
            stack.pop();
            if (stack.length === 0) break;
            yield A.optionalWhitespace;
            state = states.OPERATOR_OR_CLOSING_BRACKET;
        } else if (state === states.ELEMENT_OR_OPENING_BRACKET) {
            if (nextChar === ")") yield A.fail("Unexpected end of expression");
            if (nextChar === "(") {
                state = states.OPEN_BRACKET;
            } else {
                last(stack).push(yield A.choice([hexImmediate, variable]));
                yield A.optionalWhitespace;
                state = states.OPERATOR_OR_CLOSING_BRACKET;
            }
        } else if (state === states.OPERATOR_OR_CLOSING_BRACKET) {
            if (nextChar === ")") {
                state = states.CLOSE_BRACKET;
                continue;
            }
            last(stack).push(yield operator);
            yield A.optionalWhitespace;
            state = states.ELEMENT_OR_OPENING_BRACKET;
        }
    }
    return typifyBracketedExpression(expr);
});

export const squareBracketExpr = A.coroutine(function* () {
    yield A.char("[");
    yield A.optionalWhitespace;

    const expr = [];
    let state = 0; // 0: Expect element, 1: Expect operator

    while (true) {
        if (state === 0) {
            const result: any = yield A.choice([bracketedExpr, hexImmediate, variable]);
            expr.push(result);
            state = 1;
            yield A.optionalWhitespace;
        } else {
            const nextChar: any = yield peek;
            if (nextChar === "]") {
                yield A.char("]");
                yield A.optionalWhitespace;
                break;
            }
            const result: any = yield operator;
            expr.push(result);
            state = 0;
            yield A.optionalWhitespace;
        }
    }
    return T.squareBracketExpression(expr);
}).map(disambiguateOrderOfOperations);
