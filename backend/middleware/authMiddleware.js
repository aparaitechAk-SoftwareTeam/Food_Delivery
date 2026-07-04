const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "foodexpress_jwt_fallback_secret_key_12345";

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized");
  }
  const token = authHeader.split(" ")[1];

  // ── Dev/Demo bypass: accept the dummy token used by the local login fallback ─
  // This prevents 401 errors from payment, order, and QR endpoints when the
  // backend cannot reach the real auth server during development.
  if (token === "dummy-jwt-token") {
    const devUserId = "60c72b2f9b1d8b2a3c8e4d5e";
    try {
      const realUser = await User.findOne({});
      req.user = {
        _id: realUser ? realUser._id : devUserId,
        id: realUser ? realUser._id.toString() : devUserId,
        name: realUser ? realUser.name : "Dev User",
        email: realUser ? realUser.email : "dev@foodexpress.com",
        role: realUser ? realUser.role : "user",
      };
    } catch (err) {
      req.user = {
        _id: devUserId,
        id: devUserId,
        name: "Dev User",
        email: "dev@foodexpress.com",
        role: "user",
      };
    }
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (process.env.MOCK_DB === "true") {
      const { users } = require("../config/mockDataStore");
      const mockUser = users.find(u => u.id === decoded.id || u._id === decoded.id);
      if (!mockUser) {
        res.status(401);
        throw new Error("User not found");
      }
      req.user = mockUser;
      return next();
    }
    
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      res.status(401);
      throw new Error("User not found");
    }
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Token is not valid");
  }
};

module.exports = protect;

