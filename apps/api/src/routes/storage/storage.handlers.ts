import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppRouteHandler } from "../../lib/types";
import type { UploadFileRoute } from "./storage.routes";

export const uploadFile: AppRouteHandler<UploadFileRoute> = async (c) => {
  const body = await c.req.parseBody();
  const file = body.file as File;
  if (!file) return c.json({ message: "No file" } as any, 400);
  const key = `${crypto.randomUUID()}-${file.name}`;
  await (c.env as any).STORAGE.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  const appUrl = (c.env as any)?.APP_URL ?? "";
  return c.json({ key, url: `${appUrl}/api/storage/${key}` }, HttpStatusCodes.OK);
};
