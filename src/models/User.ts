import type { ObjectId } from "mongoose";
import bcrypt from 'bcrypt'
import type { Hash } from "node:crypto";


class User {
  id: string = crypto.randomUUID();
  email: string;
  username: string;
  displayName: string;
  private passwordHash: Promise<string>;
  firstName: string;
  lastName: string;
  accountCreatedAt: Date;


  constructor(
    id: ObjectId,
    username: string,
    displayName: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    accountCreatedAt: Date
  ) {

    this.email = email
    this.passwordHash = bcrypt.hash(password, 12);
    this.username = username;
    this.displayName = displayName;
    this.firstName = firstName;
    this.lastName = lastName;
    this.accountCreatedAt = new Date();
  }

}