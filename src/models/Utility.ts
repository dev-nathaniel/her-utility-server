import mongoose, { Schema, Document } from "mongoose";

export type UtilityType = "electricity" | "gas" | "water";

export interface IUtility extends Document {
  siteId: mongoose.Types.ObjectId;
  type: UtilityType;
  supplier?: string;
  identifier?: string; // MPRN / MPAN / other id
  contractStart?: Date;
  contractEnd?: Date;
  billingFrequency?: string;
  paymentMethod?: string;
  notes?: string;
}

const UtilitySchema: Schema = new Schema<IUtility>(
  {
    siteId: { type: Schema.Types.ObjectId, ref: "Site", required: true },
    type: { type: String, enum: ["electricity", "gas", "water"], required: true },
    supplier: { type: String },
    identifier: { type: String }, // store MPRN, MPAN, etc.
    contractStart: { type: Date },
    contractEnd: { type: Date },
    billingFrequency: { type: String },
    paymentMethod: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IUtility>("Utility", UtilitySchema);