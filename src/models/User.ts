import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  fullname: string;
  email: string;
  password: string;
  profilePicture?: mongoose.Schema.Types.ObjectId | null;
  role: "user" | "admin" | "guest" | "host";
  businesses?: mongoose.Schema.Types.ObjectId[]
  expoPushTokens?: string[];
  refreshTokens: mongoose.Schema.Types.ObjectId[]
}

const userSchema: Schema = new Schema({
  fullname: { type: String, required: true, unique: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: null },
  role: { type: String, enum: ["user", "admin", "guest", "host"], default: "user" },
  // profilePicture: { type: mongoose.Schema.Types.ObjectId, default: null },
  expoPushTokens: [{ type: String }],
  businesses: [{type: mongoose.Schema.Types.ObjectId, ref: 'Business'}],
  refreshTokens: [{type: mongoose.Schema.Types.ObjectId, ref: 'RefreshToken'}]
}, { timestamps: true });

const User = mongoose.model<IUser>("User", userSchema);

export default User;