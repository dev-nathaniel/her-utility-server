import mongoose, { Schema, Document } from "mongoose";

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface IQuote extends Document {
  requester: mongoose.Types.ObjectId; // user who requested the quote
  recipients: mongoose.Types.ObjectId[]; // users who receive quote (admins / suppliers / users)
  site?: mongoose.Types.ObjectId;
  utilityType: string;
  questionnaire: Record<string, any>;
  suggestedPrice?: number;
  currency?: string;
  status: QuoteStatus;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
}

const QuoteSchema: Schema = new Schema<IQuote>(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipients: [{ type: Schema.Types.ObjectId, ref: "User" }],
    site: { type: Schema.Types.ObjectId, ref: "Site" },
    utilityType: { type: String, required: true },
    questionnaire: { type: Schema.Types.Mixed, required: true }, // store answers: current supplier, contract expiry, postcode, identifiers...
    suggestedPrice: { type: Number },
    currency: { type: String, default: "GBP" },
    status: { type: String, enum: ["draft", "sent", "accepted", "rejected", "expired"], default: "draft" },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IQuote>("Quote", QuoteSchema);