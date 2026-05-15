import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppRouteHandler } from "../../lib/types";
import type { HealthCheckRoute } from "./health.routes";
export const healthCheck: AppRouteHandler<HealthCheckRoute> = c =>
  c.json({ status: "ok" as const, timestamp: new Date().toISOString() }, HttpStatusCodes.OK);
