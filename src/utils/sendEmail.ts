import { transporter } from '../index.js';
import { getDefaultEmailTemplate } from './emailTemplate.js';

interface SendEmailOptions {
    from: string;
    to: string;
    replyTo?: string;
    subject: string;
    html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {  
    const htmlContent = getDefaultEmailTemplate(options.subject, options.html);

    await transporter.sendMail({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: htmlContent,
    });
}