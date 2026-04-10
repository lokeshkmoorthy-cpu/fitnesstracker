import type { RequestHandler } from "express";

export const workoutsController: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: "Not wired yet" });
};

export const activityDailyController: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: "Not wired yet" });
};

export const attendanceController: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: "Not wired yet" });
};

export const goalsController: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: "Not wired yet" });
};

export const streaksController: RequestHandler = async (_req, res) => {
  res.status(501).json({ error: "Not wired yet" });
};
