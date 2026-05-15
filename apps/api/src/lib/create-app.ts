import { notFound, onError } from "stoker/middlewares";
import type { AppOpenAPI } from "./types";
import { BASE_PATH } from "./constants";
import createRouter from "./create-router";
import { pinoLogger } from "../middlewares/pino-logger";

export default function createApp() {
  const app = (
    createRouter()
      .use("*", async (c, next) => {
        if (c.req.path.startsWith(BASE_PATH)) return next();
        const assets: Fetcher | undefined = (c.env as any)?.ASSETS;
        if (!assets) return next();
        const res = await assets.fetch(c.req.raw);
        if (res.status !== 404 || c.req.method !== "GET") return res;
        const url = new URL(c.req.raw.url);
        return assets.fetch(new Request(new URL("/index.html", url).toString(), { headers: c.req.raw.headers, method: "GET" }));
      })
      .basePath(BASE_PATH) as AppOpenAPI
  );

  app.use("*", async (c, next) => {
    const origin = c.req.header("Origin");
    const appUrl = (c.env as any)?.APP_URL ?? process.env.APP_URL;
    const allowed = [appUrl, "http://localhost:5173", "http://localhost:8787", "http://localhost:3000"].filter(Boolean) as string[];
    if (c.req.method === "OPTIONS") {
      if (origin && allowed.includes(origin)) {
        return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Credentials": "true", "Access-Control-Max-Age": "86400" } });
      }
      return new Response(null, { status: 403 });
    }
    await next();
    if (origin && allowed.includes(origin)) {
      c.header("Access-Control-Allow-Origin", origin);
      c.header("Access-Control-Allow-Credentials", "true");
    }
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  });

  app.use(pinoLogger());
  app.notFound(notFound);
  app.onError(onError);
  return app;
}
