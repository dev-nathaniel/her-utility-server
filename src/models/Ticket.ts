import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  customer: string;
  customerEmail: string;
  subject: string;
  category: "Billing" | "Account" | "Technical" | "General";
  priority: "Low" | "Medium" | "High";
  status: "Open" | "In Progress" | "Resolved";
  assignee?: string;
  messages: {
    from: "customer" | "agent";
    author: string;
    content: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema = new Schema({
  customer: { type: String, required: true },
  customerEmail: { type: String, required: true },
  subject: { type: String, required: true },
  category: { 
    type: String, 
    enum: ["Billing", "Account", "Technical", "General"], 
    default: "General" 
  },
  priority: { 
    type: String, 
    enum: ["Low", "Medium", "High"], 
    default: "Medium" 
  },
  status: { 
    type: String, 
    enum: ["Open", "In Progress", "Resolved"], 
    default: "Open" 
  },
  assignee: { type: String },
  messages: [{
    from: { type: String, enum: ["customer", "agent"], required: true },
    author: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Add index for faster searching
TicketSchema.index({ customer: 'text', subject: 'text', customerEmail: 'text' });

export default mongoose.model<ITicket>('Ticket', TicketSchema);
