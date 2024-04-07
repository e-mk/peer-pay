export const intToBytes = (int: number): Uint8Array => {
  let buffer = new ArrayBuffer(4); // Create a buffer of 4 bytes (32 bits).
  let view = new DataView(buffer);
  view.setUint32(0, int, true); // Write the integer to the buffer. 'true' for little endian.
  return new Uint8Array(buffer);
};
