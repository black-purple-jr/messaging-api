import app from "@/app.js";
import connectDatabase from "@/config/database.js";
import { PORT } from "@/config/env.js";

export default async function startServer() {
  try {
    await connectDatabase();

    return app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    throw error;
  }
}