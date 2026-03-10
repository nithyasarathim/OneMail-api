<!-- OneMail Documentation -->

<div style="background:white;padding:40px;font-family:'Nunito Sans',sans-serif;color:black;line-height:1.7">

<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Nunito+Sans:wght@300;400;500;600&display=swap');

h1,h2,h3,h4{
font-family:'Poppins',sans-serif;
color:#0ea5e9;
margin-top:32px;
margin-bottom:12px;
}

blockquote{
background:#f8fafc;
border-left:4px solid #0ea5e9;
padding:12px 18px;
border-radius:6px;
font-style:italic;
}

table{
width:100%;
border-collapse:collapse;
margin:18px 0;
}

th,td{
border:1px solid #e5e7eb;
padding:10px 12px;
text-align:left;
}

th{
background:#f1f5f9;
font-weight:600;
}

code{
background:#f3f4f6;
padding:2px 6px;
border-radius:4px;
}

pre{
background:#0f172a;
color:#e2e8f0;
padding:16px;
border-radius:8px;
overflow:auto;
}

</style>

<div align="center">

<img src="assets/logo.png" width="full"/>

> **Secure • Reliable • Minimal**<br>
> OTP Email Delivery Microservice for the **OneAuth Ecosystem**

Version **1.0.0**
Last Updated — **March 10, 2026**

</div>

---

# Table of Contents

1. [Service Overview](#service-overview)
2. [Architecture & Integration](#architecture--integration)
3. [Tech Stack](#tech-stack)
4. [Responsibilities & Boundaries](#responsibilities--boundaries)
5. [API Reference](#api-reference)
6. [Security & Authentication](#security--authentication)
7. [Environment Variables](#environment-variables)
8. [Setup & Deployment](#setup--deployment)
9. [Configuration & Modes](#configuration--modes)
10. [Logging & Observability](#logging--observability)
11. [Error Handling](#error-handling)
12. [Best Practices & Recommendations](#best-practices--recommendations)

---

# Service Overview

> **Purpose**

**OneMail** is a lightweight microservice responsible for sending **One-Time Password (OTP) emails** during authentication workflows.

It is used primarily for:

- User registration verification
- Password reset verification

Separating email delivery into its own microservice improves:

- Maintainability
- Security
- Scalability
- Code clarity

---

## Key Goals

| Goal        | Description                               |
| ----------- | ----------------------------------------- |
| Reliability | Ensure OTP emails reach users quickly     |
| Security    | Protect endpoints with request signing    |
| Scalability | Allow independent scaling of mail service |
| Simplicity  | Keep service minimal and focused          |

---

# Architecture & Integration

> **High Level Request Flow**

```
OneAuth Service
       │
       │ HMAC Signed Request
       ▼
    OneMail
       │
       │ SMTP
       ▼
Email Provider (Gmail / SendGrid / SES)
```

---

## Integration Points

| Direction  | Service        | Protocol    | Purpose                     |
| ---------- | -------------- | ----------- | --------------------------- |
| Upstream   | OneAuth        | REST + HMAC | Sends OTP requests          |
| Downstream | SMTP Provider  | SMTP / TLS  | Email delivery              |
| Monitoring | Logging system | JSON logs   | Debugging and observability |

> **Design Principle:**
> OneMail is **stateless**. It does not store OTPs or user information.

---

# Tech Stack

| Layer         | Technology         | Version  | Purpose            |
| ------------- | ------------------ | -------- | ------------------ |
| Runtime       | Node.js            | 18+      | Server runtime     |
| Framework     | Express.js         | 5.x      | API routing        |
| Language      | TypeScript         | 5.x      | Type safety        |
| Email         | Nodemailer         | 7.x      | SMTP delivery      |
| Logging       | Winston            | 3.x      | Structured logs    |
| Rate Limiting | express-rate-limit | 8.x      | Abuse prevention   |
| Security      | Node Crypto        | Built-in | HMAC SHA256        |
| Environment   | dotenv             | 16+      | Environment config |

---

# Responsibilities & Boundaries

## What OneMail Handles

| Feature                | Description                  |
| ---------------------- | ---------------------------- |
| Request validation     | Validates request payload    |
| Signature verification | Ensures request authenticity |
| Rate limiting          | Prevents abuse               |
| Template rendering     | Generates email content      |
| Email sending          | Sends via SMTP               |
| Logging                | Tracks delivery results      |

---

## What OneMail Does NOT Handle

| Feature          | Reason                     |
| ---------------- | -------------------------- |
| OTP generation   | Managed by OneAuth         |
| OTP verification | Managed by OneAuth         |
| User database    | Out of scope               |
| Marketing emails | Transactional service only |
| Email analytics  | Not required               |

---

# API Reference

> **Base URL**

Development

```
http://localhost:5002/otp
```

Production

```
https://onemail.yourdomain.com/otp
```

---

## Endpoints

| Method | Endpoint                | Description             | Rate Limit |
| ------ | ----------------------- | ----------------------- | ---------- |
| POST   | `/mail/register`        | Send registration OTP   | 10/min     |
| POST   | `/mail/forget-password` | Send password reset OTP | 10/min     |

---

## Example Request

```json
{
  "to": "alice@example.com",
  "otp": "483920",
  "timestamp": "1640995200123",
  "signature": "a1b2c3d4e5f6..."
}
```

---

## Field Validation

| Field     | Type   | Required | Rule           |
| --------- | ------ | -------- | -------------- |
| to        | string | Yes      | Valid email    |
| otp       | string | Yes      | 6 digit OTP    |
| timestamp | string | Yes      | Unix timestamp |
| signature | string | Yes      | HMAC SHA256    |

---

## Success Response

```json
{
  "success": true,
  "message": "Mail sent successfully"
}
```

---

## Error Response

```json
{
  "success": false,
  "message": "Invalid signature"
}
```

---

## Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 400  | Validation error      |
| 429  | Too many requests     |
| 500  | Internal server error |

---

# Security & Authentication

> **Request Signing using HMAC SHA256**

Every request must include a **signature** to prove authenticity.

Example:

```javascript
const payload = `${to}${otp}${timestamp}`;

const signature = crypto
  .createHmac("sha256", SIGNATURE_SECRET)
  .update(payload)
  .digest("hex");
```

---

## Additional Security Measures

- Timestamp freshness validation
- Rate limiting per IP
- Input sanitization
- TLS encrypted communication

---

# Environment Variables

| Variable          | Example                                   | Required | Description   |
| ----------------- | ----------------------------------------- | -------- | ------------- |
| PORT              | 5002                                      | No       | Server port   |
| ENVIRONMENT       | development                               | No       | Mode          |
| MAIL_HOST         | smtp.gmail.com                            | Yes      | SMTP host     |
| MAIL_PORT         | 587                                       | Yes      | SMTP port     |
| MAIL_USER         | [email@gmail.com](mailto:email@gmail.com) | Yes      | SMTP user     |
| MAIL_PASS         | app-password                              | Yes      | SMTP password |
| SIGNATURE_SECRET  | super-secret                              | Yes      | Shared secret |
| RATE_LIMIT        | 10                                        | No       | Request limit |
| RATE_LIMIT_WINDOW | 60000                                     | No       | Time window   |

---

# Setup & Deployment

## Local Development

```bash
git clone <repo>
cd OneMail

npm install

cp .env.example .env
# edit env variables

npm run dev
```

---

## Production Build

```bash
npm run build
npm start
```

---

## Docker Deployment

```bash
docker build -t onemail:latest .

docker run \
--env-file .env \
-p 8080:8080 \
onemail:latest
```

---

# Configuration & Modes

| Setting          | Development | Production  |
| ---------------- | ----------- | ----------- |
| Timestamp window | ±10 minutes | ±2 minutes  |
| Rate limit       | 10 req/min  | 100 req/min |
| SMTP TLS         | Optional    | Required    |
| Logging level    | Debug       | Info        |
| Error output     | Verbose     | Minimal     |

---

# Logging & Observability

> Logging uses **Winston structured JSON logs**

Example log entry:

```json
{
  "timestamp": "2026-03-10T11:52:34.123Z",
  "level": "info",
  "message": "OTP email sent successfully",
  "email": "user@example.com",
  "type": "register",
  "durationMs": 1248
}
```

---

## Recommended Monitoring Tools

| Tool       | Purpose          |
| ---------- | ---------------- |
| ELK Stack  | Centralized logs |
| Grafana    | Visualization    |
| Prometheus | Metrics          |
| CloudWatch | Cloud monitoring |

---

# Error Handling

> OneMail follows **fail-fast error handling**

| Scenario                | Status | Retry Safe | Action          |
| ----------------------- | ------ | ---------- | --------------- |
| Invalid signature       | 400    | No         | Verify secret   |
| Rate limit exceeded     | 429    | Yes        | Retry later     |
| Invalid request data    | 400    | No         | Fix validation  |
| SMTP connection failure | 500    | Yes        | Retry           |
| SMTP auth failure       | 500    | No         | Fix credentials |

---

# Best Practices & Recommendations

- Rotate `SIGNATURE_SECRET` every **90 days**
- Use dedicated email services like **SendGrid / SES**
- Monitor delivery failure rates
- Keep dependencies updated
- Add circuit breaker for high traffic
- Test with real SMTP providers early

---

# Support

> If problems occur:

1. Check service logs
2. Validate environment variables
3. Verify SMTP credentials
4. Confirm request signature generation

---

# License

MIT License

---

<div align="center">

**Happy Mailing 📧**

</div>

</div>
