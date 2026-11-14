import UserModel from "@/models/User.model.js";
import * as pwd from "@/utils/password.js";
import { generateAccessToken } from "@/utils/jwt.js";



export async function registerUser(email: string, username: string, password: string, firstName: string, lastName: string, displayName: string) {
  // Cheking if the user already exists

  const userExists = await UserModel.exists({
    $or: [
      { email },
      { username }
    ]
  });

  if (userExists) throw new Error("User already exists, try loging in");

  // When the email or the username aren't registered, a new user is created

  const passwordHash = await pwd.hashPassword(password);

  const user = await UserModel.create({
    username,
    email,
    passwordHash,
    firstName,
    lastName,
    displayName
  });
  

  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName
    }

  }
};

export async function loginUser(identifier: string, password: string) {
  // Cheking if the user exists or not

  const user = await UserModel.findOne({
    $or: [
      { email: identifier },
      { username: identifier }
    ]
  }).select("+passwordHash");

  if (!user) throw new Error("Invalid credentials");

  const isPasswordValid = await pwd.verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) throw new Error("Invalid credentials");

  const accessToken: string = generateAccessToken(user._id.toString());


  return {
    accessToken: accessToken,
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName
    }
  }
};