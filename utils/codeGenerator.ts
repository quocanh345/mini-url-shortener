import { randomInt } from 'node:crypto';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Sinh mã ngẫu nhiên gồm chữ và số
export function generateRandomCode(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARACTERS[randomInt(CHARACTERS.length)];
  }
  return result;
}
