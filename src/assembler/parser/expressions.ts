import A from "arcsecond";
import * as T from "./types";
import { peek, hexLiteral, operator, variable } from "./common";
import interpretAs from "./interpret-as";

const expressionElement = A.choice([
    interpretAs,
    hexLiteral,
    variable,
]);

const priorities: Record<string, number> = {
    OP_MULTIPLY: 2,
    OP_PLUS: 1,
    OP_MINUS: 0,
};

const disambiguateOrderOfOperations = (expr: any): any => {
    if (expr.type !== "SQUARE_BRACKET_EXPRESSION" && expr.type !== "BRACKETED_EXPRESSION") {
        return expr;
    }

    if (expr.value.length === 1) {
        return expr.value[0];
    }

    let candidateExpression = { priority: -Infinity, a: 0, b: 0, op: null as any };

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

export const bracketedExpr: any = A.coroutine(function* () {
    const states = { 
        OPEN_BRACKET: 0, 
        OPERATOR_OR_CLOSING: 1, 
        ELEMENT_OR_OPENING: 2, 
        CLOSE_BRACKET: 3 
    };
    let state = states.ELEMENT_OR_OPENING;
    const expr: any[] = [];
    const stack = [expr];

    yield A.char("(");

    while (true) {
        const nextChar = yield peek;

        if (state === states.OPEN_BRACKET) {
            yield A.char("(");
            const newList: any[] = [];
            last(stack).push(newList);
            stack.push(newList);
            yield A.optionalWhitespace;
            state = states.ELEMENT_OR_OPENING;
        } else if (state === states.CLOSE_BRACKET) {
            yield A.char(")");
            stack.pop();
            if (stack.length === 0) break;
            yield A.optionalWhitespace;
            state = states.OPERATOR_OR_CLOSING;
        } else if (state === states.ELEMENT_OR_OPENING) {
            if (nextChar === ")") yield A.fail("Unexpected end of expression");
            if (nextChar === "(") {
                state = states.OPEN_BRACKET;
            } else {
                last(stack).push(yield expressionElement);
                yield A.optionalWhitespace;
                state = states.OPERATOR_OR_CLOSING;
            }
        } else if (state === states.OPERATOR_OR_CLOSING) {
            if (nextChar === ")") {
                state = states.CLOSE_BRACKET;
                continue;
            }
            last(stack).push(yield operator);
            yield A.optionalWhitespace;
            state = states.ELEMENT_OR_OPENING;
        }
    }
    return typifyBracketedExpression(expr);
});

export const squareBracketExpr = A.coroutine(function* () {
    yield A.char("[");
    yield A.optionalWhitespace;

    const states = { EXPECT_ELEMENT: 0, EXPECT_OPERATOR: 1 };
    const expr = [];
    let state = states.EXPECT_ELEMENT;

    while (true) {
        if (state === states.EXPECT_ELEMENT) {
            expr.push(yield A.choice([bracketedExpr, expressionElement]));
            state = states.EXPECT_OPERATOR;
            yield A.optionalWhitespace;
        } else {
            const nextChar = yield peek;
            if (nextChar === "]") {
                yield A.char("]");
                yield A.optionalWhitespace;
                break;
            }
            expr.push(yield operator);
            state = states.EXPECT_ELEMENT;
            yield A.optionalWhitespace;
        }
    }

    return T.squareBracketExpression(expr);
}).map(disambiguateOrderOfOperations);
