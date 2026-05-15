import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

export const healthCheck = createRoute({
  tags: ["System"], method: "get", path: "/health",
  responses: { [HttpStatusCodes.OK]: jsonContent(z.object({ status: z.literal("ok"), timestamp: z.string() }), "Health check") },
});
export type HealthCheckRoute = typeof healthCheck;
