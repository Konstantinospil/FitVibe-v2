import jwt from "jsonwebtoken";
import { RSA_KEYS } from "../config/env.js";
import { env } from "../config/env.js";
import { newJti } from "../utils/hash.js";

export function signAccessToken(claims: Record<string, any>){
  return jwt.sign(claims, RSA_KEYS.privateKey, { algorithm: "RS256", expiresIn: env.ACCESS_TOKEN_TTL });
}

export function signRefreshToken(sub: string, jti: string){
  return jwt.sign({ sub, jti, typ: "refresh" }, RSA_KEYS.privateKey, { algorithm: "RS256", expiresIn: env.REFRESH_TOKEN_TTL });
}

export function verifyAccess(token: string){
  return jwt.verify(token, RSA_KEYS.publicKey, { algorithms: ["RS256"] });
}

export function verifyRefresh(token: string){
  return jwt.verify(token, RSA_KEYS.publicKey, { algorithms: ["RS256"] });
}

export function issueTokenPair(user: { id: string; username: string }){
  const jti = newJti();
  const access = signAccessToken({ sub: user.id, username: user.username, role: "user" });
  const refresh = signRefreshToken(user.id, jti);
  return { access, refresh, jti };
}
