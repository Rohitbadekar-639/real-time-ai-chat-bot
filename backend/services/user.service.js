import userModel from "../models/user.model.js";

export const createUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and Password are required");
  }

  const hashedPassword = await userModel.hashPassword(password);

  const user = await userModel.create({
    email,
    password: hashedPassword,
  });

  return user;
};

export const getAllUsers = async ({ userId, email }) => {
  const filters = [];
  if (userId) {
    filters.push({ _id: { $ne: userId } });
  }
  if (email) {
    filters.push({ email: { $ne: String(email).toLowerCase() } });
  }

  const users = await userModel
    .find(filters.length ? { $and: filters } : {})
    .select("email createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return users;
};
