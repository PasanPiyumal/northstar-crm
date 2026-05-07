// manage CRM leads and notes. This file handles: get all leads, get one lead, create/update/delete leads, add/delete notes
const express = require("express");
const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Protect all lead routes
router.use(authMiddleware);
/* ----------------------------------------
   BUILD FILTER QUERY
---------------------------------------- */
function buildLeadQuery(req) {
  // Only fetch logged-in user's leads
  const query = { owner: req.user.id };
  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }
  // Filter by source
  if (req.query.leadSource) {
    query.leadSource = req.query.leadSource;
  }
  // Filter by salesperson
  if (req.query.assignedSalesperson) {
    query.assignedSalesperson = req.query.assignedSalesperson;
  }
  // Search feature
  if (req.query.search) {
    const searchPattern = new RegExp(req.query.search, "i");
    query.$or = [
      { leadName: searchPattern },
      { companyName: searchPattern },
      { email: searchPattern },
    ];
  }

  return query;
}
/* ----------------------------------------
   GET ALL LEADS
---------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const leads = await Lead.find(buildLeadQuery(req)).sort({ updatedAt: -1 }).lean();
    console.log(`[LEADS GET] User ${req.user.id} fetching ${leads.length} leads. Notes per lead:`, leads.map(l => ({ name: l.leadName, notes: l.notes ? l.notes.length : 0 })));
    return res.json({ leads });
  } catch (error) {
    console.error("[LEADS GET] Error:", error);
    return res.status(500).json({ message: "Unable to load leads." });
  }
});

/* ----------------------------------------
   GET SINGLE LEAD
---------------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    // Validate MongoDB object id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid lead id." });
    }

    const lead = await Lead.findOne({ _id: req.params.id, owner: req.user.id }).lean();

    if (!lead) {
      console.log(`[LEAD GET] Lead not found: leadId=${req.params.id}, userId=${req.user.id}`);
      return res.status(404).json({ message: "Lead not found." });
    }

    console.log(`[LEAD GET] Lead ${req.params.id} has ${lead.notes ? lead.notes.length : 0} notes`);

    return res.json({ lead });
  } catch (error) {
    console.error("[LEAD GET] Error:", error);
    return res.status(500).json({ message: "Unable to load lead." });
  }
});

/* ----------------------------------------
   CREATE NEW LEAD
---------------------------------------- */
router.post("/", async (req, res) => {
  try {
    const {
      leadName,
      companyName,
      email,
      phoneNumber = "",
      leadSource,
      assignedSalesperson = "",
      status = "New",
      estimatedDealValue = 0,
    } = req.body;
    // Required field validation
    if (!leadName || !companyName || !email || !leadSource) {
      return res.status(400).json({ message: "Lead name, company name, email, and source are required." });
    }

    const lead = await Lead.create({
      owner: req.user.id,
      leadName,
      companyName,
      email: email.toLowerCase(),
      phoneNumber,
      leadSource,
      assignedSalesperson,
      status,
      estimatedDealValue,
    });

    return res.status(201).json({ lead });
  } catch {
    return res.status(500).json({ message: "Unable to create lead." });
  }
});

/* ----------------------------------------
   UPDATE LEAD
---------------------------------------- */
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid lead id." });
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      {
        $set: {
          leadName: req.body.leadName,
          companyName: req.body.companyName,
          email: req.body.email?.toLowerCase(),
          phoneNumber: req.body.phoneNumber,
          leadSource: req.body.leadSource,
          assignedSalesperson: req.body.assignedSalesperson,
          status: req.body.status,
          estimatedDealValue: req.body.estimatedDealValue,
        },
      },
      { new: true, runValidators: true },
    ).lean();

    if (!lead) {
      return res.status(404).json({ message: "Lead not found." });
    }

    return res.json({ lead });
  } catch {
    return res.status(500).json({ message: "Unable to update lead." });
  }
});

/* ----------------------------------------
   DELETE LEAD
---------------------------------------- */
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid lead id." });
    }

    const deletedLead = await Lead.findOneAndDelete({ _id: req.params.id, owner: req.user.id }).lean();

    if (!deletedLead) {
      return res.status(404).json({ message: "Lead not found." });
    }

    return res.json({ message: "Lead deleted." });
  } catch {
    return res.status(500).json({ message: "Unable to delete lead." });
  }
});

/* ----------------------------------------
   ADD NOTE TO LEAD
---------------------------------------- */
router.post("/:id/notes", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid lead id." });
    }

    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Note content is required." });
    }

    console.log(`[NOTE CREATE] Adding note to lead ${req.params.id} by user ${req.user.name}`);
    
    // Use MongoDB $push for atomic note addition
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      {
        $push: {
          notes: {
            content: content.trim(),
            createdBy: req.user.name,
            createdAt: new Date(),
          }
        }
      },
      { new: true }
    );

    if (!lead) {
      console.log(`[NOTE CREATE] Lead not found: leadId=${req.params.id}, userId=${req.user.id}`);
      return res.status(404).json({ message: "Lead not found." });
    }

    console.log(`[NOTE CREATE] Note created successfully. Lead now has ${lead.notes.length} notes`);

    return res.status(201).json({ lead });
  } catch (error) {
    console.error("[NOTE CREATE] Error:", error);
    return res.status(500).json({ message: "Unable to add note." });
  }
});

/* ----------------------------------------
   DELETE NOTE
---------------------------------------- */
router.delete("/:id/notes/:noteId", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid lead id." });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.noteId)) {
      return res.status(400).json({ message: "Invalid note id." });
    }

    console.log(`[NOTE DELETE] Attempting to delete note ${req.params.noteId} from lead ${req.params.id}`);
    
    // Use MongoDB's $pull operator for atomic deletion
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { $pull: { notes: { _id: new mongoose.Types.ObjectId(req.params.noteId) } } },
      { new: true }
    );

    if (!lead) {
      console.log(`[NOTE DELETE] Lead not found: leadId=${req.params.id}, userId=${req.user.id}`);
      return res.status(404).json({ message: "Lead not found." });
    }

    console.log(`[NOTE DELETE] Note deleted successfully. Lead now has ${lead.notes.length} notes`);

    return res.json({ lead });
  } catch (error) {
    console.error("[NOTE DELETE] Error:", error);
    return res.status(500).json({ message: "Unable to delete note." });
  }
});

module.exports = router;