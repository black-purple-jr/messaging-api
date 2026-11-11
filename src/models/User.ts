import { Types } from "mongoose";
import bcrypt from 'bcrypt'
import { hashPassword } from "../utils/password.js";

export default class User {
  id: Types.ObjectId;
  email: string;
  username: string;
  displayName: string;
  private passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: Date;


  private constructor(
    username: string,
    displayName: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {

    this.id = new Types.ObjectId();
    this.email = email;
    this.username = username;
    this.displayName = displayName;
    this.passwordHash = password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.createdAt = new Date();
  }

  static async create(
    username: string,
    displayName: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<User> {
    const hash = await hashPassword(password);

    return new User(
      username,
      displayName,
      email,
      hash,
      firstName,
      lastName
    );
  }

}