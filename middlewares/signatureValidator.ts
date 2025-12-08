import type { Request, Response, NextFunction } from "express";
import APIError from "../utils/APIError.js";
import crypto from "crypto";
import signatureGenerator from "../utils/signatureGenerator.js";

const MAX_AGE_MS = 2 * 60 * 1000;

const signatureValidator = function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { to, otp, timestamp, signature } = req.body;
  if (!to || !otp || !timestamp || !signature) {
    throw new APIError("Missing required fields", 400);
  }

  if (
    typeof to !== "string" ||
    typeof otp !== "string" ||
    typeof signature !== "string" ||
    typeof timestamp !== "string" ||
    to.trim() === "" ||
    otp.trim() === "" ||
    signature === "" ||
    timestamp.trim() === ""
  ) {
    return next(new APIError("All payload must be string and non-empty", 400));
  }

  const cleaned_to = to.trim().toLowerCase();
  const cleaned_otp = String(otp).trim();
  const cleaned_timestamp = String(timestamp).trim();

  const numTimeStamp = Number(cleaned_timestamp);

  const now = Date.now();
  const age = now - numTimeStamp;
  if (
    Number.isNaN(cleaned_timestamp) ||
    numTimeStamp <= 0 ||
    cleaned_timestamp != numTimeStamp.toString()
  ) {
    return next(new APIError("Invalid timestamp format", 400));
  }
  if (age < 0) {
    return next(new APIError("Timestamp from future", 400));
  }
  if (age > MAX_AGE_MS) {
    return next(new APIError("Request Expired", 410));
  }

  const expected_signature = signatureGenerator(
    cleaned_to,
    cleaned_otp,
    cleaned_timestamp
  );

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected_signature)
    )
  ) {
    return next(new APIError("Invalid signature", 401));
  }

  req.body.data = {
    to: cleaned_to,
    otp: cleaned_otp,
    timestamp: cleaned_timestamp,
  };

  next();
};

export default signatureValidator;
