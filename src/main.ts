import readline from "readline";
import CPU from "./cpu";
import createMemory from "./create-memory";
import { 
    MOV_LIT_REG, 
    MOV_REG_MEM, 
    PSH_LIT, 
    CAL_LIT, 
    RET 
} from "./instructions";


const R1 = 2;
const R4 = 5;
const R8 = 9;

const memory = createMemory(256 * 256);
const wb = new Uint8Array(memory.buffer);
const cpu = new CPU(memory);

const subroutineAddress = 0x3000;
let i = 0;


// Push initial values to stack
wb[i++] = PSH_LIT;
wb[i++] = 0x33;
wb[i++] = 0x33;

wb[i++] = PSH_LIT;
wb[i++] = 0x22;
wb[i++] = 0x22;

wb[i++] = PSH_LIT;
wb[i++] = 0x11;
wb[i++] = 0x11;

// Setup registers
wb[i++] = MOV_LIT_REG;
wb[i++] = 0x12;
wb[i++] = 0x34;
wb[i++] = R1;

wb[i++] = MOV_LIT_REG;
wb[i++] = 0x56;
wb[i++] = 0x78;
wb[i++] = R4;

// Push argument count for the call (0 args)
wb[i++] = PSH_LIT;
wb[i++] = 0x00;
wb[i++] = 0x00;

// Call Subroutine at 0x3000
wb[i++] = CAL_LIT;
wb[i++] = (subroutineAddress & 0xff00) >> 8;
wb[i++] = (subroutineAddress & 0x00ff);

// Instruction to execute after returning
wb[i++] = PSH_LIT;
wb[i++] = 0x44;
wb[i++] = 0x44;

// --- Subroutine Definition at 0x3000 ---
i = subroutineAddress;

wb[i++] = PSH_LIT;
wb[i++] = 0x01;
wb[i++] = 0x02;

wb[i++] = PSH_LIT;
wb[i++] = 0x03;
wb[i++] = 0x04;

wb[i++] = PSH_LIT;
wb[i++] = 0x05;
wb[i++] = 0x06;

wb[i++] = MOV_LIT_REG;
wb[i++] = 0x07;
wb[i++] = 0x08;
wb[i++] = R1;

wb[i++] = MOV_LIT_REG;
wb[i++] = 0x09;
wb[i++] = 0x0a;
wb[i++] = R8;

wb[i++] = RET;

// Initial state display
cpu.debug();
cpu.viewMemoryAt(cpu.getRegister('pc'));
// View stack memory at the end of the address space
cpu.viewMemoryAt(0xffff - 43, 44);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("Press ENTER to step...");

rl.on('line', () => {
    cpu.step();
    cpu.debug();
    cpu.viewMemoryAt(cpu.getRegister('pc'));
    cpu.viewMemoryAt(0xffff - 43, 44);
});
