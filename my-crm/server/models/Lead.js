//create a leadSchema, validate  and store in the DB
const mongoose = require("mongoose");
// Import mongoose for schema and model creation

// Schema for notes attached to each lead
const noteSchema = new mongoose.Schema(
  {
    content: {
      type: String,  // Note text
      required: true, // Cannot be empty
      trim: true, // Remove extra spaces
    },
    createdBy: {
      type: String, // Name/email of person creating note
      required: true,
      trim: true,
    },
  },
  { timestamps: true }, // Automatically adds createdAt and updatedAt
);

const leadSchema = new mongoose.Schema( // Main schema for CRM leads
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId, // Reference to User model ID
      ref: "User", // Relationship with User collection
      required: true,
      index: true, // Improves query performance
    },
    leadName: {
      type: String, // Customer/lead name
      required: true,
      trim: true,
    },
    companyName: {
      type: String, // Company name
      required: true,
      trim: true,
    },
    email: {
      type: String, // Lead email address
      required: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String, // Optional phone number
      default: "",
      trim: true,
    },
    leadSource: {
      type: String, // Where lead came from
      required: true,
      trim: true,
    },
    assignedSalesperson: {
      type: String, // Assigned sales rep
      default: "",
      trim: true,
    },
    status: {
      type: String, // Current lead stage
      required: true,
      // Allowed values only
      enum: ["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"],
      default: "New", // Default status
    },
    estimatedDealValue: {
      type: Number, // Potential deal value
      required: true,
      min: 0, // Cannot be negative
      default: 0,
    },
    notes: {
      type: [noteSchema], // Array of notes
      default: [],
    },
  },
  { timestamps: true }, // Adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("Lead", leadSchema); // Export Lead model for CRUD operations