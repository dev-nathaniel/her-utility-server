import Quote from "../models/Quote.js";
import User from "../models/User.js";
import {sendEmail} from "../utils/sendEmail.js";

export async function createQuoteService(payload: any) {
  // payload: { requester, site, utilityType, questionnaire, suggestedPrice, createdBy }
  const q = await Quote.create({
    requester: payload.requester,
    site: payload.site,
    utilityType: payload.utilityType,
    questionnaire: payload.questionnaire,
    suggestedPrice: payload.suggestedPrice,
    currency: payload.currency || "GBP",
    createdBy: payload.createdBy || payload.requester,
    status: "draft",
  });
  return q;
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