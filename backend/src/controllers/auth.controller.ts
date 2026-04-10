import type { RequestHandler } from "express";

export const signupController: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: "Not wired yet" });
};

export const loginController: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: "Not wired yet" });
};

export const logoutController: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: "Not wired yet" });
};

export const meController: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: "Not wired yet" });
};
