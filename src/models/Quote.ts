import mongoose, { Schema, Document } from "mongoose";

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired" | "pending";

export interface IQuote extends Document {
    business: mongoose.Types.ObjectId;
    site: mongoose.Types.ObjectId;
  requester: mongoose.Types.ObjectId; // user who requested the quote
  recipients: mongoose.Types.ObjectId[]; // users who receive quote (admins / suppliers / users)
  utilityType: string;
  questionnaire: Record<string, any>;
  suggestedPrice?: number;
  currency?: string;
  status: QuoteStatus;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  respondedAt: Date;
  respondedNotes: string;
  type: string;
}

const QuoteSchema: Schema = new Schema<IQuote>(
  {
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true},
    site: { type: Schema.Types.ObjectId, ref: "Site", required: true},
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipients: [{ type: Schema.Types.ObjectId, ref: "User" }],
    utilityType: { type: String, enum: ["electricity", "water", "gas"], required: true },
    questionnaire: { type: Schema.Types.Mixed, required: true }, // store answers: current supplier, contract expiry, postcode, identifiers...
    suggestedPrice: { type: Number },
    currency: { type: String, default: "GBP" },
    status: { type: String, enum: ["pending", "accepted", "rejected", "expired"], default: "pending" },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    respondedAt: { type: Date},
    respondedNotes: { type: String },
    type: {type: String, enum: ["new", "renewal"], required: true}
  },
  { timestamps: true }
);

export default mongoose.model<IQuote>("Quote", QuoteSchema);