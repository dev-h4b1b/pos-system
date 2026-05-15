import type { router } from "@pos-system/api/routes";
import { hc } from "hono/client";

// eslint-disable-next-line unused-imports/no-unused-vars
const client = hc<router>("");
export type Client = typeof client;

export default (...args: Parameters<typeof hc>): Client => hc<router>(...args);
