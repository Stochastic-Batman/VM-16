import { inspect } from "util";
import instructionsParser from "./instructions";

const deepLog = (x: any) => console.log(inspect(x, {
    depth: Infinity,
    colors: true
}));

const res = instructionsParser.run("hlt");
deepLog(res);
