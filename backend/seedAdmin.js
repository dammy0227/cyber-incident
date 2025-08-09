// seed/seedAdmin.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const Admin = require("./models/Admin");

dotenv.config();

const seedAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Admin.findOne({ email: "admin@secure.ai" });
  if (existing) {
    console.log("✅ Admin already exists.");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = new Admin({
    email: "admin@secure.ai",
    password: hashedPassword,
  });

  await admin.save();

  console.log("✅ Admin seeded: admin@secure.ai / admin123");
  process.exit(0);
};

seedAdmin();
