import createMemory from "./create-memory";
import CPU from "./cpu";
import instructions from "./instructions/index";
import MemoryMapper, { Device } from "./memory-mapper";

/**
 * Loads a sequence of bytes into memory at a specific address.
 */
const loadProgram = (mm: MemoryMapper, address: number, bytes: number[]) => {
    bytes.forEach((byte, i) => mm.setUint8(address + i, byte));
};

/**
 * Creates a banked memory device where the active bank is determined 
 * by the 'mb' (Memory Bank) register in the CPU.
 */
const createBankedMemory = (n: number, bankSize: number, cpu: CPU): Device => {
    const bankBuffers = Array.from({ length: n }, () => new ArrayBuffer(bankSize));
    const banks = bankBuffers.map(ab => new DataView(ab));

    const dataViewMethods = ["getUint8", "getUint16", "setUint8", "setUint16"] as const;
    const deviceInterface = {} as Device;

    dataViewMethods.forEach((name) => {
        (deviceInterface[name] as any) = (...args: any[]) => {
            // Select bank based on the current value of the 'mb' register
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

// Map the banked memory to the start of the address space (0x0000 - 0x00FF)
const memoryBankDevice = createBankedMemory(nBanks, bankSize, cpu);
MM.map(memoryBankDevice, 0, bankSize);

// Map regular RAM from 0x00FF to 0xFFFF
const regularMemory = createMemory(0xFF01);
MM.map(regularMemory, bankSize, 0xFFFF, true);

// Set up Interrupt Vector Table (IVT) starting at 0x1000
// Index 0: Points to 0x2000
// Index 1: Points to 0x3000
MM.setUint16(0x1000 + 0x00, 0x2000);
MM.setUint16(0x1000 + 0x02, 0x3000);

// INTERRUPT HANDLER 0 & Adds two numbers and returns.
loadProgram(MM, 0x2000, [
    0x10, 0x00, 0x42, 0x02, // MOV 0x0042 (66), r1  
    0x10, 0x00, 0x55, 0x03, // MOV 0x0055 (85), r2  
    0x14, 0x02, 0x03,       // ADD r1, r2           
    0xFC                    // RTI (Return from Int)
]);


// INTERRUPT HANDLER 1 & XORs two numbers and returns.
loadProgram(MM, 0x3000, [
    0x10, 0x00, 0x65, 0x02, // MOV 0x0065 (101), r1 
    0x10, 0x00, 0x22, 0x03, // MOV 0x0022 (34), r2  
    0x33, 0x02, 0x03,       // XOR r1, r2           
    0xFC                    // RTI (Return from Int)
]);


// Initializes registers, pushes values, and triggers an interrupt.
loadProgram(MM, 0x0000, [
    0x10, 0x00, 0x01, 0x02, // MOV 1, r1            
    0x10, 0x00, 0x02, 0x03, // MOV 2, r2            
    0x10, 0x00, 0x03, 0x04, // MOV 3, r3            
    0x10, 0x00, 0x04, 0x05, // MOV 4, r4            
    0x17, 0x00, 0x05,       // PSH 5 (Immediate)    
    0xFD, 0x00, 0x00,       // INT 0 (Calls 0x2000) 
    0x1A, 0x02,             // POP r1               
    0x17, 0x00, 0x06,       // PSH 6                
    0x17, 0x00, 0x07,       // PSH 7
]);

// Execution Loop
while (true) {
    console.clear(); // Clear before debug for better visibility
    cpu.step();
    cpu.debug();
    
    // View stack area (near the end of memory)
    cpu.viewMemoryAt(0xFFFF - 31, 16);
    cpu.viewMemoryAt(0xFFFF - 15, 16);
}
