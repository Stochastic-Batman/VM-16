import {
    MOV_IMM_REG, MOV_REG_REG, MOV_REG_MEM, MOV_MEM_REG,
    ADD_REG_REG, JMP_NOT_EQ, PSH_IMM, PSH_REG, POP,
    CAL_IMM, CAL_REG, RET, HLT
} from "./instructions";
import createMemory from "./create-memory";
import CPU from "./cpu";
import MemoryMapper from "./memory-mapper";
import createScreenDevice from "./screen-device";

const PC = 0;
const ACC = 1;
const R1 = 2;
const R2 = 3;
const R3 = 4;
const R4 = 5;
const R5 = 6;
const R6 = 7;
const R7 = 8;
const R8 = 9;
const SP = 10;
const FP = 11;

const MM = new MemoryMapper();
const memory = createMemory(256 * 256);
MM.map(memory, 0, 0xFFFF);
MM.map(createScreenDevice(), 0x3000, 0x30FF, true);

const writableBytes = new Uint8Array(memory.buffer);
const cpu = new CPU(MM);
let i = 0;

const waitSubroutineAddress = 0x3100;

const writeCharToScreen = (char: string, command: number, position: number) => {
    writableBytes[i++] = MOV_IMM_REG;
    writableBytes[i++] = command;
    writableBytes[i++] = char.charCodeAt(0);
    writableBytes[i++] = R1;

    writableBytes[i++] = MOV_REG_MEM;
    writableBytes[i++] = R1;
    writableBytes[i++] = 0x30;
    writableBytes[i++] = position;
};

let boldValue = 0;

for (let x = 3; x <= 15; x += 2) {
    i = 0;
    boldValue = boldValue === 0 ? 1 : 0;
    writeCharToScreen(" ", 0xFF, 0);

    for (let index = 0; index <= 0xFF; index++) {
        const command = (index % 2 === boldValue) ? 0x01 : 0x02;
        const char = (index % x === 0) ? " " : "+";
        writeCharToScreen(char, command, index);
    }

    writableBytes[i++] = PSH_IMM;
    writableBytes[i++] = 0x00;
    writableBytes[i++] = 0x00;

    writableBytes[i++] = CAL_IMM;
    writableBytes[i++] = (waitSubroutineAddress & 0xFF00) >> 8;
    writableBytes[i++] = (waitSubroutineAddress & 0x00FF);
}

writableBytes[i++] = MOV_IMM_REG;
writableBytes[i++] = 0x00;
writableBytes[i++] = 0x00;
writableBytes[i++] = PC;

i = waitSubroutineAddress;

writableBytes[i++] = MOV_IMM_REG;
writableBytes[i++] = 0;
writableBytes[i++] = 1;
writableBytes[i++] = R1;

writableBytes[i++] = MOV_IMM_REG;
writableBytes[i++] = 0;
writableBytes[i++] = 0;
writableBytes[i++] = ACC;

const loopStart = i;

writableBytes[i++] = ADD_REG_REG;
writableBytes[i++] = R1;
writableBytes[i++] = ACC;

writableBytes[i++] = JMP_NOT_EQ;
writableBytes[i++] = 0xCC;
writableBytes[i++] = 0xFF;
writableBytes[i++] = (loopStart & 0xFF00) >> 8;
writableBytes[i++] = (loopStart & 0x00FF);

writableBytes[i++] = RET;

cpu.run();
