import createMemory from "./create-memory";
import instructions from "./instructions/index";
import { Device } from "./memory-mapper";

class CPU {
    private memory: Device;
    private registerNames: string[];
    private registers: DataView;
    private registerMap: { [key: string]: number };
    private stackFrameSize: number;

    constructor(memory: Device) {
        this.memory = memory;
        this.registerNames = ["pc", "acc", "r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "sp", "fp"];
        this.registers = createMemory(this.registerNames.length * 2);

        this.registerMap = this.registerNames.reduce((map: { [key: string]: number }, name, i) => {
            map[name] = i * 2;
            return map;
        }, {});

        this.setRegister("sp", 0xFFFF - 1);
        this.setRegister("fp", 0xFFFF - 1);
        this.stackFrameSize = 0;
    }

    getRegister(name: string): number {
        if (!(name in this.registerMap)) {
            throw new Error(`getRegister: No such register "${name}"`);
        }
        return this.registers.getUint16(this.registerMap[name]);
    }

    setRegister(name: string, value: number): void {
        if (!(name in this.registerMap)) {
            throw new Error(`setRegister: No such register "${name}"`);
        }
        this.registers.setUint16(this.registerMap[name], value);
    }

    fetch(): number {
        const nextAddr = this.getRegister("pc");
        const instr = this.memory.getUint8(nextAddr);
        this.setRegister("pc", nextAddr + 1);
        return instr;
    }

    fetch16(): number {
        const nextAddr = this.getRegister("pc");
        const instr = this.memory.getUint16(nextAddr);
        this.setRegister("pc", nextAddr + 2);
        return instr;
    }

    fetchRegIdx(): number {
        return (this.fetch() % this.registerNames.length) * 2;
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
        const fpAddr = this.getRegister("fp");
        this.setRegister("sp", fpAddr);

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

        this.setRegister("fp", fpAddr + stackFrameSize);
    }

    execute(instr: number): void | boolean {
        switch (instr) {
            // Move Instructions
            case instructions.MOV_IMM_REG.opcode: {
                const imm = this.fetch16();
                const reg = this.fetchRegIdx();
                this.registers.setUint16(reg, imm);
                return;
            }
            case instructions.MOV_REG_REG.opcode: {
                const from = this.fetchRegIdx();
                const to = this.fetchRegIdx();
                this.registers.setUint16(to, this.registers.getUint16(from));
                return;
            }
            case instructions.MOV_REG_MEM.opcode: {
                const from = this.fetchRegIdx();
                const addr = this.fetch16();
                this.memory.setUint16(addr, this.registers.getUint16(from));
                return;
            }
            case instructions.MOV_MEM_REG.opcode: {
                const addr = this.fetch16();
                const to = this.fetchRegIdx();
                this.registers.setUint16(to, this.memory.getUint16(addr));
                return;
            }
            case instructions.MOV_IMM_MEM.opcode: {
                const val = this.fetch16();
                const addr = this.fetch16();
                this.memory.setUint16(addr, val);
                return;
            }
            case instructions.MOV_REG_PTR_REG.opcode: {
                const r1 = this.fetchRegIdx();
                const r2 = this.fetchRegIdx();
                const ptr = this.registers.getUint16(r1);
                this.registers.setUint16(r2, this.memory.getUint16(ptr));
                return;
            }
            case instructions.MOV_IMM_OFF_REG.opcode: {
                const base = this.fetch16();
                const r1 = this.fetchRegIdx();
                const r2 = this.fetchRegIdx();
                const offset = this.registers.getUint16(r1);
                this.registers.setUint16(r2, this.memory.getUint16(base + offset));
                return;
            }

            // Arithmetic Instructions
            case instructions.ADD_REG_REG.opcode: {
                const r1 = this.fetchRegIdx();
                const r2 = this.fetchRegIdx();
                this.setRegister("acc", this.registers.getUint16(r1) + this.registers.getUint16(r2));
                return;
            }
            case instructions.ADD_IMM_REG.opcode: {
                const imm = this.fetch16();
                const r1 = this.fetchRegIdx();
                this.setRegister("acc", imm + this.registers.getUint16(r1));
                return;
            }
            case instructions.SUB_IMM_REG.opcode: {
                const imm = this.fetch16();
                const r1 = this.fetchRegIdx();
                this.setRegister("acc", this.registers.getUint16(r1) - imm);
                return;
            }
            case instructions.SUB_REG_IMM.opcode: {
                const r1 = this.fetchRegIdx();
                const imm = this.fetch16();
                this.setRegister("acc", imm - this.registers.getUint16(r1));
                return;
            }
            case instructions.SUB_REG_REG.opcode: {
                const r1 = this.fetchRegIdx();
                const r2 = this.fetchRegIdx();
                this.setRegister("acc", this.registers.getUint16(r1) - this.registers.getUint16(r2));
                return;
            }
            case instructions.MUL_IMM_REG.opcode: {
                const imm = this.fetch16();
                const r1 = this.fetchRegIdx();
                this.setRegister("acc", imm * this.registers.getUint16(r1));
                return;
            }
            case instructions.MUL_REG_REG.opcode: {
                const r1 = this.fetchRegIdx();
                const r2 = this.fetchRegIdx();
                this.setRegister("acc", this.registers.getUint16(r1) * this.registers.getUint16(r2));
                return;
            }
            case instructions.INC_REG.opcode: {
                const r1 = this.fetchRegIdx();
                this.registers.setUint16(r1, this.registers.getUint16(r1) + 1);
                return;
            }
            case instructions.DEC_REG.opcode: {
                const r1 = this.fetchRegIdx();
                this.registers.setUint16(r1, this.registers.getUint16(r1) - 1);
                return;
            }

            // Bitwise & Logic
            case instructions.LSF_REG_IMM.opcode: {
                const r1 = this.fetchRegIdx();
                const imm = this.fetch();
                this.registers.setUint16(r1, this.registers.getUint16(r1) << imm);
                return;
            }
            case instructions.LSF_REG_REG.opcode: {
                const r1 = this.fetchRegIdx();
                const r2 = this.fetchRegIdx();
                this.registers.setUint16(r1, this.registers.getUint16(r1) << this.registers.getUint16(r2));
                return;
            }
            case instructions.RSF_REG_IMM.opcode: {
                const r1 = this.fetchRegIdx();
                const imm = this.fetch();
                this.registers.setUint16(r1, this.registers.getUint16(r1) >> imm);
                return;
            }
            case instructions.RSF_REG_REG.opcode: {
                const r1 = this.fetchRegIdx();
                const r2 = this.fetchRegIdx();
                this.registers.setUint16(r1, this.registers.getUint16(r1) >> this.registers.getUint16(r2));
                return;
            }
            case instructions.AND_REG_IMM.opcode: {
                const r1 = this.fetchRegIdx();
                const imm = this.fetch16();
                this.setRegister("acc", this.registers.getUint16(r1) & imm);
                return;
            }
            case instructions.AND_REG_REG.opcode: {
                const r1 = this.fetchRegIdx();
                const r2 = this.fetchRegIdx();
                this.setRegister("acc", this.registers.getUint16(r1) & this.registers.getUint16(r2));
                return;
            }
            case instructions.OR_REG_IMM.opcode: {
                const r1 = this.fetchRegIdx();
                const imm = this.fetch16();
                this.setRegister("acc", this.registers.getUint16(r1) | imm);
                return;
            }
            case instructions.OR_REG_REG.opcode: {
                const r1 = this.fetchRegIdx();
                const r2 = this.fetchRegIdx();
                this.setRegister("acc", this.registers.getUint16(r1) | this.registers.getUint16(r2));
                return;
            }
            case instructions.XOR_REG_IMM.opcode: {
                const r1 = this.fetchRegIdx();
                const imm = this.fetch16();
                this.setRegister("acc", this.registers.getUint16(r1) ^ imm);
                return;
            }
            case instructions.XOR_REG_REG.opcode: {
                const r1 = this.fetchRegIdx();
                const r2 = this.fetchRegIdx();
                this.setRegister("acc", this.registers.getUint16(r1) ^ this.registers.getUint16(r2));
                return;
            }
            case instructions.NOT.opcode: {
                const r1 = this.fetchRegIdx();
                this.setRegister("acc", (~this.registers.getUint16(r1)) & 0xFFFF);
                return;
            }

            // Jumps
            case instructions.JMP_NOT_EQ.opcode: {
                const imm = this.fetch16();
                const addr = this.fetch16();
                if (imm !== this.getRegister("acc")) this.setRegister("pc", addr);
                return;
            }
            case instructions.JNE_REG.opcode: {
                const r1 = this.fetchRegIdx();
                const addr = this.fetch16();
                if (this.registers.getUint16(r1) !== this.getRegister("acc")) this.setRegister("pc", addr);
                return;
            }
            case instructions.JEQ_IMM.opcode: {
                const imm = this.fetch16();
                const addr = this.fetch16();
                if (imm === this.getRegister("acc")) this.setRegister("pc", addr);
                return;
            }
            case instructions.JEQ_REG.opcode: {
                const r1 = this.fetchRegIdx();
                const addr = this.fetch16();
                if (this.registers.getUint16(r1) === this.getRegister("acc")) this.setRegister("pc", addr);
                return;
            }
            case instructions.JLT_IMM.opcode: {
                const imm = this.fetch16();
                const addr = this.fetch16();
                if (imm < this.getRegister("acc")) this.setRegister("pc", addr);
                return;
            }
            case instructions.JLT_REG.opcode: {
                const r1 = this.fetchRegIdx();
                const addr = this.fetch16();
                if (this.registers.getUint16(r1) < this.getRegister("acc")) this.setRegister("pc", addr);
                return;
            }
            case instructions.JGT_IMM.opcode: {
                const imm = this.fetch16();
                const addr = this.fetch16();
                if (imm > this.getRegister("acc")) this.setRegister("pc", addr);
                return;
            }
            case instructions.JGT_REG.opcode: {
                const r1 = this.fetchRegIdx();
                const addr = this.fetch16();
                if (this.registers.getUint16(r1) > this.getRegister("acc")) this.setRegister("pc", addr);
                return;
            }
            case instructions.JLE_IMM.opcode: {
                const imm = this.fetch16();
                const addr = this.fetch16();
                if (imm <= this.getRegister("acc")) this.setRegister("pc", addr);
                return;
            }
            case instructions.JLE_REG.opcode: {
                const r1 = this.fetchRegIdx();
                const addr = this.fetch16();
                if (this.registers.getUint16(r1) <= this.getRegister("acc")) this.setRegister("pc", addr);
                return;
            }
            case instructions.JGE_IMM.opcode: {
                const imm = this.fetch16();
                const addr = this.fetch16();
                if (imm >= this.getRegister("acc")) this.setRegister("pc", addr);
                return;
            }
            case instructions.JGE_REG.opcode: {
                const r1 = this.fetchRegIdx();
                const addr = this.fetch16();
                if (this.registers.getUint16(r1) >= this.getRegister("acc")) this.setRegister("pc", addr);
                return;
            }

            // Stack & Control
            case instructions.PSH_IMM.opcode: {
                this.push(this.fetch16());
                return;
            }
            case instructions.PSH_REG.opcode: {
                this.push(this.registers.getUint16(this.fetchRegIdx()));
                return;
            }
            case instructions.POP.opcode: {
                const reg = this.fetchRegIdx();
                this.registers.setUint16(reg, this.pop());
                return;
            }
            case instructions.CAL_IMM.opcode: {
                const addr = this.fetch16();
                this.pushState();
                this.setRegister("pc", addr);
                return;
            }
            case instructions.CAL_REG.opcode: {
                const addr = this.registers.getUint16(this.fetchRegIdx());
                this.pushState();
                this.setRegister("pc", addr);
                return;
            }
            case instructions.RET.opcode: {
                this.popState();
                return;
            }
            case instructions.HLT.opcode: {
                return true;
            }
        }
    }

    step(): void | boolean {
        return this.execute(this.fetch());
    }

    run(): void {
        const halt = this.step();
        if (!halt) setImmediate(() => this.run());
    }

    debug(): void {
        this.registerNames.forEach(name => {
            console.log(`${name}: 0x${this.getRegister(name).toString(16).padStart(4, "0")}`);
        });
        console.log();
    }

    viewMemoryAt(address: number, n: number = 8): void {
        const nextNbytes = Array.from({ length: n }, (_, i) => this.memory.getUint8(address + i)).map(v => `0x${v.toString(16).padStart(2, "0")}`);
        console.log(`0x${address.toString(16).padStart(4, "0")}: ${nextNbytes.join(" ")}`);
    }
}

export default CPU;
