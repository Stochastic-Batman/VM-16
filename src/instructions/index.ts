import { meta, InstructionMeta } from "./meta";

export * from "./meta";

const indexBy = <T, K extends keyof T>(array: T[], prop: K): Record<string, T> => 
  array.reduce((output, item) => {
    const key = String(item[prop]);
    output[key] = item;
    return output;
  }, {} as Record<string, T>);

const instructions = indexBy(meta, "instruction");

export default instructions;
