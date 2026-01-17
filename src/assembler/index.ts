import parser from "./parser/index";
import instructions from "../instructions/index";
import { InstructionType as I } from "../instructions/meta";

const registerMap: Record<string, number> = {
  pc: 0,
  acc: 1,
  r1: 2,
  r2: 3,
  r3: 4,
  r4: 5,
  r5: 6,
  r6: 7,
  r7: 8,
  r8: 9,
  sp: 10,
  fp: 11,
};

const encodeLitOrMem = (lit: any, labels: Record<string, number>, machineCode: number[]) => {
  let hexVal: number;

  if (lit.type === "VARIABLE") {
    if (!(lit.value in labels)) {
      throw new Error(`Label "${lit.value}" wasn't resolved.`);
    }
    hexVal = labels[lit.value];
  } else {
    hexVal = parseInt(lit.value, 16);
  }

  const highByte = (hexVal & 0xFF00) >> 8;
  const lowByte = hexVal & 0x00FF;
  machineCode.push(highByte, lowByte);
};

const encodeLit8 = (lit: any, labels: Record<string, number>, machineCode: number[]) => {
  let hexVal: number;

  if (lit.type === "VARIABLE") {
    hexVal = labels[lit.value];
  } else {
    hexVal = parseInt(lit.value, 16);
  }

  const lowByte = hexVal & 0xFF;
  machineCode.push(lowByte);
};

const encodeReg = (reg: any, machineCode: number[]) => {
  const mappedReg = registerMap[reg.value.toLowerCase()];
  machineCode.push(mappedReg);
};

export const assemble = (sourceCode: string): number[] => {
  const parsedOutput = parser.run(sourceCode);
  if (parsedOutput.isError) {
    throw new Error(`Parse Error: ${parsedOutput.error}`);
  }

  const machineCode: number[] = [];
  const labels: Record<string, number> = {};
  let currentAddress = 0;

  // Pass 1: Resolve Labels
  parsedOutput.result.forEach((node: any) => {
    if (node.type === "LABEL") {
      labels[node.value] = currentAddress;
    } else {
      const metadata = instructions[node.value.instruction];
      currentAddress += metadata.size;
    }
  });

  // Pass 2: Encode Instructions
  parsedOutput.result.forEach((node: any) => {
    if (node.type !== "INSTRUCTION") return;

    const metadata = instructions[node.value.instruction];
    machineCode.push(metadata.opcode);

    const args = node.value.args;

    // Mapping encoding logic to Instruction Types
    switch (metadata.type) {
      case I.immReg:
      case I.memReg:
        encodeLitOrMem(args[0], labels, machineCode);
        encodeReg(args[1], machineCode);
        break;
      case I.regImm8:
        encodeReg(args[0], machineCode);
        encodeLit8(args[1], labels, machineCode);
        break;
      case I.regImm:
      case I.regMem:
        encodeReg(args[0], machineCode);
        encodeLitOrMem(args[1], labels, machineCode);
        break;
      case I.immMem:
        encodeLitOrMem(args[0], labels, machineCode);
        encodeLitOrMem(args[1], labels, machineCode);
        break;
      case I.regReg:
      case I.regPtrReg:
        encodeReg(args[0], machineCode);
        encodeReg(args[1], machineCode);
        break;
      case I.immOffReg:
        encodeLitOrMem(args[0], labels, machineCode);
        encodeReg(args[1], machineCode);
        encodeReg(args[2], machineCode);
        break;
      case I.singleReg:
        encodeReg(args[0], machineCode);
        break;
      case I.singleImm:
        encodeLitOrMem(args[0], labels, machineCode);
        break;
    }
  });

  return machineCode;
};
