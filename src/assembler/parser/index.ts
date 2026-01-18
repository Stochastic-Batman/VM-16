import A from "arcsecond";
import instructionsParser from "./instructions";
import structureParser from "./structure";
import { data8, data16 } from "./data";
import constantParser from "./constant";
import { label } from "./common";


const parser = A.many(A.choice([
    data8,
    data16,
    constantParser,
    structureParser,
    instructionsParser,
    label
])).chain(res => A.endOfInput.map(() => res));


export default parser;
