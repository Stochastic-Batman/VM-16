// @ts-ignore
import A from "arcsecond";
import {
    regReg, immReg, memReg, regMem, immMem,
    regPtrReg, immOffReg, noArgs, singleReg, singleImm,
    regImm, regImm8
} from "./formats";
import { meta, InstructionType as I } from "../../instructions/meta";


const formatMap: Record<number, any> = {
    [I.immReg]: immReg,
    [I.regImm]: regImm,
    [I.regImm8]: regImm8,
    [I.regReg]: regReg,
    [I.regMem]: regMem,
    [I.memReg]: memReg,
    [I.immMem]: immMem,
    [I.regPtrReg]: regPtrReg,
    [I.immOffReg]: immOffReg,
    [I.noArgs]: noArgs,
    [I.singleReg]: singleReg,
    [I.singleImm]: singleImm,
};


const mnemonicGroups = meta.reduce((groups: Record<string, any[]>, instr) => {
    const formatParser = formatMap[instr.type];
    if (formatParser) {
        if (!groups[instr.mnemonic]) {
            groups[instr.mnemonic] = [];
        }
        groups[instr.mnemonic].push(formatParser(instr.mnemonic, instr.instruction));
    }
    return groups;
}, {});


const groupedParsers = Object.values(mnemonicGroups).map(parsers => 
    parsers.length > 1 ? A.choice(parsers) : parsers[0]
);


export default A.choice(groupedParsers);
