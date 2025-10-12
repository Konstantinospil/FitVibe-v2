import crypto from "crypto";
export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
export const newJti = () => crypto.randomUUID();
