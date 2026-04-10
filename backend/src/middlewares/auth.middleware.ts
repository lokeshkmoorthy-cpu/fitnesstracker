import type { RequestHandler } from "express";

export const requireAuthMiddleware: RequestHandler = (_req, res) => {
  res.status(501).json({ error: "Not wired yet" });
};
