import type { Request, Response } from "express";
import { sendEmail } from "../utils/sendEmail.js";
import Email from "../models/Email.js";
import Template from "../models/Template.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { io } from "../index.js";

// Helper to get recipients based on group
async function getRecipients(group: string, specificRecipients?: string[]): Promise<string[]> {
  if ((!group || group === "specific") && specificRecipients) {
    return specificRecipients;
  }

  let query = {};
  if (group === "admins") query = { role: "admin" };
  else if (group === "users") query = { role: "user" };
  else if (group === "guests") query = { role: "guest" };
  else if (group === "hosts") query = { role: "host" };
  // "all" implies no filter

  const users = await User.find(query).select("email");
  return users.map((u) => u.email);
}

export async function createEmail(request: Request, response: Response) {
  console.log("Create Email Endpoint Hit");
  try {
    const { subject, message, recipientGroup, recipients, scheduledAt, templateId, templateVariables, saveAsDraft } = request.body;

    if ((!message && !templateId) || (!subject && !templateId) || (!recipientGroup && (!recipients || recipients.length === 0))) {
      return response.status(400).json({ message: "Subject, message (or template), and either recipient group or recipients are required" });
    }

    let emailContent = message;
    let emailSubject = subject;

    if (templateId) {
      const template = await Template.findById(templateId);
      if (!template) {
        return response.status(404).json({ message: "Template not found" });
      }
      
      // Perform variable substitution
      let content = template.content;
      let subj = template.subject;

      if (templateVariables) {
          for (const [key, value] of Object.entries(templateVariables)) {
              const regex = new RegExp(`{{${key}}}`, 'g');
              content = content.replace(regex, value as string);
              subj = subj.replace(regex, value as string);
          }
      } else {
        return response.status(400).json({ message: "Template variables are required" });
      }

      if (!message) emailContent = content;
      if (!subject) emailSubject = subj; 
    }

    const email = new Email({
      subject: emailSubject,
      message: emailContent,
      recipientGroup,
      recipients: recipients || [],
      status: saveAsDraft ? "draft" : (scheduledAt ? "scheduled" : "sent"),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      template: templateId,
      templateVariables: templateVariables || {},
    });

    await email.save();

    if (!saveAsDraft && !scheduledAt) {
      // Send immediately
      await sendEmailNow(email);
    }

    return response.status(201).json({ message: "Email created successfully", email });
  } catch (error) {
    console.error("Failed to create email:", error);
    return response.status(500).json({ message: "Failed to create email" });
  }
}

async function sendEmailNow(emailDoc: any) {
  try {
    const recipientEmails = await getRecipients(emailDoc.recipientGroup, emailDoc.recipients);
    
    // Send email (looping or bulk send depending on provider capabilities)
    // For now, we loop. In production, use a bulk sending service or queue.
    for (const email of recipientEmails) {
        await sendEmail({
            to: email,
            subject: emailDoc.subject,
            html: emailDoc.message,
            from: "adebayoolowofoyeku@gmail.com" // Should be env var
        });
    }

    emailDoc.status = "sent";
    emailDoc.sentAt = new Date();
    await emailDoc.save();

    // Create Notifications and Emit Socket Events
    // We need user IDs for notifications, so we might need to fetch users again or optimize getRecipients
    // const users = await User.find({ email: { $in: recipientEmails } });
    
    // const notifications = users.map(user => ({
    //     userId: user._id,
    //     title: emailDoc.subject,
    //     message: "You have a new email from Admin", // Or a snippet of the message
    //     type: "email",
    // }));

    // if (notifications.length > 0) {
    //     await Notification.insertMany(notifications);
        
    //     // users.forEach(user => {
    //     //     io.to(user._id.toString()).emit("notification", {
    //     //         title: emailDoc.subject,
    //     //         message: "You have a new email from Admin",
    //     //         type: "email"
    //     //     });
    //     // });
    // }

  } catch (error) {
    console.error("Error sending email:", error);
    emailDoc.status = "failed";
    await emailDoc.save();
  }
}

export async function listEmails(request: Request, response: Response) {
    try {
        const emails = await Email.find().sort({ createdAt: -1 });
        response.status(200).json(emails);
    } catch (error) {
        response.status(500).json({ message: "Failed to fetch emails" });
    }
}

export async function createTemplate(request: Request, response: Response) {
    try {
        const { name, category, subject, content } = request.body;

        // Extract variables from subject and content
        const variableRegex = /{{([^}]+)}}/g;
        const subjectVars = [...subject.matchAll(variableRegex)].map(m => m[1]);
        const contentVars = [...content.matchAll(variableRegex)].map(m => m[1]);
        const variables = [...new Set([...subjectVars, ...contentVars])]; // Unique variables

        const template = new Template({ name, category, subject, content, variables });
        await template.save();
        response.status(201).json(template);
    } catch (error) {
        response.status(500).json({ message: "Failed to create template" });
    }
}

export async function listTemplates(request: Request, response: Response) {
    try {
        const templates = await Template.find().sort({ createdAt: -1 });
        response.status(200).json(templates);
    } catch (error) {
        response.status(500).json({ message: "Failed to fetch templates" });
    }
}
