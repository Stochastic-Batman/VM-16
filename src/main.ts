import createMemory from "./create-memory";
import CPU from "./cpu";
import instructions from "./instructions/index";
import MemoryMapper, { Device } from "./memory-mapper";

const loadProgram = (mm: MemoryMapper, address: number, bytes: number[]) => {
    bytes.forEach((byte, i) => mm.setUint8(address + i, byte));
};

const createBankedMemory = (n: number, bankSize: number, cpu: CPU): Device => {
    const bankBuffers = Array.from({ length: n }, () => new ArrayBuffer(bankSize));
    const banks = bankBuffers.map(ab => new DataView(ab));

    const dataViewMethods = ["getUint8", "getUint16", "setUint8", "setUint16"] as const;
    const deviceInterface = {} as Device;

    dataViewMethods.forEach((name) => {
        (deviceInterface[name] as any) = (...args: any[]) => {
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

const memoryBankDevice = createBankedMemory(nBanks, bankSize, cpu);
MM.map(memoryBankDevice, 0, bankSize);

const regularMemory = createMemory(0xFF01);
MM.map(regularMemory, bankSize, 0xFFFF, true);

MM.setUint16(0x1000 + 0x00, 0x2000);
MM.setUint16(0x1000 + 0x02, 0x3000);

loadProgram(MM, 0x2000, [
    0x10, 0x00, 0x42, 0x02,
    0x10, 0x00, 0x55, 0x03,
    0x14, 0x02, 0x03,
    0xFC
]);

loadProgram(MM, 0x3000, [
    0x10, 0x00, 0x65, 0x02,
    0x10, 0x00, 0x22, 0x03,
    0x33, 0x02, 0x03,
    0xFC
]);

loadProgram(MM, 0x0000, [
    0x10, 0x00, 0x01, 0x02,
    0x10, 0x00, 0x02, 0x03,
    0x10, 0x00, 0x03, 0x04,
    0x10, 0x00, 0x04, 0x05,
    0x17, 0x00, 0x05,
    0xFD, 0x00, 0x00,
    0x1A, 0x02,
    0x17, 0x00, 0x06,
    0x17, 0x00, 0x07,
]);

while (true) {
    cpu.step();
    cpu.debug();
    cpu.viewMemoryAt(0xFFFF - 31, 16);
    cpu.viewMemoryAt(0xFFFF - 15, 16);
    console.clear();
}
