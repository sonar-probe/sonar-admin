const RANDOM_KEY_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Generates a random alphanumeric key, optionally prefixed (e.g. "komari-"). */
export function generateRandomKey(length: number, prefix = ""): string {
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += RANDOM_KEY_CHARS.charAt(Math.floor(Math.random() * RANDOM_KEY_CHARS.length));
  }
  return result;
}
