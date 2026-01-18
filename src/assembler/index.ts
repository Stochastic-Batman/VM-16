import parser from "./parser/index";
import instructions from "../instructions/index";
import { InstructionType as I } from "../instructions/meta";
import { registers } from "../registers";

interface Member {
    offset: number;
    size: number;
}

interface Structure {
    members: Record<string, Member>;
}

const registerMap: Record<string, number> = registers.reduce((map, regName, idx) => {
    map[regName] = idx;
    return map;
}, {} as Record<string, number>);

const symbolicNames: Record<string, number> = {};
const structures: Record<string, Structure> = {};
const machineCode: number[] = [];

const getNodeValue = (node: any): number => {
    switch (node.type) {
        case "VARIABLE": {
            if (!(node.value in symbolicNames)) {
                throw new Error(`Label "${node.value}" wasn't resolved.`);
            }
            return symbolicNames[node.value];
        }

        case "INTERPRET_AS": {
            const structure = structures[node.value.structure];
            if (!structure) {
                throw new Error(`Structure "${node.value.structure}" wasn't resolved.`);
            }

            const member = structure.members[node.value.property];
            if (!member) {
                throw new Error(`Property "${node.value.property}" in structure "${node.value.structure}" wasn't resolved.`);
            }

            if (!(node.value.symbol in symbolicNames)) {
                throw new Error(`Symbol "${node.value.symbol}" wasn't resolved.`);
            }

            const symbol = symbolicNames[node.value.symbol];
            return symbol + member.offset;
        }

        case "HEX_LITERAL": {
            return parseInt(node.value, 16);
        }

        default: {
            throw new Error(`Unsupported node type: ${node.type}`);
        }
    }
};

const encodeLitOrMem = (node: any) => {
    const hexVal = getNodeValue(node);
    machineCode.push((hexVal & 0xFF00) >> 8, hexVal & 0x00FF);
};

const encodeLit8 = (node: any) => {
    const hexVal = getNodeValue(node);
    machineCode.push(hexVal & 0xFF);
};

const encodeReg = (reg: any) => {
    const mappedReg = registerMap[reg.value];
    machineCode.push(mappedReg);
};

const encodeData8 = (node: any) => {
    for (const byte of node.value.values) {
        const parsed = parseInt(byte.value, 16);
        machineCode.push(parsed & 0xFF);
    }
};

const encodeData16 = (node: any) => {
    for (const byte of node.value.values) {
        const parsed = parseInt(byte.value, 16);
        machineCode.push((parsed & 0xFF00) >> 8, parsed & 0x00FF);
    }
};

export const assemble = (sourceCode: string): number[] => {
    const parsedOutput = parser.run(sourceCode);
    if (parsedOutput.isError) {
        throw new Error(`Parse Error: ${parsedOutput.error}`);
    }

    // Reset state for new assembly
    machineCode.length = 0;
    Object.keys(symbolicNames).forEach(key => delete symbolicNames[key]);
    Object.keys(structures).forEach(key => delete structures[key]);
    
    let currentAddress = 0;

    // Pass 1: Resolve Labels, Structures, Constants, and Data offsets
    parsedOutput.result.forEach((node: any) => {
        const name = node.value.name || node.value;

        switch (node.type) {
            case "LABEL": {
                if (name in symbolicNames || name in structures) {
                    throw new Error(`Binding "${name}" already exists.`);
                }
                symbolicNames[name] = currentAddress;
                break;
            }

            case "STRUCTURE": {
                if (name in symbolicNames || name in structures) {
                    throw new Error(`Binding "${name}" already exists.`);
                }
                structures[name] = { members: {} };
                let offset = 0;
                for (const { key, value } of node.value.members) {
                    const size = parseInt(value.value, 16) & 0xFFFF;
                    structures[name].members[key] = { offset, size };
                    offset += size;
                }
                break;
            }

            case "CONSTANT": {
                if (name in symbolicNames || name in structures) {
                    throw new Error(`Binding "${name}" already exists.`);
                }
                symbolicNames[name] = parseInt(node.value.value.value, 16) & 0xFFFF;
                break;
            }

            case "DATA": {
                if (name in symbolicNames || name in structures) {
                    throw new Error(`Binding "${name}" already exists.`);
                }
                symbolicNames[name] = currentAddress;
                const size = node.value.size === 16 ? 2 : 1;
                currentAddress += node.value.values.length * size;
                break;
            }

            default: {
                const metadata = instructions[node.value.instruction];
                currentAddress += metadata.size;
                break;
            }
        }
    });

    // Pass 2: Encoding
    parsedOutput.result.forEach((node: any) => {
        if (["LABEL", "CONSTANT", "STRUCTURE"].includes(node.type)) return;

        if (node.type === "DATA") {
            node.value.size === 8 ? encodeData8(node) : encodeData16(node);
            return;
        }

        const metadata = instructions[node.value.instruction];
        machineCode.push(metadata.opcode);

        const args = node.value.args;

        switch (metadata.type) {
            case I.immReg:
            case I.memReg:
                encodeLitOrMem(args[0]);
                encodeReg(args[1]);
                break;
            case I.regImm8:
                encodeReg(args[0]);
                encodeLit8(args[1]);
                break;
            case I.regImm:
            case I.regMem:
                encodeReg(args[0]);
                encodeLitOrMem(args[1]);
                break;
            case I.immMem:
                encodeLitOrMem(args[0]);
                encodeLitOrMem(args[1]);
                break;
            case I.regReg:
            case I.regPtrReg:
                encodeReg(args[0]);
                encodeReg(args[1]);
                break;
            case I.immOffReg:
                encodeLitOrMem(args[0]);
                encodeReg(args[1]);
                encodeReg(args[2]);
                break;
            case I.singleReg:
                encodeReg(args[0]);
                break;
            case I.singleImm:
                encodeLitOrMem(args[0]);
                break;
        }
    });

    return machineCode;
};
