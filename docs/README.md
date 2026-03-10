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

<img src="../assets/logo.png" width="600"/>

### **Secure • Reliable • Minimal**<br>

OTP Email Delivery Microservice for the **OneAuth Ecosystem**

Version **1.0.0**
Last Updated — **March 10, 2026**

</div>

---

# <ins>Table of Contents</ins>

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

# <ins>Service Overview</ins>

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

# <ins>Architecture & Integration</ins>

> **High Level Request Flow**

```
OneAuth Service (Upstream)
       │
       │ 1. User initiates registration/login
       │ 2. OneAuth generates OTP
       │ 3. OneAuth prepares signed request
       ▼
    OneMail Microservice
       │
       │ 4. Validate request signature & timestamp
       │ 5. Rate limit check
       │ 6. Render email template with OTP
       │ 7. Send email via SMTP
       ▼
Email Provider (Gmail / SendGrid / SES)
       │
       │ 8. Deliver email to user
       ▼
User Inbox
       │
       │ 9. User enters OTP in OneAuth
       │ 10. OneAuth verifies OTP
```

---

## Detailed Architecture Overview

OneMail is designed as a **stateless microservice** following the **single responsibility principle**. It focuses exclusively on secure OTP email delivery, separating concerns from the main authentication service (OneAuth).

### Core Components

| Component       | Technology | Responsibility                        |
| --------------- | ---------- | ------------------------------------- |
| **Express App** | Express.js | HTTP server, routing, middleware      |
| **Controllers** | TypeScript | Business logic for OTP sending        |
| **Templates**   | HTML/TS    | Email content rendering               |
| **Mailer**      | Nodemailer | SMTP communication                    |
| **Middlewares** | Express    | Security, logging, rate limiting      |
| **Utils**       | TypeScript | Signature generation, logging, errors |

### Request Processing Pipeline

1. **HTTP Request Reception**
   - Express server receives POST request
   - JSON body parsing with size limits (10kb prod / 1mb dev)

2. **Middleware Execution** (in order)
   - `requestLogger`: Logs incoming requests with timing
   - `rateLimiter`: Prevents abuse (10/min dev, 100/min prod)
   - `signatureValidator`: Verifies HMAC signature and timestamp freshness _(Note: Currently not applied in routes)_

3. **Route Handling**
   - Routes to appropriate controller based on endpoint
   - `/otp/mail/register` → `sendRegisterOtp`
   - `/otp/mail/forget-password` → `sendForgetPasswordOtp`

4. **Controller Logic**
   - Extracts `to` and `otp` from validated request
   - Selects appropriate email template
   - Calls Nodemailer to send email

5. **Email Delivery**
   - Connects to SMTP provider (Gmail, SendGrid, etc.)
   - Sends HTML email with OTP
   - Logs delivery result

6. **Response**
   - Returns success/error JSON
   - Logs final status

### Stateless Design Benefits

- **Horizontal Scaling**: No session state to manage
- **Fault Tolerance**: Service can restart without data loss
- **Simplicity**: No database or caching required
- **Performance**: Fast response times (typically <1s)

---

## Integration Points

| Direction      | Service        | Protocol    | Purpose                     | Data Flow         |
| -------------- | -------------- | ----------- | --------------------------- | ----------------- |
| **Upstream**   | OneAuth        | REST + HMAC | Sends OTP requests          | POST /otp/mail/\* |
| **Downstream** | SMTP Provider  | SMTP / TLS  | Email delivery              | Email with OTP    |
| **Monitoring** | Logging system | JSON logs   | Debugging and observability | Structured logs   |

### Upstream Integration (OneAuth)

OneAuth integrates with OneMail by:

1. **OTP Generation**: Creates random 6-digit OTP
2. **Payload Preparation**: Constructs request with email, OTP, timestamp
3. **Signature Creation**: Uses shared `SIGNATURE_SECRET` to HMAC sign payload
4. **HTTP Request**: POSTs to OneMail endpoint
5. **Response Handling**: Processes success/failure

**Integration Code Example (OneAuth side):**

```typescript
import crypto from "crypto";

const sendOtpEmail = async (email: string, otp: string) => {
  const timestamp = Date.now().toString();
  const payload = `${email}:${otp}:${timestamp}`;

  const signature = crypto
    .createHmac("sha256", process.env.SIGNATURE_SECRET)
    .update(payload)
    .digest("hex");

  const response = await fetch(
    "https://onemail.yourdomain.com/otp/mail/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        otp,
        timestamp,
        signature,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to send OTP email");
  }
};
```

### Downstream Integration (SMTP Providers)

OneMail integrates with email providers via SMTP:

- **Connection**: TLS-encrypted SMTP connection
- **Authentication**: Username/password or API keys
- **Templates**: HTML emails with responsive design
- **Tracking**: Logs delivery status (not bounces/opens)

**Supported Providers:**

- Gmail SMTP
- SendGrid
- Amazon SES
- Custom SMTP servers

---

## Data Flow & Security Boundaries

```
┌─────────────────┐    Signed Request    ┌─────────────────┐    Email    ┌─────────────────┐
│     OneAuth     │ ──────────────────► │     OneMail     │ ──────────► │  Email Provider │
│                 │                     │                 │             │                 │
│ • Generates OTP │                     │ • Validates sig │             │ • Delivers mail │
│ • Signs request │                     │ • Sends email   │             │ • User receives │
│ • Handles auth  │                     │ • Stateless     │             │ • OTP entry     │
└─────────────────┘                     └─────────────────┘             └─────────────────┘
```

**Security Boundaries:**

- OneMail never stores OTPs (stateless)
- OneAuth handles OTP verification
- Shared secret only for request signing
- No user data persistence in OneMail

---

## Error Handling & Resilience

- **Fail-Fast**: Invalid requests rejected immediately
- **Graceful Degradation**: SMTP failures logged but don't crash service
- **Circuit Breaker Pattern**: Recommended for high-traffic scenarios
- **Retry Logic**: Upstream services should implement retries for 5xx errors

> **Design Principle:** OneMail is **stateless**. It does not store OTPs or user information.

---

# <ins>Tech Stack</ins>

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

# <ins>Responsibilities & Boundaries</ins>

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

# <ins>API Reference</ins>

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

## Request Format

All requests must include the following JSON payload:

```json
{
  "to": "user@example.com",
  "otp": "123456",
  "timestamp": "1704067200000",
  "signature": "a1b2c3d4e5f6..."
}
```

### Field Descriptions

| Field       | Type   | Required | Description                    | Validation Rules                       |
| ----------- | ------ | -------- | ------------------------------ | -------------------------------------- |
| `to`        | string | Yes      | Recipient email address        | Valid email format, trimmed, lowercase |
| `otp`       | string | Yes      | 6-digit One-Time Password      | Exactly 6 digits                       |
| `timestamp` | string | Yes      | Unix timestamp in milliseconds | Numeric string, within valid age       |
| `signature` | string | Yes      | HMAC SHA256 signature          | Hex string, matches expected           |

---

## Example Requests

### Registration OTP

**Endpoint:** `POST /otp/mail/register`

**Request Body:**

```json
{
  "to": "alice@example.com",
  "otp": "483920",
  "timestamp": "1704067200000",
  "signature": "5d41402abc4b2a76b9719d911017c592"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5002/otp/mail/register \
  -H "Content-Type: application/json" \
  -d '{
    "to": "alice@example.com",
    "otp": "483920",
    "timestamp": "1704067200000",
    "signature": "5d41402abc4b2a76b9719d911017c592"
  }'
```

**JavaScript Example (Client-side):**

```javascript
const crypto = require("crypto");

const payload = {
  to: "alice@example.com",
  otp: "483920",
  timestamp: Date.now().toString(),
};

const signature = crypto
  .createHmac("sha256", "your-shared-secret")
  .update(`${payload.to}:${payload.otp}:${payload.timestamp}`)
  .digest("hex");

payload.signature = signature;

fetch("http://localhost:5002/otp/mail/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
```

---

### Password Reset OTP

**Endpoint:** `POST /otp/mail/forget-password`

**Request Body:**

```json
{
  "to": "bob@example.com",
  "otp": "729184",
  "timestamp": "1704067300000",
  "signature": "7c4a8d09ca3762af61e59520943dc264"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5002/otp/mail/forget-password \
  -H "Content-Type: application/json" \
  -d '{
    "to": "bob@example.com",
    "otp": "729184",
    "timestamp": "1704067300000",
    "signature": "7c4a8d09ca3762af61e59520943dc264"
  }'
```

**JavaScript Example (Client-side):**

```javascript
const crypto = require("crypto");

const payload = {
  to: "bob@example.com",
  otp: "729184",
  timestamp: Date.now().toString(),
};

const signature = crypto
  .createHmac("sha256", "your-shared-secret")
  .update(`${payload.to}:${payload.otp}:${payload.timestamp}`)
  .digest("hex");

payload.signature = signature;

fetch("http://localhost:5002/otp/mail/forget-password", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
```

---

## Success Response

```json
{
  "success": true,
  "message": "Mail sent successfully"
}
```

---

## Error Responses

### Validation Errors

**Status: 400**

```json
{
  "success": false,
  "message": "Missing required fields"
}
```

**Status: 400**

```json
{
  "success": false,
  "message": "Invalid timestamp format"
}
```

**Status: 410**

```json
{
  "success": false,
  "message": "Request Expired"
}
```

**Status: 401**

```json
{
  "success": false,
  "message": "Invalid signature"
}
```

### Rate Limiting

**Status: 429**

```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later"
}
```

### Server Errors

**Status: 500**

```json
{
  "success": false,
  "message": "Failed to send OTP"
}
```

---

## Status Codes

| Code | Meaning               | Description                 |
| ---- | --------------------- | --------------------------- |
| 200  | Success               | Email sent successfully     |
| 400  | Bad Request           | Validation error in request |
| 401  | Unauthorized          | Invalid signature           |
| 410  | Gone                  | Request timestamp expired   |
| 429  | Too Many Requests     | Rate limit exceeded         |
| 500  | Internal Server Error | SMTP or server error        |

---

# <ins>Security & Authentication</ins>

OneMail implements multiple layers of security to ensure secure OTP email delivery. The primary security mechanism is **HMAC SHA256 request signing** combined with **timestamp freshness validation** and **rate limiting**.

> **Note:** While the signature validation logic is implemented in the codebase (`middlewares/signatureValidator.ts`), it is currently not applied to the routes. This is a security gap that should be addressed in production deployments.

---

## HMAC SHA256 Request Signing

Every API request must be cryptographically signed to prevent unauthorized access and request tampering.

### How It Works

1. **Payload Construction**: Create a string from the request fields in the format `to:otp:timestamp`
2. **HMAC Generation**: Use SHA256 HMAC with a shared secret key
3. **Signature Inclusion**: Include the hex-encoded signature in the request
4. **Server Verification**: OneMail verifies the signature using the same algorithm

### Signature Algorithm Details

**Input Format:**

```
{email}:{otp}:{timestamp}
```

**Example:**

```
alice@example.com:123456:1704067200000
```

**HMAC Generation:**

```javascript
const crypto = require("crypto");

const payload = `${to}:${otp}:${timestamp}`;
const signature = crypto
  .createHmac("sha256", SIGNATURE_SECRET)
  .update(payload)
  .digest("hex");
```

**Security Properties:**

- **Integrity**: Prevents request tampering
- **Authenticity**: Proves request comes from authorized source
- **Non-repudiation**: Sender cannot deny sending the request

---

## Timestamp Freshness Validation

Requests include a timestamp to prevent replay attacks and ensure timeliness.

### Validation Rules

| Check      | Description            | Development | Production  |
| ---------- | ---------------------- | ----------- | ----------- |
| **Format** | Must be numeric string | ±10 minutes | ±2 minutes  |
| **Future** | Cannot be from future  | Not allowed | Not allowed |
| **Age**    | Maximum allowed age    | 10 minutes  | 2 minutes   |

### Why Timestamp Validation?

- **Replay Attack Prevention**: Old signed requests cannot be reused
- **Clock Skew Handling**: Accounts for minor time differences between servers
- **DoS Protection**: Prevents accumulation of stale requests

**Implementation:**

```typescript
const now = Date.now();
const age = now - Number(timestamp);

// Check if timestamp is too old
if (age > MAX_AGE_MS) {
  return res.status(410).json({ success: false, message: "Request Expired" });
}

// Check if timestamp is from future
if (age < 0) {
  return res
    .status(400)
    .json({ success: false, message: "Timestamp from future" });
}
```

---

## Rate Limiting

Prevents abuse and ensures fair resource usage.

### Configuration

| Environment | Requests/Minute | Window (ms) | IP Detection    |
| ----------- | --------------- | ----------- | --------------- |
| Development | 10              | 60000       | Local IP        |
| Production  | 100             | 60000       | X-Forwarded-For |

### Rate Limit Algorithm

- **Token Bucket**: Allows bursts up to the limit
- **Sliding Window**: Resets every minute
- **IP-based**: Tracks requests per client IP
- **Logging**: Warns on limit hits

**Headers Added:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1704067260000
```

---

## Input Validation & Sanitization

All inputs are validated and sanitized to prevent injection attacks.

### Validation Rules

| Field       | Type   | Sanitization    | Validation            |
| ----------- | ------ | --------------- | --------------------- |
| `to`        | string | Trim, lowercase | Valid email regex     |
| `otp`       | string | Trim            | 6 digits only         |
| `timestamp` | string | Trim            | Numeric, within range |
| `signature` | string | N/A             | 64-char hex string    |

### Security Checks

- **Type Validation**: Ensures correct data types
- **Length Limits**: Prevents buffer overflow
- **Regex Validation**: Email format checking
- **Trimming**: Removes leading/trailing whitespace

---

## TLS & Transport Security

All communications are encrypted in transit.

### SMTP Security

- **TLS Required**: Production mode enforces TLS
- **Certificate Validation**: Verifies server certificates
- **STARTTLS**: Upgrades plain connections to encrypted

### HTTP Security

- **HTTPS Recommended**: Use reverse proxy for SSL termination
- **Trust Proxy**: Configures Express for proxy headers
- **Secure Headers**: Rate limit headers for debugging

---

## Shared Secret Management

The `SIGNATURE_SECRET` is the cornerstone of request authentication.

### Security Requirements

| Environment | Secret Source | Validation       |
| ----------- | ------------- | ---------------- |
| Development | `.env` file   | Warns if default |
| Production  | Environment   | Required, strong |

### Best Practices

- **Rotation**: Change every 90 days
- **Storage**: Never in code repository
- **Distribution**: Secure sharing between OneAuth and OneMail
- **Length**: Minimum 32 characters

**Environment Setup:**

```bash
# Generate strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set in environment
export SIGNATURE_SECRET="your-32-char-hex-secret"
```

---

## Threat Model & Mitigations

### Potential Threats

| Threat                | Mitigation                      |
| --------------------- | ------------------------------- |
| **Replay Attacks**    | Timestamp freshness validation  |
| **Request Tampering** | HMAC signature verification     |
| **Brute Force**       | Rate limiting                   |
| **DoS Attacks**       | Input validation, rate limiting |
| **Man-in-the-Middle** | TLS encryption                  |
| **Secret Leakage**    | Environment isolation, rotation |

### Attack Scenarios

1. **Stolen Request**: Old requests rejected by timestamp check
2. **Modified Payload**: Signature mismatch detected
3. **Flooding**: Rate limiter blocks excessive requests
4. **Invalid Data**: Input validation rejects malformed requests

---

## Security Monitoring

Security events are logged for monitoring and alerting.

### Logged Events

- Rate limit violations
- Signature validation failures
- Timestamp validation errors
- Input validation failures

### Log Example

```json
{
  "timestamp": "2026-03-10T11:52:34.123Z",
  "level": "warn",
  "message": "Rate limit exceeded",
  "ip": "192.168.1.100",
  "path": "/otp/mail/register",
  "limit": 100
}
```

---

## Additional Security Measures

- Timestamp freshness validation
- Rate limiting per IP
- Input sanitization
- TLS encrypted communication

---

# <ins>Environment Variables</ins>

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

# <ins>Setup & Deployment</ins>

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

# <ins>Configuration & Modes</ins>

| Setting          | Development | Production  |
| ---------------- | ----------- | ----------- |
| Timestamp window | ±10 minutes | ±2 minutes  |
| Rate limit       | 10 req/min  | 100 req/min |
| SMTP TLS         | Optional    | Required    |
| Logging level    | Debug       | Info        |
| Error output     | Verbose     | Minimal     |

---

# <ins>Logging & Observability</ins>

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

# <ins>Error Handling</ins>

> OneMail follows **fail-fast error handling**

| Scenario                | Status | Retry Safe | Action          |
| ----------------------- | ------ | ---------- | --------------- |
| Invalid signature       | 400    | No         | Verify secret   |
| Rate limit exceeded     | 429    | Yes        | Retry later     |
| Invalid request data    | 400    | No         | Fix validation  |
| SMTP connection failure | 500    | Yes        | Retry           |
| SMTP auth failure       | 500    | No         | Fix credentials |

---

# <ins>Best Practices & Recommendations</ins>

- Rotate `SIGNATURE_SECRET` every **90 days**
- Use dedicated email services like **SendGrid / SES**
- Monitor delivery failure rates
- Keep dependencies updated
- Add circuit breaker for high traffic
- Test with real SMTP providers early

---

# <ins>Support</ins>

If problems occur:

1. Check service logs
2. Validate environment variables
3. Verify SMTP credentials
4. Confirm request signature generation

---

# <ins>License</ins>

MIT License

---


</div>
