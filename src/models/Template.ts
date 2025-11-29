import mongoose, { Schema, Document } from "mongoose";

export interface ITemplate extends Document {
  name: string;
  category: string;
  subject: string;
  content: string; // HTML content
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    variables: [{ type: String }],
  },
  { timestamps: true }
);

const Template = mongoose.model<ITemplate>("Template", templateSchema);

export default Template;
