import mongoose, { Schema, Document } from 'mongoose';

export enum OTPMedium {
    EMAIL = 'email',
    SMS = 'sms'
}

export enum OTPType {
    FORGOT_PASSWORD = 'forgot-password',
    EMAIL_VERIFICATION = 'email-verification'
}

export interface IOTP extends Document {
    code: string;
    userId: mongoose.Types.ObjectId;
    expiresAt: Date;
    medium: OTPMedium;
    type: OTPType;
    used: boolean;
}

const OTPSchema: Schema = new Schema<IOTP>({
    code: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    medium: { type: String, enum: Object.values(OTPMedium), default: OTPMedium.EMAIL },
    type: { type: String, enum: Object.values(OTPType), required: true },
    used: { type: Boolean, default: false }
}, {
    timestamps: true
});

OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 900 });

export default mongoose.model<IOTP>('OTP', OTPSchema);