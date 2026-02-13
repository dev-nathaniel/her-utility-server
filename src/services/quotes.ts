import Quote from "../models/Quote.js";
import User from "../models/User.js";
import {sendEmail} from "../utils/sendEmail.js";

export async function createQuoteService(payload: any) {
  // payload: { business, site, requester, utilityType, questionnaire, suggestedPrice, createdBy, notes, type, status }
  const q = await Quote.create({
    business: payload.business,
    site: payload.site,
    requester: payload.requester,
    utilityType: payload.utilityType,
    questionnaire: payload.questionnaire,
    suggestedPrice: payload.suggestedPrice,
    currency: payload.currency || "GBP",
    createdBy: payload.createdBy || payload.requester, // Fallback to requester if createdBy distinct logic missing
    status: payload.status || "draft",
    notes: payload.notes,
    type: payload.type || "new",
  });
  return q;
}

export async function getQuotesService(filters: any) {
  const query: any = {};
  
  if (filters.search) {
     // Search logic handled by aggregation or simple text search if enabled. 
     // For now, maybe searching by ID?
     // Or filtering by status.
  }

  if (filters.status) {
    query.status = filters.status;
  }
  
  // Basic search implementation for populated fields requires aggregation, but simple find for now
  const quotes = await Quote.find(query)
    .populate("business", "name")
    .populate("requester", "email firstName lastName")
    .populate("site", "name address")
    .sort({ createdAt: -1 });
    
  // Client side filtering for text search if needed, or implement complex aggregation here
  if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return quotes.filter((q: any) => 
          q.business?.name?.toLowerCase().includes(searchLower) ||
          q._id.toString().includes(searchLower)
      );
  }

  return quotes;
}

export async function sendQuoteService(quoteId: string, recipients: string[] = [], sentBy?: string) {
  const quote = await Quote.findById(quoteId);
  if (!quote) throw new Error("Quote not found");

  // add recipients if provided
  if (recipients.length) {
    // merge unique ObjectId strings
    const existing = (quote.recipients || []).map(String);
    const toAdd = recipients.filter(r => !existing.includes(String(r)));
    quote.recipients = [...new Set([...existing, ...toAdd])] as any;
  }

  quote.status = "sent";
  await quote.save();

  // Try to resolve recipient emails and send notifications
  const users = await User.find({ _id: { $in: quote.recipients } });
  for (const u of users) {
    try {
      await sendEmail({
        from: 'adebayoolowofoyeku@gmail.com',
        to: (u as any).email,
        subject: `New Quote (${quote.utilityType})`,
        html: `You have received a new quote. Quote id: ${quote._id}`,
      });
    } catch (e) {
      console.warn("Failed to send email to:", (u as any).email, e);
    }
  }

  return quote;
}