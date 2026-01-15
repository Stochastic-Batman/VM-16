## VM-16

A 16-bit Virtual Machine implementation built using TypeScript. This project emulates a CPU and memory architecture to execute low-level instructions.

## Overview

VM-16 is designed to simulate the core components of a computer system. It includes a custom CPU, memory management, and an instruction set architecture (ISA) tailored for 16-bit operations.


### Core Components

* **CPU**: Handles the fetch-decode-execute cycle and manages internal registers.
* **Memory**: A dedicated data store providing the VM with its primary workspace.
* **Instructions**: A defined set of opcodes that dictate the behavior of the system.


## Project Structure

The codebase is organized as follows:

```text
.
├── src
│   ├── cpu.ts             # CPU logic and register management
│   ├── create-memory.ts   # Memory allocation and access utilities
│   ├── index.ts           # Application entry point
│   └── instructions.ts    # Instruction set definitions and opcodes
├── package.json           # Dependencies and project scripts
└── tsconfig.json          # TypeScript configuration
```

## Technical Specifications

| Component | Specification |
| --- | --- |
| **Language** | TypeScript 5.x |
| **Module System** | ES Modules (Type: module) |
| **Node.js Version** | v24.13.0 or higher |
| **Package Manager** | npm v11.6.2 |


## Getting Started

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


### Development Scripts

The project utilizes `tsx` for high-performance TypeScript execution during development.

* **Run Development Environment**:
```bash
npm run dev
```


* **Build Production Assets**:
```bash
npm run build
```

The compiled JavaScript files will be generated in the `dist/` directory.
