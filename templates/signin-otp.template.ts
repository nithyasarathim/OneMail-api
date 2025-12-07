function signInOtpTemplate(otp: string) {
  return `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8" />
            <link href="https://fonts.googleapis.com/css2?family=Merriweather+Sans:wght@400;700&family=Nunito+Sans:wght@400;600&display=swap" rel="stylesheet" />
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                h1, h2, h3, h4, h5 {
                    font-family: 'Merriweather Sans', sans-serif;
                }
                body, p, span {
                    font-family: 'Nunito Sans', sans-serif;
                }
            </style>
        </head>
        <body class="bg-gradient-to-br from-sky-500 to-sky-200 p-8">
            <div class="max-w-lg mx-auto bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                <div class="flex items-center justify-center gap-3 mb-6">
                <h1 class="text-3xl font-bold">
                    <span class="text-sky-500">ONE</span>
                    <span class="text-gray-700">Accounts</span>
                </h1>
                </div>
                <hr class="border-gray-200 mb-6" />
                <p class="text-center text-gray-600 mb-6">
                You’re just a moment away from creating your One Account.
                </p>
                <p class="text-gray-700 text-base mb-3">
                Use the One-Time Password (OTP) below to verify your email:
                </p>
                <div class="text-center my-7">
                <span class="text-4xl font-bold text-sky-600 bg-sky-100 px-8 py-4 rounded-xl tracking-[0.35em] shadow-md">
                    ${otp}
                </span>
                </div>
                <p class="text-gray-700 text-sm leading-relaxed">
                This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.
                </p>
                <p class="text-gray-500 text-xs mt-8 text-center border-t pt-4">
                If you didn’t sign up for OneAccounts, you can ignore this email.
                </p>
            </div>
        </body>
    </html>
`;
}

module.exports = signInOtpTemplate;