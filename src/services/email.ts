import type { Request, Response } from "express";
import { sendEmail } from "../utils/sendEmail.js";

export async function createEmail(request: Request, response: Response) {
  console.log("Email endpoint hit");
  try {
    const { emailTo, subject } = request.body;
    if (!emailTo) {
      console.log("EmailTo is required");
      return response.status(400).json({ message: "EmailTo is required" });
    }

    await sendEmail({
      from: "adebayoolowofoyeku@gmail.com",
      to: emailTo,
      subject: subject ?? "Email Endpoint",
      html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email</title>
  </head>

  <body style="margin:0; padding:0; background:#F5F6FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
    
    <!-- Wrapper -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6FA; padding: 40px 0;">
      <tr>
        <td align="center">

          <!-- Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background:#ffffff; border-radius: 16px; padding: 32px; box-shadow:0 4px 20px rgba(0,0,0,0.04);">
            
            <!-- Logo Circle -->
            <tr>
            <td align="center" style="padding-bottom:24px;">
              <table width="64" height="64" cellpadding="0" cellspacing="0" 
                style="background:#E8EDFF; border-radius:50%; text-align:center;">
                <tr>
                  <td style="vertical-align:middle; font-size:28px; font-weight:600; color:#3E63F5;">
                    B
                  </td>
                </tr>
              </table>
            </td>
          </tr>

            <!-- Title -->
            <tr>
              <td align="center" style="font-size:22px; font-weight:600; color:#1A1A1A; padding-bottom: 12px;">
                Welcome to Your Business Portal
              </td>
            </tr>

            <!-- Body Text -->
            <tr>
              <td style="font-size:15px; color:#4A4A4A; line-height:1.6; text-align:center; padding-bottom: 24px;">
                Your account has been successfully created.  
                You can now manage your businesses, sites, and members all in one place.
              </td>
            </tr>

            <!-- Button -->
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <a href="#" style="background:#3E63F5; color:#ffffff; padding: 14px 28px; border-radius: 10px; text-decoration:none; font-size:15px; font-weight:500; display:inline-block;">
                  Go to Dashboard
                </a>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="border-top:1px solid #E5E7EB; padding-top: 20px; font-size:12px; color:#9A9A9A; text-align:center;">
                If you have any issues, just reply to this email — we’re happy to help.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
</html>


            `,
    });
    return response.status(200).json({ message: "Email sent successfully"})
  } catch (error) {
    console.log("Failed to send email");
    return response.status(500).json({ message: "Failed to send email" });
  }
}
