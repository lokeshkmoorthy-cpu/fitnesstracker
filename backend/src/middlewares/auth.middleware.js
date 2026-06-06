const requireAuthMiddleware = (_req, res) => {
  res.status(501).json({ error: "Not wired yet" });
};
export {
  requireAuthMiddleware
};
