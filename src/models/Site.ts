import mongoose, { Schema, Document } from "mongoose";

export interface ISiteManager {
  userId: mongoose.Types.ObjectId;
  role: "owner" | "manager" | "viewer";
}

export interface ISite extends Document {
  name: string;
  address: string;
  postcode: string;
  owners: ISiteManager[]; // includes owner/manager entries
  utilities?: mongoose.Types.ObjectId[]; // refs to Utility
  metadata?: Record<string, any>;
}

const SiteSchema: Schema = new Schema<ISite>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    postcode: { type: String, required: true },
    owners: [
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