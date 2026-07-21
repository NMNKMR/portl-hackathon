declare module 'aes-js' {
  export class Counter {
    constructor(initialValue?: number[] | Uint8Array);
  }

  export namespace ModeOfOperation {
    export class ctr {
      constructor(key: number[] | Uint8Array, counter: Counter);
      encrypt(data: number[] | Uint8Array): Uint8Array;
      decrypt(data: number[] | Uint8Array): Uint8Array;
    }
  }

  export namespace utils {
    export namespace hex {
      function fromBytes(bytes: number[] | Uint8Array): string;
      function toBytes(hex: string): Uint8Array;
    }
    export namespace utf8 {
      function toBytes(str: string): Uint8Array;
      function fromBytes(bytes: number[] | Uint8Array): string;
    }
  }
}
