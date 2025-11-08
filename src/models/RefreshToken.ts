import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
    userId: mongoose.Types.ObjectId;
    expiresAt: Date;
    token: String;
    isValid: Boolean;
}

const RefreshTokenSchema: Schema = new Schema<IRefreshToken>({
    token: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    isValid: { type: Boolean, required: true, default: true}
}, {
    timestamps: true
});


export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);