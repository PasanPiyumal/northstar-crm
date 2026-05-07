//fetch dashboard analytics/summary data from leads.
const express = require("express");
const Lead = require("../models/Lead");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
/* ---------------------------------------------------
   PUBLIC DASHBOARD SUMMARY
   No authentication required
--------------------------------------------------- */

router.get("/summary/public", async (req, res) => {
  try {
    // Get all leads from database
    // Sort newest updated first
    const leads = await Lead.find().sort({ updatedAt: -1 }).lean();
    
    console.log(`[DASHBOARD PUBLIC] Total leads in system: ${leads.length}`);
    // Calculate dashboard metrics
    const metrics = leads.reduce(
      (accumulator, lead) => {
        accumulator.totalLeads += 1;

        // Add estimated deal value
        accumulator.totalEstimatedDealValue += Number(lead.estimatedDealValue || 0);

        if (lead.status === "New") accumulator.newLeads += 1;
        if (lead.status === "Qualified") accumulator.qualifiedLeads += 1;
        if (lead.status === "Won") {

        // Add won deal values
          accumulator.wonLeads += 1;
          accumulator.totalWonDealValue += Number(lead.estimatedDealValue || 0);
        }
        if (lead.status === "Lost") accumulator.lostLeads += 1;

        return accumulator;
      },
      {
        totalLeads: 0,
        newLeads: 0,
        qualifiedLeads: 0,
        wonLeads: 0,
        lostLeads: 0,
        totalEstimatedDealValue: 0,
        totalWonDealValue: 0,
      },
    );

    // Extract notes from all leads
    const recentNotes = leads
      .flatMap((lead) =>
        (lead.notes || []).map((note) => ({
          _id: String(note._id),
          leadId: String(lead._id),
          leadName: lead.leadName,
          content: note.content,
          createdBy: note.createdBy,
          createdAt: note.createdAt,
        })),
      )

      // Sort latest notes first
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )

      // Only keep latest 6 notes
      .slice(0, 6);

    console.log(`[DASHBOARD PUBLIC] Returning metrics with ${recentNotes.length} recent notes`);

    return res.json({ metrics, recentNotes });
  } catch (error) {
    console.error("[DASHBOARD PUBLIC] Error:", error);
    return res.status(500).json({ message: "Unable to load dashboard summary." });
    /* ---------------------------------------------------
   PROTECTED ROUTES BELOW
--------------------------------------------------- */

// All routes below require authentication
  }
});

// Protected endpoint - returns user-specific data
router.use(authMiddleware);

/* ---------------------------------------------------
   PRIVATE USER DASHBOARD SUMMARY
--------------------------------------------------- */
router.get("/summary", async (req, res) => {
  try {
    // Only fetch leads owned by logged-in user
    const leads = await Lead.find({ owner: req.user.id }).sort({ updatedAt: -1 }).lean();
    
    console.log(`[DASHBOARD SUMMARY] User ${req.user.id} has ${leads.length} leads`);
    console.log(`[DASHBOARD SUMMARY] Leads with notes:`, leads.filter(l => l.notes && l.notes.length > 0).map(l => ({ name: l.leadName, noteCount: l.notes.length })));
    // Calculate metrics
    const metrics = leads.reduce(
      (accumulator, lead) => {
        accumulator.totalLeads += 1;
        accumulator.totalEstimatedDealValue += Number(lead.estimatedDealValue || 0);

        if (lead.status === "New") accumulator.newLeads += 1;
        if (lead.status === "Qualified") accumulator.qualifiedLeads += 1;
        if (lead.status === "Won") {
          accumulator.wonLeads += 1;
          accumulator.totalWonDealValue += Number(lead.estimatedDealValue || 0);
        }
        if (lead.status === "Lost") accumulator.lostLeads += 1;

        return accumulator;
      },
      {
        totalLeads: 0,
        newLeads: 0,
        qualifiedLeads: 0,
        wonLeads: 0,
        lostLeads: 0,
        totalEstimatedDealValue: 0,
        totalWonDealValue: 0,
      },
    );
    // Get latest notes
    const recentNotes = leads
      .flatMap((lead) =>
        (lead.notes || []).map((note) => ({
          _id: String(note._id),
          leadId: String(lead._id),
          leadName: lead.leadName,
          content: note.content,
          createdBy: note.createdBy,
          createdAt: note.createdAt,
        })),
      )
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      .slice(0, 6);

    console.log(`[DASHBOARD SUMMARY] Returning ${recentNotes.length} recent notes`);

    return res.json({ metrics, recentNotes });
  } catch (error) {
    console.error("[DASHBOARD SUMMARY] Error:", error);
    return res.status(500).json({ message: "Unable to load dashboard summary." });
  }
});

module.exports = router;