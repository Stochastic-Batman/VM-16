import createMemory from "./create-memory";
import CPU from "./cpu";
import * as instructions from "./instructions";
import MemoryMapper from "./memory-mapper";
import createScreenDevice from "./screen-device";

const PC = 0;
const ACC = 1;
const R1 = 2;
const R2 = 3;
const R3 = 4;
const R4 = 5;
const R5 = 6;
const R6 = 7;
const R7 = 8;
const R8 = 9;
const SP = 10;
const FP = 11;

const MM = new MemoryMapper();

const memory = createMemory(256 * 256);
MM.map(memory, 0, 0xFFFF);

// Map 0xFF bytes of the address space to an "output device" - just stdout
MM.map(createScreenDevice(), 0x3000, 0x30FF, true);

const writableBytes = new Uint8Array(memory.buffer);

const cpu = new CPU(MM);
let i = 0;

// Insert a subroutine for pausing/waiting at the address below
const waitSubroutineAddress = 0x3100;

const writeCharToScreen = (char: string, command: number, position: number) => {
    writableBytes[i++] = instructions.MOV_IMM_REG;
    writableBytes[i++] = command;
    writableBytes[i++] = char.charCodeAt(0);
    writableBytes[i++] = R1;

    writableBytes[i++] = instructions.MOV_REG_MEM;
    writableBytes[i++] = R1;
    writableBytes[i++] = 0x30;
    writableBytes[i++] = position;
};

/*
 * Use JavaScript to generate the machine code for an animation
 */

let boldValue = 0;

// Each iteration of the loop draws a different "frame" of animation
for (let x = 3; x <= 15; x += 2) {
    boldValue = boldValue === 0 ? 1 : 0;

    // Clear the screen
    writeCharToScreen(" ", 0xFF, 0);

    for (let index = 0; index <= 0xFF; index++) {
        const command = (index % 2 === boldValue)
            ? 0x01  // In bold
            : 0x02; // Regular
        const char = (index % x === 0) ? " " : "+";
        writeCharToScreen(char, command, index);
    }

    // No arguments for this functional call
    writableBytes[i++] = instructions.PSH_IMM;
    writableBytes[i++] = 0x00;
    writableBytes[i++] = 0x00;

    // Call the pause/wait function
    writableBytes[i++] = instructions.CAL_IMM;
    writableBytes[i++] = (waitSubroutineAddress & 0xFF00) >> 8;
    writableBytes[i++] = (waitSubroutineAddress & 0x00FF);
}

// Jump to the start of the code
writableBytes[i++] = instructions.MOV_IMM_REG;
writableBytes[i++] = 0x00;
writableBytes[i++] = 0x00;
writableBytes[i++] = PC;

//////////// Subroutine for pausing ///////////////

// start writing code at the subroutine address
i = waitSubroutineAddress;

// R1 is a constant 1, which we add to the accumulator
writableBytes[i++] = instructions.MOV_IMM_REG;
writableBytes[i++] = 0;
writableBytes[i++] = 1;
writableBytes[i++] = R1;

// Acc starts at zero
writableBytes[i++] = instructions.MOV_IMM_REG;
writableBytes[i++] = 0;
writableBytes[i++] = 0;
writableBytes[i++] = ACC;

// loopStart is a label for the beginning of this loop
const loopStart = i;

// Add R1 (1) to the Acc
writableBytes[i++] = instructions.ADD_REG_REG;
writableBytes[i++] = R1;
writableBytes[i++] = ACC;

// if (Acc != 0xccff) then jump to the start of the loop
writableBytes[i++] = instructions.JMP_NOT_EQ;
writableBytes[i++] = 0xCC;
writableBytes[i++] = 0xFF;
writableBytes[i++] = (loopStart & 0xFF00) >> 8;
writableBytes[i++] = (loopStart & 0x00FF);

// otherwise return from the function
writableBytes[i++] = instructions.RET;



cpu.run();
