import createMemory from "./create-memory";
import CPU from "./cpu";
import instructions from "./instructions/index";
import MemoryMapper, { Device } from "./memory-mapper";

/**
 * Creates a device that switches between different memory buffers
 * based on the value of a specific CPU register ('mb').
 */
const createBankedMemory = (n: number, bankSize: number, cpu: CPU): Device => {
  const bankBuffers = Array.from({ length: n }, () => new ArrayBuffer(bankSize));
  const banks = bankBuffers.map(ab => new DataView(ab));

  const dataViewMethods = [
    "getUint8",
    "getUint16",
    "setUint8",
    "setUint16",
  ] as const;

  const deviceInterface = {} as Device;

  dataViewMethods.forEach((name) => {
    (deviceInterface[name] as any) = (...args: any[]) => {
      // Logic: Use the 'mb' (memory bank) register to determine which buffer to use
      const bankIndex = cpu.getRegister("mb") % n;
      const memoryBankToUse = banks[bankIndex];
      return (memoryBankToUse[name] as Function)(...args);
    };
  });

  return deviceInterface;
};

const MM = new MemoryMapper();
const cpu = new CPU(MM);

const bankSize = 0xFF;
const nBanks = 8;

// 1. Map Banked Memory to the bottom of memory (0x0000 - 0x00FE)
const memoryBankDevice = createBankedMemory(nBanks, bankSize, cpu);
MM.map(memoryBankDevice, 0, bankSize);

// 2. Map Regular Memory to the rest (0x00FF - 0xFFFF)
const regularMemory = createMemory(0x10000 - bankSize);
MM.map(regularMemory, bankSize, 0xFFFF, true);


console.log('--- Banked Memory Test ---');
console.log('Writing value 1 to address 0 (Bank 0)');
MM.setUint16(0, 1);
console.log('Reading value at address 0: ', MM.getUint16(0));

console.log('\n::: Switching memory bank (0 -> 1)');
cpu.setRegister('mb', 1);
console.log('Reading value at address 0 (should be 0): ', MM.getUint16(0));

console.log('Writing value 42 to address 0 (Bank 1)');
MM.setUint16(0, 42);

console.log('\n::: Switching memory bank (1 -> 2)');
cpu.setRegister('mb', 2);
console.log('Reading value at address 0 (should be 0): ', MM.getUint16(0));

console.log('\n::: Switching memory bank (2 -> 1)');
cpu.setRegister('mb', 1);
console.log('Reading value at address 0 (should be 42): ', MM.getUint16(0));

console.log('\n::: Switching memory bank (1 -> 0)');
cpu.setRegister('mb', 0);
console.log('Reading value at address 0 (should be 1): ', MM.getUint16(0));



console.log('\n--- Running Bytecode Test ---');
const wb = new Uint8Array(regularMemory.buffer); 
// Note: because regularMemory starts at bankSize, 
// we write to its buffer starting at its own internal 0.
let i = 0;
// MOV_IMM_REG 0x1234, r1
wb[i++] = instructions.MOV_IMM_REG.opcode;
wb[i++] = 0x12;
wb[i++] = 0x34;
wb[i++] = 0x02; // r1 index
wb[i++] = instructions.HLT.opcode;

cpu.setRegister("pc", bankSize);

cpu.debug();
cpu.run();

setTimeout(() => { 
    console.log("Final CPU State:");
    cpu.debug(); 
}, 100);
