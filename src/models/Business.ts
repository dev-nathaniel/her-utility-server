import mongoose, { Schema, Document } from "mongoose";

export interface IBusinessMember {
  userId: mongoose.Types.ObjectId;
  role: "owner" | "manager" | "viewer";
}

export interface IBusiness extends Document {
  name: string;
  address: string;
  postcode: string;
  members: IBusinessMember[]; // includes owner/manager entries
  utilities?: mongoose.Types.ObjectId[]; // refs to Utility
  metadata?: Record<string, any>;
  invites?: mongoose.Types.ObjectId;
}

const BusinessSchema: Schema = new Schema<IBusiness>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    // postcode: { type: String, required: true },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["owner", "manager", "viewer"], default: "owner" },
      },
    ],
    utilities: [{ type: Schema.Types.ObjectId, ref: "Utility" }],
    invites: [{types: Schema.Types.ObjectId, ref: "Invite"}],
    // metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model<IBusiness>("Business", BusinessSchema);