const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (process.env.MOCK_DB === "true") {
    const { users } = require("../config/mockDataStore");
    const existing = users.find(u => u.email === email);
    if (existing) {
      res.status(400);
      throw new Error("Email already registered");
    }
    const newId = `user-${users.length + 1}`;
    const mockUser = {
      _id: newId,
      id: newId,
      name,
      email,
      phone: phone || "",
      addresses: [
        {
          _id: `addr-u${users.length + 1}-1`,
          label: "Home",
          line1: "123 Street",
          city: "Baramati",
          state: "Maharashtra",
          postalCode: "413102",
          country: "India",
          isDefault: true
        }
      ]
    };
    users.push(mockUser);
    return res.status(201).json({
      user: { id: mockUser.id, name: mockUser.name, email: mockUser.email, phone: mockUser.phone },
      token: generateToken(mockUser.id),
    });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error("Email already registered");
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, phone, password: hashed });
  res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
    token: generateToken(user._id),
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (process.env.MOCK_DB === "true") {
    const { users } = require("../config/mockDataStore");
    // Find by email or phone
    const user = users.find(u => u.email === email || u.phone === email);
    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password");
    }
    // We allow logging in to any mock user with any password for easy testing
    return res.json({
      user: { id: user.id || user._id, name: user.name, email: user.email, phone: user.phone },
      token: generateToken(user.id || user._id),
    });
  }

  // Find user by email or phone
  const user = await User.findOne({ $or: [{ email }, { phone: email }] });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  res.json({
    user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
    token: generateToken(user._id),
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (process.env.MOCK_DB === "true") {
    const { users } = require("../config/mockDataStore");
    const user = users.find(u => u.email === email || u.phone === email);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    return res.json({ message: "Password reset link sent to your email (mock)" });
  }

  const user = await User.findOne({ $or: [{ email }, { phone: email }] });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ message: "Password reset link sent to your email (mock)" });
};
