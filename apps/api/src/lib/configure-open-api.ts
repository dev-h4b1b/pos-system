import { Scalar } from "@scalar/hono-api-reference";
import type { AppOpenAPI } from "./types";
import { BASE_PATH } from "./constants";

export default function configureOpenAPI(app: AppOpenAPI, version = "0.1.0", title = "pos-system API") {
  const isProd = typeof process !== "undefined" ? process.env.NODE_ENV === "production" : false;
  if (!isProd) {
    app.doc("/doc", { openapi: "3.0.0", info: { version, title } });
    app.get("/reference", Scalar({ theme: "kepler", layout: "classic", url: `${BASE_PATH}/doc`, defaultHttpClient: { targetKey: "js", clientKey: "fetch" }, showSidebar: true }));
  }
  else {
    app.get("/doc", c => c.notFound());
    app.get("/reference", c => c.notFound());
  }
}
