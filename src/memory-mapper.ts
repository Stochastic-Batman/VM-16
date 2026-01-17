export interface Device {
    getUint16(address: number): number;
    getUint8(address: number): number;
    setUint16(address: number, value: number): void;
    setUint8(address: number, value: number): void;
}

interface Region {
    device: Device;
    start: number;
    end: number;
    remap: boolean;
}

class MemoryMapper {
    private regions: Region[];

    constructor() {
        this.regions = [];
    }

    map(device: Device, start: number, end: number, remap: boolean = true): () => void {
        const region: Region = {
            device,
            start,
            end,
            remap
        };
        this.regions.unshift(region);

        return () => {
            this.regions = this.regions.filter(x => x !== region);
        };
    }

    private findRegion(address: number): Region {
        const region = this.regions.find(r => address >= r.start && address <= r.end);
        if (!region) {
            throw new Error(`findRegion: No memory region found for address 0x${address.toString(16).toUpperCase().padStart(4, "0")}`);
        }
        return region;
    }

    private mapAddress(address: number, region: Region): number {
        return region.remap ? address - region.start : address;
    }

    getUint16(address: number): number {
        const region = this.findRegion(address);
        const finalAddress = this.mapAddress(address, region);
        return region.device.getUint16(finalAddress);
    }

    getUint8(address: number): number {
        const region = this.findRegion(address);
        const finalAddress = this.mapAddress(address, region);
        return region.device.getUint8(finalAddress);
    }

    setUint16(address: number, value: number): void {
        const region = this.findRegion(address);
        const finalAddress = this.mapAddress(address, region);
        region.device.setUint16(finalAddress, value);
    }

    setUint8(address: number, value: number): void {
        const region = this.findRegion(address);
        const finalAddress = this.mapAddress(address, region);
        region.device.setUint8(finalAddress, value);
    }

    load(startAddress: number, data: number[]): void {
        data.forEach((byte, offset) => this.setUint8(startAddress + offset, byte));
    }
}

export default MemoryMapper;
