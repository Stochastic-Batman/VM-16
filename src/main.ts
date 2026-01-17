import createMemory from "./create-memory";
import CPU from "./cpu";
import instructions from "./instructions/index";
import MemoryMapper from "./memory-mapper";
import createScreenDevice from "./screen-device";


const MM = new MemoryMapper();
const memory = createMemory(256 * 256);
MM.map(memory, 0, 0xFFFF);

const wb = new Uint8Array(memory.buffer);
// MOV_IMM_REG 0x1234, r1
// HLT
let i = 0;
wb[i++] = instructions.MOV_IMM_REG.opcode;
wb[i++] = 0x12; // High byte of 0x1234
wb[i++] = 0x34; // Low byte of 0x1234
wb[i++] = 0x02; // Register index for r1 (pc=0, acc=1, r1=2...)
wb[i++] = instructions.HLT.opcode;

const cpu = new CPU(MM);
cpu.debug();
cpu.run();
setTimeout(() => { cpu.debug(); }, 100);
