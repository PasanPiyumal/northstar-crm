//This handles: register new users, login existing users, get current logged-in user
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
// Creates Express router for auth routes

// Generate JWT token for authenticated users
function buildToken(user) {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
} // Payload data, Secret key, Token expires in 7 days

// Build safe user response object
// Avoids sending passwordHash to frontend
function buildUserPayload(user) {
  return {
    id: String(user._id), 
    name: user.name,
    email: user.email,
  };
}
/* ---------------- REGISTER ---------------- */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
      // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ message: "An account with that email already exists." });
    }
    // Hash password before saving
    const passwordHash = await bcrypt.hash(password, 12);
    // Create new user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    });
    // Return token + safe user data
    return res.status(201).json({
      token: buildToken(user),
      user: buildUserPayload(user),
    });
  } catch {
    return res.status(500).json({ message: "Unable to create account." });
  }
});

/* ---------------- LOGIN ---------------- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    // User not found
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    // Compare entered password with stored hash
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    // Wrong password
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    // Successful login
    return res.json({
      token: buildToken(user), // Return JWT token
      user: buildUserPayload(user), // Return safe user data
    });
  } catch {
    return res.status(500).json({ message: "Unable to sign in." });
  }
});
/* ---------------- CURRENT USER ---------------- */
router.get("/me", authMiddleware, async (req, res) => {
  return res.json({ user: req.user }); // Return authenticated user details
});

module.exports = router;