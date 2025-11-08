import express from "express";
import Quote from "../models/Quote.js";
import { createQuoteService, sendQuoteService } from "../services/quotes.js";
const router = express.Router();

// Create quote (questionnaire -> quote)
router.post("/", async (req, res) => {
  try {
    const payload = req.body; // { requester, site, utilityType, questionnaire, createdBy? }
    const quote = await createQuoteService(payload);
    return res.status(201).json(quote);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create quote" });
  }
});

// Get quote by id
router.get("/:id", async (req, res) => {
  try {
    const q = await Quote.findById(req.params.id).populate("requester recipients site createdBy");
    if (!q) return res.status(404).json({ error: "Quote not found" });
    return res.json(q);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to get quote" });
  }
});

// Send quote (admin action) — sets status to sent and notifies recipients
router.post("/:id/send", async (req, res) => {
  try {
    const { recipients = [] } = req.body; // optional array of userIds or emails
    const result = await sendQuoteService(req.params.id, recipients, req.body.sentBy);
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to send quote" });
  }
});

export default router;