import A from "arcsecond";
import instructionsParser from "./instructions";
import { label } from "./common";

const parser = A.many(A.choice([
  instructionsParser,
  label
]));

export default parser;
