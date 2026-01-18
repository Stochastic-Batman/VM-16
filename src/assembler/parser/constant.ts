import A from "arcsecond";
import { validIdentifier, hexLiteral } from "./common";
import * as T from "./types";


const constantParser = A.coroutine(function* () {
    const isExport = Boolean(yield A.possibly(A.char("+")));
    yield A.str("constant");
    yield A.whitespace;
    const name = yield validIdentifier;
    yield A.whitespace;
    yield A.char("=");
    yield A.whitespace;
    const value = yield hexLiteral;
    yield A.optionalWhitespace;

    return T.constant({
        isExport,
        name,
        value
    });
});


export default constantParser;
