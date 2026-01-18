## VM-16

A 16-bit Virtual Machine implementation built using TypeScript. This project emulates a CPU and memory architecture to execute low-level instructions.

## Overview

VM-16 is designed to simulate the core components of a computer system. It includes a custom CPU, memory management, and an instruction set architecture (ISA) tailored for 16-bit operations.


### Core Components

* **CPU**: Handles the fetch-decode-execute cycle and manages internal registers.
* **Memory**: A dedicated data store providing the VM with its primary workspace.
* **Instructions**: A defined set of opcodes that dictate the behavior of the system.
* **Assembler**: A parser built with `arcsecond` to convert assembly mnemonics into bytecode.


## Architecture

This virtual machine implements a complete 16-bit computer system with several key architectural features:

**Processor Architecture**: The CPU follows a fetch-decode-execute cycle, separating instruction execution from data access. It includes 14 general-purpose and special-purpose registers including a program counter (`pc`), accumulator (`acc`), stack pointer (`sp`), frame pointer (`fp`), and eight general registers (`r1-r8`).

**Memory Management**: The system uses a memory mapper that allows different memory devices to be mapped to specific address ranges. This enables the creation of distinct memory regions with different behaviors, similar to how real hardware maps ROM, RAM, and memory-mapped I/O devices.

**Bank Switching**: A memory banking system is implemented where multiple banks of memory can occupy the same address space. The active bank is selected via a dedicated memory bank (`mb`) register, allowing programs to access more memory than the 16-bit address space would normally permit (up to 8 banks of 256 bytes each in the current configuration).

**Interrupt System**: The VM supports hardware-style interrupts with an interrupt vector table (IVT) that maps interrupt numbers to handler addresses. When an interrupt occurs, the CPU automatically saves the complete processor state (all registers and stack frame information) to the stack, executes the interrupt handler, and restores state upon return. An interrupt mask (`im`) register controls which interrupts are enabled.

**Stack Management**: A sophisticated stack implementation supports both data storage and function calls. The stack grows downward from high memory and includes mechanisms for pushing/popping values, as well as complete state preservation for nested function calls and interrupt handling. Frame pointers enable proper stack frame management for subroutines.

**Instruction Set**: The VM implements a rich RISC-like instruction set with multiple addressing modes including immediate values, register-to-register operations, memory access, and indirect addressing through register pointers. Instructions cover data movement, arithmetic operations (add, subtract, multiply), bitwise operations (AND, OR, XOR, NOT, shifts), control flow (conditional and unconditional jumps), stack operations, and subroutine calls.

**Assembler**: A full assembler with a recursive descent parser converts human-readable assembly language into executable bytecode. It supports labels for jump targets, symbolic constants, data declarations (8-bit and 16-bit), structure definitions for organizing data, and expression evaluation with proper operator precedence.


## Project Structure

The codebase is organized as follows:

```text
├── package.json                    # Project dependencies
├── src
│   ├── assembler
│   │   ├── index.ts                # Assembler entry point - converts assembly to bytecode
│   │   └── parser
│   │       ├── common.ts           # Shared parsers (registers, hex literals, addresses)
│   │       ├── constant.ts         # Parser for constant declarations
│   │       ├── data.ts             # Parser for data8/data16 declarations
│   │       ├── expressions.ts      # Parser for mathematical and bracketed expressions
│   │       ├── formats.ts          # Parsers for instruction argument patterns
│   │       ├── index.ts            # Main parser entry point
│   │       ├── instructions.ts     # Parser for all instruction mnemonics
│   │       ├── interpret-as.ts     # Parser for structure member access syntax
│   │       ├── structure.ts        # Parser for structure definitions
│   │       ├── types.ts            # AST node type definitions
│   │       └── util.ts             # Parsing utility functions
│   ├── cpu.ts                      # CPU implementation with fetch-decode-execute cycle
│   ├── create-memory.ts            # Memory allocation utility
│   ├── instructions
│   │   ├── index.ts                # Instruction lookup by name
│   │   └── meta.ts                 # Instruction metadata, types, and opcodes
│   ├── instructions.ts             # Legacy opcode constants
│   ├── main.ts                     # Application entry point with example program
│   ├── memory-mapper.ts            # Memory region mapping and device abstraction
│   ├── registers.ts                # Register name definitions
│   └── screen-device.ts            # Terminal display device simulation
└── tsconfig.json                   # TypeScript compiler configuration
```

5 directories, 26 files

## Technical Specifications

| Component | Specification |
| --- | --- |
| **Language** | TypeScript 5.x |
| **Module System** | ES Modules (Type: module) |
| **Node.js Version** | v24.13.0 or higher |
| **Package Manager** | npm v11.6.2 |


## Installation & Running

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Stochastic-Batman/VM-16.git
cd VM-16
```

2. Install dependencies:
```bash
npm install
```

### Running

The project utilizes `tsx` for high-performance TypeScript execution. For testing, simply run:

```bash
npm run dev
```