function forgetPasswordOtpTemplate(otp: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
      }
      .content {
        padding: 24px !important;
      }
      .otp {
        font-size: 32px !important;
        letter-spacing: 8px !important;
        padding: 16px 22px !important;
      }
      h1 {
        font-size: 26px !important;
      }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#0ea5e9; font-family:Segoe UI, Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:50px 10px; background-color:#0ea5e9;">
    <tr>
      <td align="center">
        <table class="container" width="520" cellpadding="0" cellspacing="0" role="presentation"
          style="width:100%; max-width:520px; background:#ffffff; border:1px solid #e5e7eb; box-shadow:0 10px 30px rgba(0,0,0,0.12);">
          
          <tr>
            <td align="center" style="padding:32px 20px 20px;">
              <h1 style="margin:0; font-size:30px; font-weight:700; color:#1f2937;">
                <span style="color:#0ea5e9;">ONE</span> Accounts
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none; border-top:1px solid #e2e8f0;">
            </td>
          </tr>

          <tr>
            <td class="content" style="padding:32px; color:#374151; font-size:16px; line-height:1.6;">
              <p style="text-align:center; margin-top:0; color:#475569;">
                We received a request to reset your One Account password.
              </p>
              <p>
                Use the One-Time Password (OTP) below to verify your identity:
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:20px;">
              <div class="otp" style="
                display:inline-block;
                background:#E0F2FE;
                border:2px solid #0ea5e9;
                color:#0ea5e9;
                font-size:38px;
                font-weight:700;
                letter-spacing:10px;
                padding:18px 28px;
                font-family:'Courier New', monospace;
              ">
                ${otp}
              </div>
            </td>
          </tr>

          <tr>
            <td class="content" style="padding:0 32px 30px; font-size:14px; color:#374151;">
              <p style="margin:0;">
                This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:26px 24px; text-align:center; font-size:12px; color:#94a3b8; border-top:1px solid #e2e8f0;">
              If you did not request a password reset, you can safely ignore this email.
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

export default forgetPasswordOtpTemplate;
