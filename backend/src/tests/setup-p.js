import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const TEST_DB_URI =
  process.env.MONGO_TEST_URI || "mongodb://127.0.0.1:27017/test-turnos";

export async function connectTestDB() {
  await mongoose.connect(TEST_DB_URI);
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

export async function closeTestDB() {
  await mongoose.connection.close();
}

export function generateTestToken(payload) {
  const secret = process.env.JWT_SECRET || "clave_secreta_para_desarrollo";
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}