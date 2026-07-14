const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

const initializeAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: "admin@foodexpress.com" });
    if (!adminExists) {
      console.log("Admin account missing. Creating default admin...");
      const hashedPassword = await bcrypt.hash("Admin@123", 10);
      await Admin.create({
        name: "System Admin",
        email: "admin@foodexpress.com",
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });
      console.log("Default admin created successfully.");
    }
  } catch (error) {
    console.error("Error initializing default admin:", error.message);
  }
};

module.exports = initializeAdmin;
