import mongoose, { Schema, Document } from "mongoose";

export interface IBill extends Document {
  site?: mongoose.Types.ObjectId;
  utility?: mongoose.Types.ObjectId;
  amount: number;
  currency?: string;
  periodStart?: Date;
  periodEnd?: Date;
  dueDate?: Date;
  paid?: boolean;
  metadata?: Record<string, any>;
}

const BillSchema: Schema = new Schema<IBill>(
  {
    site: { type: Schema.Types.ObjectId, ref: "Site" },
    utility: { type: Schema.Types.ObjectId, ref: "Utility" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "GBP" },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    dueDate: { type: Date },
    paid: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model<IBill>("Bill", BillSchema);