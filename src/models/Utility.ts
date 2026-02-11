import mongoose, { Schema, Document } from "mongoose";

export type UtilityType = "electricity" | "gas" | "water" | "telecoms";

export interface IUtility extends Document {
  site?: mongoose.Types.ObjectId;
  business?: mongoose.Types.ObjectId;
  type: UtilityType;
  supplier?: string;
  identifier?: string; // MPRN / MPAN / other id
  contractStart?: Date;
  contractEnd?: Date;
  billingFrequency?: string;
  paymentMethod?: string;
  notes?: string;
  status?: string;
  previousContractExpiry?: string;
  previousMeterId?: string;
  previousSupplier?: string;
}

const UtilitySchema: Schema = new Schema<IUtility>(
  {
    site: { type: Schema.Types.ObjectId, ref: "Site" },
    business: { type: Schema.Types.ObjectId, ref: "Business" },
    type: { type: String, enum: ["electricity", "gas", "water", "telecoms"], required: true },
    supplier: { type: String },
    identifier: { type: String }, // store MPRN, MPAN, etc.
    contractStart: { type: Date },
    contractEnd: { type: Date },
    billingFrequency: { type: String },
    paymentMethod: { type: String },
    notes: { type: String },
    status: { type: String, enum: ["active", "expired", "pending"]},
    previousContractExpiry: { type: String },
    previousMeterId: { type: String },
    previousSupplier: { type: String },
  },
  { timestamps: true }
);

// Validate that at least one of site or business is provided
UtilitySchema.pre("validate", function (next) {
  if (!this.site && !this.business) {
    next(new Error("A utility must reference at least a site or a business."));
  } else {
    next();
  }
});

export default mongoose.model<IUtility>("Utility", UtilitySchema);