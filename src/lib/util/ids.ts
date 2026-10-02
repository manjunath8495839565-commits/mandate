import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 16);

export function generateId(prefix: string): string {
  return `${prefix}_${nanoid()}`;
}
