import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  fullname: string;
  email: string;
  phoneNumber?: string;
  password: string;
  profilePicture?: string | null;
  role: "user" | "admin" | "guest" | "host";
  // status: "active" | "pending" | "suspended";
  businesses?: mongoose.Schema.Types.ObjectId[]
  sites?: mongoose.Schema.Types.ObjectId[]
  expoPushTokens?: string[];
  refreshTokens: mongoose.Schema.Types.ObjectId[]
  status: "pending" | "active" | "inactive";
  pushNotificationsEnabled: boolean;
}

const userSchema: Schema = new Schema({
  fullname: { type: String, required: true, unique: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  phoneNumber: { type: String },
  password: { type: String, required: true },
  profilePicture: { type: String, default: null },
  role: { type: String, enum: ["user", "admin", "guest", "host"], default: "user" },
  status: { type: String, enum: ["pending", "active", "inactive"], default: "active" },
  // profilePicture: { type: mongoose.Schema.Types.ObjectId, default: null },
  expoPushTokens: [{ type: String }],
  businesses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Business' }],
  sites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Site' }],
  refreshTokens: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RefreshToken' }],
  pushNotificationsEnabled: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model<IUser>("User", userSchema);

export default User;