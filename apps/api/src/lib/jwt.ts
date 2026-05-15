import { SignJWT, jwtVerify } from "jose";

function getSecret(env: any): Uint8Array {
  const secret = env?.JWT_SECRET ?? process.env.JWT_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

export async function signToken(env: any): Promise<string> {
  return new SignJWT({ sub: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret(env));
}

export async function verifyToken(env: any, token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(env));
    return { sub: payload.sub as string };
  }
  catch { return null; }
}
