const bcrypt = require("bcryptjs");
const Admin = require("../models/admin.model");

const ADMIN_SEED = {
  name: "System Admin",
  email: "admin2@mail.com",
  password: "admin123",
  role: "admin",
  isActive: true,
};

const SALT_ROUNDS = 10;

const seedAdminUser = async () => {
  const normalizedEmail = ADMIN_SEED.email.trim().toLowerCase();
  const existingAdmin = await Admin.findOne({ email: normalizedEmail }).lean();

  if (existingAdmin) {
    console.log(`Admin already exists: ${normalizedEmail}`);
    return existingAdmin;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_SEED.password, SALT_ROUNDS);

  const adminDoc = {
    name: ADMIN_SEED.name,
    email: normalizedEmail,
    password: hashedPassword,
    role: ADMIN_SEED.role,
    isActive: ADMIN_SEED.isActive,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await Admin.collection.insertOne(adminDoc);
  console.log(`Admin seeded: ${normalizedEmail}`);

  return adminDoc;
};

module.exports = { seedAdminUser };
