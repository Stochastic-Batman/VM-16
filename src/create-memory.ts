const createMemory = (size: number): DataView => {
    const arr_buf = new ArrayBuffer(size);
    const dv = new DataView(arr_buf);
    return dv;
};


export default createMemory;
