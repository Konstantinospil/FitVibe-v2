import { randomBytes, createHash } from "node:crypto";

export class CryptoService {
  generateToken(bytes = 32): string {
    return randomBytes(bytes).toString("hex");
  }

  hash(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }
}
