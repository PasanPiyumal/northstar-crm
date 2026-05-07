//User registers, validate input, hash password, and store in DB
const mongoose = require("mongoose");
// Import mongoose for schema and model creation

// Schema for application users
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String, // User full name
      required: true,  // Name is mandatory
      trim: true, // Removes extra spaces
    },
    email: {
      type: String, // User email address
      required: true, // Email is mandatory
      unique: true, // No duplicate emails allowed
      lowercase: true, // Convert email to lowercase
      trim: true, // Remove extra spaces
    },
    passwordHash: {
      type: String, // Stores encrypted/hashed password
      required: true,
    },
  },
  { timestamps: true }, // Automatically adds createdAt and updatedAt fields
);
// Export User model for authentication operations
module.exports = mongoose.model("User", userSchema);