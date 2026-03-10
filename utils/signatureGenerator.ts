import crypto from "crypto";
import config from "../config/env.js";

const isProduction = config.environment === "production";

const signatureGenerator = function (
  to: string,
  otp: string,
  timestamp: string,
) {
  const signaturesecret = config.signaturesecret;

  if (isProduction && (!signaturesecret || signaturesecret === "QWERTY")) {
    throw new Error("Production Error: Weak or missing SIGNATURE_SECRET");
  }

  if (!signaturesecret) {
    throw new Error("SIGNATURE_SECRET not configured in environment");
  }

  const data = `${to}:${otp}:${timestamp}`;

  return crypto
    .createHmac("sha256", signaturesecret)
    .update(data)
    .digest("hex");
};

export default signatureGenerator;
