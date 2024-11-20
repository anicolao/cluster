export function encrypt(key: string, text: string): string {
  return text.replaceAll(/(.)/g, `${key}$1`);
}

export function decrypt(key: string, text: string): string | null {
  const re = new RegExp(`${key}(.)`, "g");
  const ret = text.replaceAll(re, "$1");
  if (ret.length === text.length / 2) {
    return ret;
  }
  console.log(`Failed to decrypt ${text}, got ${ret}`, re);
  return null;
}
