import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { createMessageObjectSchema } from "stoker/openapi/schemas";

const LoginRequest = z.object({ password: z.string().min(1) });
const TokenResponse = z.object({ token: z.string() });
const MeResponse = z.object({ sub: z.string() });

export const login = createRoute({
  tags: ["Auth"], method: "post", path: "/auth/login",
  request: { body: jsonContentRequired(LoginRequest, "Password") },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(TokenResponse, "Logged in"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(createMessageObjectSchema("Invalid password"), "Unauthorized"),
  },
});
export const me = createRoute({
  tags: ["Auth"], method: "get", path: "/auth/me",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(MeResponse, "Current user"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(createMessageObjectSchema("Unauthorized"), "Unauthorized"),
  },
});

export type LoginRoute = typeof login;
export type MeRoute = typeof me;
