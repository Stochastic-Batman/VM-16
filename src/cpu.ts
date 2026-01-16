import createMemory from "./create-memory";
import { 
    MOV_LIT_REG, MOV_REG_REG, MOV_REG_MEM, MOV_MEM_REG, 
    ADD_REG_REG, JNE, PSH_LIT, PSH_REG, POP, 
    CAL_LIT, CAL_REG, RET 
} from "./instructions";


class CPU {
    private memory: DataView;
    private registerNames: string[];
    private registers: DataView;
    private registerMap: { [key: string]: number };
    private stackFrameSize: number;


    constructor(memory: DataView) {
        this.memory = memory;
        this.registerNames = ["pc", "acc", "r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "sp", "fp"];
        this.registers = createMemory(2 * this.registerNames.length);  // 16 bit machine => 2 bytes per register

        this.registerMap = this.registerNames.reduce((map: { [key: string]: number }, name: string, i: number) => {
            map[name] = 2 * i;
            return map;
        }, {});

        this.setRegister("sp", memory.byteLength - 1 - 1);
        this.setRegister("fp", memory.byteLength - 1 - 1);
        this.stackFrameSize = 0;
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
    

    fetchRegIdx(): number {
        return 2 * (this.fetch() % this.registerNames.length);
    }


    execute(instr: number): void {
        switch (instr) {
            case MOV_LIT_REG: {
                const literal = this.fetch16();
                const reg = this.fetchRegIdx();
                this.registers.setUint16(reg, literal);
                return;
            } case MOV_REG_REG: {
                const from = this.fetchRegIdx();
                const to = this.fetchRegIdx();
                const value = this.registers.getUint16(from);
                this.registers.setUint16(to, value);
                return;
            } case MOV_REG_MEM: {
                const from = this.fetchRegIdx();
                const address = this.fetch16();
                const value = this.registers.getUint16(from);
                this.memory.setUint16(address, value);
                return;
            } case MOV_MEM_REG: {
                const address = this.fetch16();
                const to = this.fetchRegIdx();
                const value = this.memory.getUint16(address);
                this.registers.setUint16(to, value);
                return;
            } case ADD_REG_REG: {
                const r1 = this.fetchRegIdx();
                const r2 = this.fetchRegIdx();
                const v1 = this.registers.getUint16(r1 * 2); 
                const v2 = this.registers.getUint16(r2 * 2); 
                this.setRegister("acc", v1 + v2);
                return;
            } case JNE: {
                const value = this.fetch16();
                const address = this.fetch16();
                if (value != this.getRegister("acc")) this.setRegister("pc", address);
                return;
            } case PSH_LIT: {
                this.push(this.fetch16());
                return;
            } case PSH_REG: {
                const regIdx = this.fetchRegIdx();
                this.push(this.registers.getUint16(regIdx));
                return;
            } case POP: {
                const regIdx = this.fetchRegIdx();
                const value = this.pop();
                this.registers.setUint16(regIdx, value);
                return;
            } case CAL_LIT: {
                const address = this.fetch16();
                this.pushState();
                this.setRegister("pc", address);
                return;
            } case CAL_REG: {
                const regIdx = this.fetchRegIdx();
                const address = this.registers.getUint16(regIdx);
                this.pushState();
                this.setRegister("pc", address);
                return;
            } case RET: {
                this.popState();
                return;
            } default: {
                throw new Error(`Execute: Unknown instruction 0x${instr.toString(16)}`);
            }
        }
    }
    

    step(): void {
        return this.execute(this.fetch());
    }


    push(value: number): void {
        const spAddress = this.getRegister("sp");
        this.memory.setUint16(spAddress, value);
        this.setRegister("sp", spAddress - 2);
        this.stackFrameSize += 2;
    }


    pop(): number {
        const nextSpAddress = this.getRegister("sp") + 2;
        this.setRegister("sp", nextSpAddress);
        this.stackFrameSize -= 2;
        return this.memory.getUint16(nextSpAddress);
    }


    pushState(): void {
        this.push(this.getRegister("r1"));
        this.push(this.getRegister("r2"));
        this.push(this.getRegister("r3"));
        this.push(this.getRegister("r4"));
        this.push(this.getRegister("r5"));
        this.push(this.getRegister("r6"));
        this.push(this.getRegister("r7"));
        this.push(this.getRegister("r8"));
        this.push(this.getRegister("pc"));
        this.push(this.stackFrameSize + 2);
    
        this.setRegister("fp", this.getRegister("sp"));
        this.stackFrameSize = 0;
    }


    popState(): void {
        const framePointerAddress = this.getRegister("fp");
        this.setRegister("sp", framePointerAddress);
        
        this.stackFrameSize = this.pop();
        const stackFrameSize = this.stackFrameSize;
        
        this.setRegister("pc", this.pop());
        this.setRegister("r8", this.pop());
        this.setRegister("r7", this.pop());
        this.setRegister("r6", this.pop());
        this.setRegister("r5", this.pop());
        this.setRegister("r4", this.pop());
        this.setRegister("r3", this.pop());
        this.setRegister("r2", this.pop());
        this.setRegister("r1", this.pop());
    
        const nArgs = this.pop();
        for (let i = 0; i < nArgs; i++) this.pop();
        this.setRegister("fp", framePointerAddress + stackFrameSize);
    }


    debug(): void {
        this.registerNames.forEach(name => {
            console.log(`${name}: 0x${this.getRegister(name).toString(16).padStart(4, '0')}`);
        });
        console.log();
    }


    viewMemoryAt(address: number, n: number = 8): void {
        const nextNbytes = Array.from({length: n}, (_, i) => this.memory.getUint8(address + i)).map(v => `0x${v.toString(16).padStart(2, '0')}`);
        console.log(`0x${address.toString(16).padStart(4, '0')}: ${nextNbytes.join(' ')}`);
    }
}


export default CPU;
