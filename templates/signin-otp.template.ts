function signInOtpTemplate(otp: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      background-color: #0ea5e9;
      font-family: "Segoe UI", Arial, sans-serif;
    }
  </style>
</head>

<body style="margin:5px; padding:60px 0; background-color:#0ea5e9; font-family:'Segoe UI', Arial, sans-serif;">
  <div style="
    max-width:520px;
    margin:0 auto;
    background:white;
    overflow:hidden;
    box-shadow:0 10px 30px rgba(0,0,0,0.12);
    border:1px solid #e5e7eb;
  ">
    <div style="text-align:center; padding:35px 20px 25px;">
      <h1 style="font-size:30px; font-weight:700; margin:0; font-family:'Segoe UI', Arial, sans-serif;">
        <span style="color:#0ea5e9; margin-right:6px;">ONE</span>
        <span style="color:#1f2937;">Accounts</span>
      </h1>
    </div>

    <div style="padding:0 40px 45px;">
      <hr style="border:none; border-top:1px solid #e2e8f0; margin:25px 0;" />

      <p style="text-align:center; color:#475569; margin:20px 0; font-size:16px;">
        You're just a moment away from creating your One Account.
      </p>

      <p style="color:#374151; font-size:16px; line-height:1.6;">
        Use the One-Time Password (OTP) below to verify your email:
      </p>

      <div style="text-align:center; margin:45px 0;">
        <span style="
          display:inline-block;
          background:#e0f2fe;
          color:#0369a1;
          font-size:38px;
          font-weight:700;
          letter-spacing:12px;
          padding:18px 34px;
          border:2px solid #7dd3fc;
          font-family:'Segoe UI', 'Courier New', monospace;
        ">
          ${otp}
        </span>
      </div>

      <p style="color:#374151; font-size:14px; line-height:1.6;">
        This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.
      </p>

      <div style="text-align:center; padding:28px 20px; font-size:12px; color:#94a3b8; border-top:1px solid #e2e8f0; margin-top:45px;">
        If you didn't sign up for OneAccounts, you can safely ignore this email.
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export default signInOtpTemplate;
