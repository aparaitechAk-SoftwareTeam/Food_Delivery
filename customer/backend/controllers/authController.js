const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "foodexpress_jwt_fallback_secret_key_12345", { expiresIn: "7d" });

exports.register = async (req, res) => {
  const { name, email, password, phone, referredByCode } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error("Email already registered");
  }
  const hashed = await bcrypt.hash(password, 10);

  // Generate unique referral code
  let refCode;
  let exists = true;
  while (exists) {
    refCode = "REF" + Math.random().toString(36).substring(2, 6).toUpperCase();
    const existingCodeUser = await User.findOne({ referralCode: refCode });
    if (!existingCodeUser) exists = false;
  }

  // Check referred by code
  let referredBy = undefined;
  if (referredByCode) {
    const referrer = await User.findOne({ referralCode: referredByCode.toUpperCase() });
    if (referrer) {
      referredBy = referrer._id;
    }
  }

  const user = await User.create({
    name,
    email,
    phone,
    password: hashed,
    referralCode: refCode,
    referredBy,
  });
  
  // Create cashback reward for new user
  const cashbackService = require("../services/cashbackService");
  await cashbackService.createRewardForNewUser(user._id);

  res.status(201).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      walletBalance: user.walletBalance,
      isGoldMember: user.isGoldMember,
      goldExpiry: user.goldExpiry,
      referralCode: user.referralCode,
    },
    token: generateToken(user._id),
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  // Find user by email or phone
  const user = await User.findOne({ $or: [{ email }, { phone: email }] });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      walletBalance: user.walletBalance,
      isGoldMember: user.isGoldMember,
      goldExpiry: user.goldExpiry,
      referralCode: user.referralCode,
    },
    token: generateToken(user._id),
  });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  

  const user = await User.findOne({ $or: [{ email }, { phone: email }] });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpires = expires;
  await user.save();
  console.log(`[ForgotPassword] Generated OTP: ${otp} for User: ${email}`);
  res.json({ message: "OTP sent successfully to your email", otp });
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  

  const user = await User.findOne({ $or: [{ email }, { phone: email }] });
  if (!user || user.resetPasswordOTP !== otp || user.resetPasswordOTPExpires < new Date()) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }
  res.json({ message: "OTP verified successfully" });
};

exports.resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;

  

  const user = await User.findOne({ $or: [{ email }, { phone: email }] });
  if (!user || user.resetPasswordOTP !== otp || user.resetPasswordOTPExpires < new Date()) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  const hashed = await bcrypt.hash(password, 10);
  user.password = hashed;
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpires = undefined;
  await user.save();
  res.json({ message: "Password reset successfully" });
};

exports.googleLogin = async (req, res) => {
  const { email, name, photoUrl, phone } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required for Google Sign-In");
  }

  let user = await User.findOne({ email });

  if (!user) {
    // Generate a secure hashed placeholder password since they authenticate via Google/Firebase
    const placeholderPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const hashed = await bcrypt.hash(placeholderPassword, 10);

    // Generate unique referral code
    let refCode;
    let exists = true;
    while (exists) {
      refCode = "REF" + Math.random().toString(36).substring(2, 6).toUpperCase();
      const existingCodeUser = await User.findOne({ referralCode: refCode });
      if (!existingCodeUser) exists = false;
    }

    user = await User.create({
      name: name || email.split("@")[0],
      email,
      phone: phone || "",
      password: hashed,
      referralCode: refCode,
      profilePhoto: photoUrl || "",
    });

    // Create cashback reward for new user
    try {
      const cashbackService = require("../services/cashbackService");
      await cashbackService.createRewardForNewUser(user._id);
    } catch (err) {
      console.log("Error creating welcome cashback reward:", err.message);
    }
  }

  if (user.isBlocked) {
    res.status(401);
    throw new Error("Your account has been blocked. Contact support.");
  }

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      walletBalance: user.walletBalance,
      isGoldMember: user.isGoldMember,
      goldExpiry: user.goldExpiry,
      referralCode: user.referralCode,
    },
    token: generateToken(user._id),
  });
};

exports.me = async (req, res) => {
  res.json({
    user: {
      id: req.user.id || req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      walletBalance: req.user.walletBalance,
      isGoldMember: req.user.isGoldMember,
      goldExpiry: req.user.goldExpiry,
      referralCode: req.user.referralCode,
    }
  });
};

exports.logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};
