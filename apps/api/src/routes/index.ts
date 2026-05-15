import type { AppOpenAPI } from "../lib/types";
import { BASE_PATH } from "../lib/constants";
import createRouter from "../lib/create-router";
import health from "./health/health.index";
import auth from "./auth/auth.index";
import storage from "./storage/storage.index";

export function registerRoutes(app: AppOpenAPI) {
  return app
    .route("/", health)
    .route("/", auth)
    .route("/", storage);
}

export const router = registerRoutes(createRouter().basePath(BASE_PATH));
export type router = typeof router;
