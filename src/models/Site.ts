import mongoose, { Schema, Document } from "mongoose";

export interface ISiteMember {
  userId: mongoose.Types.ObjectId;
  role: "owner" | "manager" | "viewer";
}

export interface ISite extends Document {
  name: string;
  business: mongoose.Types.ObjectId;
  address: string;
  // postcode: string;
  members?: ISiteMember[]; // includes owner/manager entries
  utilities?: mongoose.Types.ObjectId[]; // refs to Utility
  metadata?: Record<string, any>;
}

const SiteSchema: Schema = new Schema<ISite>(
  {
    name: { type: String, required: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true},
    address: { type: String, required: true },
    // postcode: { type: String, required: true },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["owner", "manager", "viewer"], default: "manager" },
      },
    ],
    utilities: [{ type: Schema.Types.ObjectId, ref: "Utility" }],
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model<ISite>("Site", SiteSchema);