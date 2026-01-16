import createMemory from "./create-memory";
import { MOV_LIT_REG, MOV_REG_REG, MOV_REG_MEM, MOV_MEM_REG, ADD_REG_REG, JNE } from "./instructions";


class CPU {
    private memory: DataView;
    private registerNames: string[];
    private registers: DataView;
    private registerMap: { [key: string]: number };


    constructor(memory: DataView) {
        this.memory = memory;
        this.registerNames = ["pc", "acc", "r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8"];
        this.registers = createMemory(2 * this.registerNames.length);  // 16 bit machine => 2 bytes per register

        this.registerMap = this.registerNames.reduce((map: { [key: string]: number }, name: string, i: number) => {
            map[name] = 2 * i;
            return map;
        }, {});
    }


    getRegister(name: string): number {
        if (!(name in this.registerMap)) {
            throw new Error(`getRegister: No such register '${name}'`);
        }
        return this.registers.getUint16(this.registerMap[name]);
    }


    setRegister(name: string, value: number): void {
        if (!(name in this.registerMap)) {
            throw new Error(`setRegister: No such register '${name}'`);
        }
        this.registers.setUint16(this.registerMap[name], value);
    }
    

    fetch(): number {
        const nextInstrAddress = this.getRegister("pc");
        const instr = this.memory.getUint8(nextInstrAddress);
        this.setRegister("pc", nextInstrAddress + 1);
        return instr;
    }
    

    fetch16(): number {
        const nextInstrAddress = this.getRegister("pc");
        const instr = this.memory.getUint16(nextInstrAddress);
        this.setRegister("pc", nextInstrAddress + 2);
        return instr;
    }
    

    execute(instr: number): void {
        switch (instr) {
            case MOV_LIT_REG: {
                const literal = this.fetch16();
                const reg = 2 * (this.fetch() % this.registerNames.length);
                this.registers.setUint16(reg, literal);
                return;
            } case MOV_REG_REG: {
                const from = 2 * (this.fetch() % this.registerNames.length);
                const to = 2 * (this.fetch() % this.registerNames.length);
                const value = this.registers.getUint16(from);
                this.registers.setUint16(to, value);
                return;
            } case MOV_REG_MEM: {
                const from = 2 * (this.fetch() % this.registerNames.length);
                const address = this.fetch16();
                const value = this.registers.getUint16(from);
                this.memory.setUint16(address, value);
                return;
            } case MOV_MEM_REG: {
                const address = this.fetch16();
                const to = 2 * (this.fetch() % this.registerNames.length);
                const value = this.memory.getUint16(address);
                this.registers.setUint16(to, value);
                return;
            } case ADD_REG_REG: {
                const r1 = this.fetch();
                const r2 = this.fetch();
                const v1 = this.registers.getUint16(r1 * 2); 
                const v2 = this.registers.getUint16(r2 * 2); 
                this.setRegister("acc", v1 + v2);
                return;
            } case JNE: {
                const value = this.fetch16();
                const address = this.fetch16();
                if (value != this.getRegister("acc")) this.setRegister("pc", address);
                return;
            } default: {
                throw new Error(`Unknown instruction: 0x${instr.toString(16)}`);
            }
        }
    }
    

    step(): void {
        return this.execute(this.fetch());
    }


    debug(): void {
        this.registerNames.forEach(name => {
            console.log(`${name}: 0x${this.getRegister(name).toString(16).padStart(4, '0')}`);
        });
        console.log();
    }


    viewMemoryAt(address: number): void {
        const next8bytes = Array.from({length: 8}, (_, i) => this.memory.getUint8(address + i)).map(v => `0x${v.toString(16).padStart(2, '0')}`);
        console.log(`0x${address.toString(16).padStart(4, '0')}: ${next8bytes.join(' ')}`);
    }
}


export default CPU;
