//main backend server file. Sets up Express server, connects to MongoDB, defines API routes for auth, leads, and dashboard data. Also seeds a default user if none exist.
const path = require("path");

// Load environment variables from .env.local first
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

// Load fallback environment variables from .env
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const authRoutes = require("./routes/auth");
const leadRoutes = require("./routes/leads");
const dashboardRoutes = require("./routes/dashboard");

// Create Express app
const app = express();

// Server port
const port = process.env.PORT || 4000;

// Allowed frontend URL for CORS
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

/* -----------------------------------------
   MIDDLEWARE
----------------------------------------- */

// Enable CORS
app.use(
  cors({
    origin: frontendUrl,
  }),
);

// Parse JSON request bodies
app.use(express.json());

/* -----------------------------------------
   HEALTH CHECK ROUTE
----------------------------------------- */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "northstar-crm-api" });
});

/* -----------------------------------------
   API ROUTES
----------------------------------------- */
// Authentication routes
app.use("/api/auth", authRoutes);
// Lead management routes
app.use("/api/leads", leadRoutes);
// Dashboard routes
app.use("/api/dashboard", dashboardRoutes);

/* -----------------------------------------
   DEFAULT ADMIN SEEDING
----------------------------------------- */
async function seedDefaultUser() {
  if (process.env.SEED_DEFAULT_USER === "false") {
    return;
  }
 
  // Count users in database
  const existingUserCount = await User.countDocuments();

  // If users already exist, do nothing
  if (existingUserCount > 0) {
    return;
  }

  // Hash default password
  const passwordHash = await bcrypt.hash("password123", 12);
  // Create default admin account
  await User.create({
    name: "Admin User",
    email: "admin@example.com",
    passwordHash,
    company: "Northstar CRM",
  });
}

/* -----------------------------------------
   START SERVER
----------------------------------------- */
async function startServer() {
  try {
    // Connect MongoDB
    await connectDB();
    // Seed default user
    await seedDefaultUser();
    // Start Express server
    app.listen(port, () => {
      console.log(`Northstar CRM API running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start the API server:", error);
    process.exit(1);
  }
}
// Run server
void startServer();