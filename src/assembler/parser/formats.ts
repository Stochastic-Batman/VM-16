import A from "arcsecond";
import * as T from "./types";
import { address, register, hexLiteral, upperOrLowerStr } from "./common";
import { squareBracketExpr } from "./expressions";

const argChoice = A.choice([hexLiteral, squareBracketExpr]);
const addrChoice = A.choice([address, A.char("&").chain(() => squareBracketExpr)]);

export const immReg = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const arg1 = yield argChoice;
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const arg2 = yield register;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [arg1, arg2] });
});

export const regImm = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const r1 = yield register;
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const lit = yield argChoice;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [r1, lit] });
});

export const regReg = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const r1 = yield register;
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const r2 = yield register;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [r1, r2] });
});

export const regMem = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const r1 = yield register;
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const addr = yield addrChoice;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [r1, addr] });
});

export const memReg = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const addr = yield addrChoice;
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const r1 = yield register;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [addr, r1] });
});

export const immMem = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const lit = yield argChoice;
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const addr = yield addrChoice;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [lit, addr] });
});

export const regPtrReg = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const r1 = yield A.char("&").chain(() => register);
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const r2 = yield register;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [r1, r2] });
});

export const immOffReg = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const lit = yield argChoice;
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const r1 = yield A.char("&").chain(() => register);
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const r2 = yield register;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [lit, r1, r2] });
});

export const noArgs = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [] });
});

export const singleReg = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const r1 = yield register;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [r1] });
});

export const singleImm = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const lit = yield argChoice;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [lit] });
});

export const regLit8 = regImm;
