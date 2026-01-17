export const asType = (type: string) => (value: any) => ({ type, value });
export const mapJoin = (parser: any) => parser.map((items: string[]) => items.join(""));
