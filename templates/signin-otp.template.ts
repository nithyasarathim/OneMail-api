function signInOtpTemplate(otp: string) {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style type="text/css">
      @font-face {
        font-family: 'Nunito Sans';
        font-style: normal;
        font-weight: 400;
        src: url('https://fonts.gstatic.com/s/nunitosans/v12/Q8c4-f90Xy0C3yGm6Cr7S4P_B3Z3.woff2') format('woff2');
      }
      @font-face {
        font-family: 'Nunito Sans';
        font-style: bold;
        font-weight: 700;
        src: url('https://fonts.gstatic.com/s/nunitosans/v12/Q8c4-f90Xy0C3yGm6Cr7S4P_B3Z3.woff2') format('woff2');
      }
    </style>
  </head>
  
  <body style="margin:0; padding:40px 0; background-color:#0ea5e9; font-family:'Nunito Sans', Arial, sans-serif;">
    <div style="max-width:500px; margin:0 auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.1); border:1px solid #e5e7eb;">
      <div style="text-align:center; padding:30px 20px 20px;">
        <h1 style="font-size:32px; font-weight:700; margin:0; font-family:'Nunito Sans', Arial, sans-serif;">
          <span style="color:#0ea5e9; margin-right:7px;">ONE</span>
          <span style="color:#1f2937;">Accounts</span>
        </h1>
      </div>
  
      <div style="padding:0 40px 40px;">
        <hr style="border:none; border-top:1px solid #e2e8f0; margin:20px 0;" />
  
        <p style="text-align:center; color:#475569; margin:20px 0; font-size:16px; font-family:'Nunito Sans', Arial, sans-serif;">
          You're just a moment away from creating your One Account.
        </p>
  
        <p style="color:#374151; font-size:16px; line-height:1.6; font-family:'Nunito Sans', Arial, sans-serif;">
          Use the One-Time Password (OTP) below to verify your email:
        </p>
  
        <div style="text-align:center; margin:40px 0;">
          <span style="
            display:inline-block;
            background:#e0f2fe;
            color:#0369a1;
            font-size:36px;
            font-weight:bold;
            letter-spacing:12px;
            padding:16px 32px;
            border-radius:12px;
            border:2px solid #7dd3fc;
            font-family:'Nunito Sans', 'Courier New', monospace;
          ">
            ${otp}
          </span>
        </div>
  
        <p style="color:#374151; font-size:14px; line-height:1.6; font-family:'Nunito Sans', Arial, sans-serif;">
          This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.
        </p>
  
        <div style="text-align:center; padding:30px 20px 20px; font-size:12px; color:#94a3b8; border-top:1px solid #e2e8f0; margin-top:40px; font-family:'Nunito Sans', Arial, sans-serif;">
          If you didn't sign up for OneAccounts, you can safely ignore this email.
        </div>
      </div>
    </div>
  </body>
  </html>
    `;
  }
  
  export default signInOtpTemplate;
  