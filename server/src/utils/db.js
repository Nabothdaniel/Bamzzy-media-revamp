import mongoose from "mongoose"

export async function connectDb() {
  try {


    const MONGO_URI = process.env.MONGO_URI 


    if (!MONGO_URI) {
      console.error("No MongoDB URI provided.")
      return
    }

    await mongoose.connect(MONGO_URI);

    console.log("✅ Connected to MongoDB")
  } catch (err) {
    console.warn("⚠️ Skipped MongoDB connection (offline or unreachable).", err.message)
  }
}

export default connectDb;
