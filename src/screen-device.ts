import { Device } from "./memory-mapper";


// If you do not recognize escape sequences: https://gist.github.com/ConnerWill/d4b6c776b509add763e17f9f113fd25b

const eraseScreen = (): void => {
  process.stdout.write('\x1b[2J');
};


const moveTo = (x: number, y: number): void => {
  process.stdout.write(`\x1b[${y};${x}H`);
};


const setBold = (): void => {
  process.stdout.write('\x1b[1m');
};


const setRegular = (): void => {
  process.stdout.write('\x1b[0m');
};


const createScreenDevice = (): Device => {
  return {
    getUint16: (): number => 0,
    getUint8: (): number => 0,
    setUint8: (): void => {}, // Ignore 8-bit writes to screen
    setUint16: (address: number, data: number): void => {
      const command = (data & 0xFF00) >> 8;
      const characterValue = data & 0x00FF;

      if (command === 0xFF) {
        eraseScreen();
      } else if (command === 0x01) {
        setBold();
      } else if (command === 0x02) {
        setRegular();
      }

      // 16x16 grid logic
      const x = (address % 16) + 1;
      const y = Math.floor(address / 16) + 1;
      
      moveTo(x * 2, y);
      const character = String.fromCharCode(characterValue);
      process.stdout.write(character);
    }
  };
};


export default createScreenDevice;
