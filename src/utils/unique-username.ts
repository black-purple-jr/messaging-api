import * as userRepository from "@/repositories/user.js";

export default async function generateUniqueUsername(email: string) {
  const emailPrefix = email.split("@")[0] ?? "user";

  const baseUsername =
    emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 25) || "user";

  let username = baseUsername;
  let counter = 2;

  while (await userRepository.findByUsername(username)) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
}