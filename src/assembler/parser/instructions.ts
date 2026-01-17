// @ts-ignore
import A from "arcsecond";
import {
    regReg, immReg, memReg, regMem, immMem,
    regPtrReg, immOffReg, noArgs, singleReg, singleImm
} from "./formats";

const mov = A.choice([
    regReg("mov", "MOV_REG_REG"),
    immReg("mov", "MOV_IMM_REG"),
    memReg("mov", "MOV_MEM_REG"),
    regMem("mov", "MOV_REG_MEM"),
    immMem("mov", "MOV_IMM_MEM"),
    regPtrReg("mov", "MOV_REG_PTR_REG"),
    immOffReg("mov", "MOV_IMM_OFF_REG")
]);

const add = A.choice([
    regReg("add", "ADD_REG_REG"),
    immReg("add", "ADD_IMM_REG"),
]);

const sub = A.choice([
    regReg("sub", "SUB_REG_REG"),
    immReg("sub", "SUB_IMM_REG"),
]);

const mul = A.choice([
    regReg("mul", "MUL_REG_REG"),
    immReg("mul", "MUL_IMM_REG"),
]);

const lsf = A.choice([
    regReg("lsf", "LSF_REG_REG"),
    immReg("lsf", "LSF_REG_IMM"),
]);

const rsf = A.choice([
    regReg("rsf", "RSF_REG_REG"),
    immReg("rsf", "RSF_REG_IMM"),
]);

const and = A.choice([
    regReg("and", "AND_REG_REG"),
    immReg("and", "AND_REG_IMM"),
]);

const or = A.choice([
    regReg("or", "OR_REG_REG"),
    immReg("or", "OR_REG_IMM"),
]);

const xor = A.choice([
    regReg("xor", "XOR_REG_REG"),
    immReg("xor", "XOR_REG_IMM"),
]);

const inc = singleReg("inc", "INC_REG");
const dec = singleReg("dec", "DEC_REG");
const not = singleReg("not", "NOT");

const jeq = A.choice([
    regMem("jeq", "JEQ_REG"),
    immMem("jeq", "JEQ_IMM"),
]);

const jne = A.choice([
    regMem("jne", "JNE_REG"),
    immMem("jne", "JMP_NOT_EQ"),
]);

const jlt = A.choice([
    regMem("jlt", "JLT_REG"),
    immMem("jlt", "JLT_IMM"),
]);

const jgt = A.choice([
    regMem("jgt", "JGT_REG"),
    immMem("jgt", "JGT_IMM"),
]);

const jle = A.choice([
    regMem("jle", "JLE_REG"),
    immMem("jle", "JLE_IMM"),
]);

const jge = A.choice([
    regMem("jge", "JGE_REG"),
    immMem("jge", "JGE_IMM"),
]);

const psh = A.choice([
    singleImm("psh", "PSH_IMM"),
    singleReg("psh", "PSH_REG"),
]);

const pop = singleReg("pop", "POP");

const cal = A.choice([
    singleImm("cal", "CAL_IMM"),
    singleReg("cal", "CAL_REG"),
]);

const ret = noArgs("ret", "RET");
const hlt = noArgs("hlt", "HLT");

export default A.choice([
    mov, add, sub, inc, dec, mul, lsf, rsf, and, or, xor, not,
    jne, jeq, jlt, jgt, jle, jge, psh, pop, cal, ret, hlt,
]);
