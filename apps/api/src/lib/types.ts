import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { PinoLogger } from "hono-pino";
import type { BASE_PATH } from "./constants";

export type AppEnv = {
  Bindings: {
    APP_URL: string;
    DASHBOARD_PASSWORD: string;
    JWT_SECRET: string;
    LOG_LEVEL: string;
    NODE_ENV: string;
    ASSETS: Fetcher;
    DB: D1Database;
    STORAGE: R2Bucket;
  };
  Variables: {
    logger: PinoLogger;
    authed?: boolean;
    userId?: string;
  };
};

export type AppOpenAPI = OpenAPIHono<AppEnv, {}, typeof BASE_PATH>;
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppEnv>;
