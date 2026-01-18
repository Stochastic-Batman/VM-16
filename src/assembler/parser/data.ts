import A from "arcsecond";
import { validIdentifier, hexLiteral, commaSeparated } from "./common";
import * as T from "./types";

const dataParser = (size: number) => A.coroutine(function* () {
    const isExport = Boolean(yield A.possibly(A.char("+")));
    yield A.str(`data${size}`);

    yield A.whitespace;
    const name = yield validIdentifier;
    yield A.whitespace;
    yield A.char("=");
    yield A.whitespace;
    yield A.char("{");
    yield A.whitespace;

    const values = yield commaSeparated(hexLiteral);

    yield A.whitespace;
    yield A.char("}");
    yield A.optionalWhitespace;

    return T.data({
        size,
        isExport,
        name,
        values
    });
});

export const data8 = dataParser(8);
export const data16 = dataParser(16);
