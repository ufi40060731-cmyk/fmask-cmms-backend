const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "尚未登入" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "登入已過期，請重新登入" });
  }
}

// role 可傳一個角色字串，或角色陣列（符合其中一個即可通過）
function requireRole(role) {
  const allowed = Array.isArray(role) ? role : [role];
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ error: "權限不足" });
    }
    next();
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, account: user.account, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "12h" }
  );
}

module.exports = { requireAuth, requireRole, signToken, JWT_SECRET };
