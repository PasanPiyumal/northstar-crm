//connect the app to MongoDB only once and reuse the connection.
const mongoose = require("mongoose");
// Import mongoose library for MongoDB connection and schema management

// Database connection function
async function connectDB() {
  // Check whether database is already connected
  // readyState >= 1 means connected or connecting
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  // Read MongoDB connection string from environment variable
  const mongoUri = process.env.MONGODB_URI;
  // Throw error if connection string is missing
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required.");
  }
  // Connect to MongoDB database
  await mongoose.connect(mongoUri, {
    // Use database name from env variable
    // If not provided, use default database name
    dbName: process.env.MONGODB_DB || "northstar_crm",
  });
  // Return active mongoose connection
  return mongoose.connection;
}

module.exports = connectDB; // Export function for use in other backend files