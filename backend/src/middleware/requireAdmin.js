import requireAuth from "./requireAuth.js";

export default function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user?.isAdmin) return res.status(403).json({ error: "Admin only" });
    next();
  });
}
