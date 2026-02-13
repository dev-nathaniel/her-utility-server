export function getDefaultEmailTemplate(subject: string, content: string): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>

  <body style="margin:0; padding:0; background:#F5F6FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
    
    <!-- Wrapper -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6FA; padding: 40px 0;">
      <tr>
        <td align="center">

          <!-- Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background:#ffffff; border-radius: 16px; padding: 32px; box-shadow:0 4px 20px rgba(0,0,0,0.04);">

            <!-- Title -->
            <tr>
              <td align="center" style="font-size:22px; font-weight:600; color:#1A1A1A; padding-bottom: 12px;">
                ${subject}
              </td>
            </tr>

            <!-- Body Text -->
            <tr>
              <td style="font-size:15px; color:#4A4A4A; line-height:1.6; text-align:center; padding-bottom: 24px;">
                ${content}
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
`;
}
