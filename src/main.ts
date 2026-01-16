import readline from "readline";

import CPU from "./cpu";
import createMemory from "./create-memory";
import { MOV_LIT_REG, MOV_REG_REG, MOV_REG_MEM, MOV_MEM_REG, ADD_REG_REG, JNE } from "./instructions";


const memory = createMemory(256 * 256);
const wb = new Uint8Array(memory.buffer);  // writable bytes
const cpu = new CPU(memory);

const PC = 0;
const ACC = 1;
const R1 = 2;
const R2 = 3;

let i = 0;

wb[i++] = MOV_MEM_REG;
wb[i++] = 0x01;
wb[i++] = 0x00;  // 0x100
wb[i++] = R1;


wb[i++] = MOV_LIT_REG;
wb[i++] = 0x00;
wb[i++] = 0x01;  // 0x0001
wb[i++] = R2;

wb[i++] = ADD_REG_REG;
wb[i++] = R1;
wb[i++] = R2; 

wb[i++] = MOV_REG_MEM;
wb[i++] = ACC;
wb[i++] = 0x01;
wb[i++] = 0x00;  // 0x100

wb[i++] = JNE;
wb[i++] = 0x00;
wb[i++] = 0x03;  // 0x0003
wb[i++] = 0x00;
wb[i++] = 0x00;  // 0x0000


// First initial state
cpu.debug();
cpu.viewMemoryAt(cpu.getRegister("pc")),
cpu.viewMemoryAt(0x0100);


const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.on("line", () => {
    cpu.step(),
    cpu.debug(),
    cpu.viewMemoryAt(cpu.getRegister("pc")),
    cpu.viewMemoryAt(0x0100);
});
