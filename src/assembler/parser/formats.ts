// @ts-ignore
import A from "arcsecond";
import * as T from "./types";
import { address, register, hexImmediate, upperOrLowerStr } from "./common";
import { squareBracketExpr } from "./expressions";

export const immReg = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const arg1: any = yield A.choice([hexImmediate, squareBracketExpr]);
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const arg2: any = yield register;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [arg1, arg2] });
});

export const regReg = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const r1: any = yield register;
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const r2: any = yield register;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [r1, r2] });
});

export const regMem = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const r1: any = yield register;
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const addr: any = yield A.choice([address, A.char("&").chain(() => squareBracketExpr)]);
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [r1, addr] });
});

export const memReg = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const addr: any = yield A.choice([address, A.char("&").chain(() => squareBracketExpr)]);
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const r1: any = yield register;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [addr, r1] });
});

export const immMem = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const imm: any = yield A.choice([hexImmediate, squareBracketExpr]);
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const addr: any = yield A.choice([address, A.char("&").chain(() => squareBracketExpr)]);
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [imm, addr] });
});

export const regPtrReg = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const r1: any = yield A.char("&").chain(() => register);
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const r2: any = yield register;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [r1, r2] });
});

export const immOffReg = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const imm: any = yield A.choice([hexImmediate, squareBracketExpr]);
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const r1: any = yield A.char("&").chain(() => register);
    yield A.optionalWhitespace;
    yield A.char(",");
    yield A.optionalWhitespace;
    const r2: any = yield register;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [imm, r1, r2] });
});

export const noArgs = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [] });
});

export const singleReg = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const r1: any = yield register;
    yield A.optionalWhitespace;
    return T.instruction({ instruction: type, args: [r1] });
});

export const singleImm = (mnemonic: string, type: string) => A.coroutine(function* () {
    yield upperOrLowerStr(mnemonic);
    yield A.whitespace;
    const imm: any = yield A.choice([hexImmediate, squareBracketExpr]);
    return T.instruction({ instruction: type, args: [imm] });
});
