const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized");
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "foodexpress_jwt_fallback_secret_key_12345");
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
