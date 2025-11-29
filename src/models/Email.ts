import mongoose, { Schema, Document } from "mongoose";

export interface IEmail extends Document {
  subject: string;
  message: string;
  recipientGroup?: "all" | "users" | "admins" | "guests";
  recipients: string[]; // Array of email addresses or user IDs
  status: "draft" | "scheduled" | "sent" | "failed";
  scheduledAt?: Date;
  sentAt?: Date;
  template?: mongoose.Schema.Types.ObjectId;
  templateVariables?: Map<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const emailSchema: Schema = new Schema(
  {
    subject: { type: String, required: true },
    message: { type: String, required: true },
    recipientGroup: {
      type: String,
      enum: ["all", "users", "admins", "guests"],
      required: false,
    },
    recipients: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "failed"],
      default: "draft",
    },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    template: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
    templateVariables: { type: Map, of: String },
  },
  { timestamps: true }
);

const Email = mongoose.model<IEmail>("Email", emailSchema);

export default Email;
