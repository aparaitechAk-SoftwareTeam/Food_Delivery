const bcrypt = require("bcryptjs");
const User = require("../models/User");

const initializeDefaultUsers = async () => {
  try {
    const email = "kshitijkamble966@gmail.com";
    const passwordText = "Sandy@28";
    
    let user = await User.findOne({ email });
    const hashedPassword = await bcrypt.hash(passwordText, 10);

    if (user) {
      // User exists, make sure password is Sandy@28
      const isMatch = await bcrypt.compare(passwordText, user.password);
      if (!isMatch) {
        console.log(`[AutoSeed] Resetting password for existing user: ${email} to Sandy@28`);
        user.password = hashedPassword;
        await user.save();
        console.log(`[AutoSeed] Password updated successfully for: ${email}`);
      } else {
        console.log(`[AutoSeed] Password for ${email} is already correct.`);
      }
    } else {
      // User does not exist, create it
      console.log(`[AutoSeed] User account missing. Creating account for: ${email}`);
      let refCode = "REF" + Math.random().toString(36).substring(2, 6).toUpperCase();
      
      await User.create({
        name: "Kshitij Kamble",
        email: email,
        password: hashedPassword,
        phone: "9876543210",
        role: "customer",
        referralCode: refCode,
        walletBalance: 150.00,
      });
      console.log(`[AutoSeed] User account created successfully for: ${email}`);
    }
  } catch (error) {
    console.error("Error initializing default user:", error.message);
  }
};

module.exports = initializeDefaultUsers;
