export interface ColorBuilder {
  getHexColorFromString(text: string): string;
}

export function getKeys(map): Array<string> {
  return Array.from(map.keys());
}

export function getValues(map): Array<any> {
  return Array.from(map.values());
}
