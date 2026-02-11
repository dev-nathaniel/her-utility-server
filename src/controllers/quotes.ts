import express from "express";
import Quote from "../models/Quote.js";
import { createQuoteService, sendQuoteService, getQuotesService } from "../services/quotes.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Get quotes
router.get("/", verifyToken, async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      status: req.query.status
    };
    const quotes = await getQuotesService(filters);
    return res.json({ quotes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch quotes" });
  }
});

// Create quote
router.post("/", verifyToken, async (req, res) => {
  try {
    const payload = req.body; 
    // payload: { business, site, requester, utilityType, questionnaire, suggestedPrice, notes, type, status }
    
    // Ensure createdBy is set to the current user (admin)
    // payload.createdBy = req.user.id; // If verifyToken adds user to req

    const quote = await createQuoteService(payload);
    
    // If status is "sent", trigger send logic immediately? 
    // Or let the client call send endpoint separately?
    // createQuoteService just saves it.
    
    if (payload.status === "sent") {
       // Auto-send if created with status sent
       await sendQuoteService((quote as any)._id.toString(), [], payload.createdBy);
    }

    return res.status(201).json(quote);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create quote" });
  }
});

// Get quote by id
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const q = await Quote.findById(req.params.id)
      .populate("requester recipients site createdBy business");
    if (!q) return res.status(404).json({ error: "Quote not found" });
    return res.json(q);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to get quote" });
  }
});

// Send quote (admin action)
router.post("/:id/send", verifyToken, async (req, res) => {
  try {
    const { recipients = [] } = req.body; 
    const result = await sendQuoteService(req.params.id as string, recipients, req.body.sentBy as string | undefined);
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to send quote" });
  }
});

export default router;