import { inspect } from "util";
// @ts-ignore
import A from "arcsecond";

const deepLog = (x: any) => console.log(inspect(x, {
    depth: Infinity,
    colors: true
}));

const asType = (type: string) => (value: any) => ({ type, value });
const mapJoin = (parser: any) => parser.map((items: any) => items.join(""));
const peek = A.lookAhead(A.regex(/^./));

const upperOrLowerStr = (s: string) => A.choice([
    A.str(s.toUpperCase()),
    A.str(s.toLowerCase())
]);

const register = A.choice([
    upperOrLowerStr("r1"),
    upperOrLowerStr("r2"),
    upperOrLowerStr("r3"),
    upperOrLowerStr("r4"),
    upperOrLowerStr("r5"),
    upperOrLowerStr("r6"),
    upperOrLowerStr("r7"),
    upperOrLowerStr("r8"),
    upperOrLowerStr("sp"),
    upperOrLowerStr("fp"),
    upperOrLowerStr("pc"),
    upperOrLowerStr("acc"),
]).map(asType("REGISTER"));

const hexDigit = A.regex(/^[0-9A-Fa-f]/);
const hexIMM = A.char("$")
    .chain(() => mapJoin(A.many1(hexDigit)))
    .map(asType("HEX_IMM"));

const validIdentifier = mapJoin(A.sequenceOf([
    A.regex(/^[a-zA-Z_]/),
    A.possibly(A.regex(/^[a-zA-Z0-9_]+/)).map((x: any) => x === null ? "" : x)
]));

const variable = A.char("!")
    .chain(() => validIdentifier)
    .map(asType("VARIABLE"));

const operator = A.choice([
    A.char("+").map(asType("OP_PLUS")),
    A.char("-").map(asType("OP_MINUS")),
    A.char("*").map(asType("OP_MULTIPLY")),
]);

const squareBracketExpr: any = A.coroutine(function* () {
    yield A.char("[");
    yield A.optionalWhitespace;

    const states = {
        EXPECT_ELEMENT: 0,
        EXPECT_OPERATOR: 1,
    };

    const expr = [];
    let state = states.EXPECT_ELEMENT;

    while (true) {
        if (state === states.EXPECT_ELEMENT) {
            const result: any = yield A.choice([
                squareBracketExpr,
                hexIMM,
                variable
            ]);
            expr.push(result);
            state = states.EXPECT_OPERATOR;
            yield A.optionalWhitespace;
        } else if (state === states.EXPECT_OPERATOR) {
            const nextChar: any = yield peek;
            if (nextChar === "]") {
                yield A.char("]");
                yield A.optionalWhitespace;
                break;
            }

            const result: any = yield operator;
            expr.push(result);
            state = states.EXPECT_ELEMENT;
            yield A.optionalWhitespace;
        }
    }

    return asType("SQUARE_BRACKET_EXPRESSION")(expr);
});

const movImmToReg = A.coroutine(function* () {
    yield upperOrLowerStr("mov");
    yield A.whitespace;

    const arg1: any = yield A.choice([
        hexIMM,
        squareBracketExpr,
    ]);

    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;

    const arg2: any = yield register;
    yield A.optionalWhitespace;

    return asType("INSTRUCTION")({
        instruction: "MOV_IMM_REG",
        args: [arg1, arg2]
    });
});

const res = movImmToReg.run("mov $42, r4");
deepLog(res);
