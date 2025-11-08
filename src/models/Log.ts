import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
    // entityRef: string;
    entityType: string;
    entityId: mongoose.Types.ObjectId;
    message: string;
}

const LogSchema: Schema = new Schema<ILog>({
    // entityRef: {type: String, required: true},
    entityType: {type: String, required: true},
    entityId: {type: Schema.Types.ObjectId, required: true, refPath: 'entityType'},
    message: {type: String, required: true}
}, {timestamps: true});

LogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export default mongoose.model<ILog>('Log', LogSchema);