import createMemory from "./create-memory";
import { MOV_LIT_R1, MOV_LIT_R2, ADD_REG_REG } from "./instructions";


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
            case 0x10: {  // mov into r1
                this.setRegister("r1", this.fetch16());
                return;
            } case 0x11: {  // mov into r2
                this.setRegister("r2", this.fetch16());
                return;
            } case 0x12: {  // add registers
                const r1 = this.fetch();
                const r2 = this.fetch();
                const res1 = this.registers.getUint16(r1 * 2);
                const res2 = this.registers.getUint16(r2 * 2);
                this.setRegister("acc", res1 + res2);
                return;
            }
            default: {
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

}


export default CPU;
