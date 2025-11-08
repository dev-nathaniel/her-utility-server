import { transporter } from '../index.js';

interface SendEmailOptions {
    from: string;
    to: string;
    replyTo?: string;
    subject: string;
    html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {  
    
    await transporter.sendMail({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
    });
}