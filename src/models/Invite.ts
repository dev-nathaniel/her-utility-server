import mongoose, { Document, Model, Schema } from 'mongoose';

export interface InviteDocument extends Document {
    invited: mongoose.Types.ObjectId; // user being invited
    inviter: mongoose.Types.ObjectId; // user who sent the invite
    business: mongoose.Types.ObjectId; // business the invite is for
    role: string; // role name in the business (e.g. "admin", "manager")
    // roleRef?: mongoose.Types.ObjectId; // optional reference to a Role document
    token: string; // unique token used to accept the invite
    status: 'pending' | 'accepted' | 'revoked' | 'expired';
    expiresAt?: Date;
    acceptedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const InviteSchema = new Schema<InviteDocument>(
    {
        invited: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        inviter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
        role: { type: String, enum: ["owner", "manager", "viewer"], required: true },
        // roleRef: { type: Schema.Types.ObjectId, ref: 'Role' },
        token: { type: String, required: true, unique: true },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'revoked', 'expired'],
            default: 'pending',
            required: true,
        },
        expiresAt: { type: Date },
        acceptedAt: { type: Date },
    },
    { timestamps: true }
);

// optional TTL index to automatically remove expired invites
// InviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// helpful index to quickly look up outstanding invites for a user/business
InviteSchema.index({ invited: 1, business: 1, status: 1 });


export default mongoose.model<InviteDocument>('Invite', InviteSchema);
