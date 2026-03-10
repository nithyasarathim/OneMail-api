# OneMail - OTP Email Service

A robust, production-ready microservice for sending One-Time Password (OTP) emails. OneMail is a secure and scalable email delivery service designed to handle registration and password reset OTP communications with built-in security features like HMAC-SHA256 signature validation and rate limiting.

## Overview

OneMail serves as a dedicated email delivery service within the OneSoftware ecosystem. It provides a secure, authenticated interface for sending OTP emails to end users during critical authentication flows. The service implements multiple layers of security including request signature validation, timestamp verification, and IP-based rate limiting to prevent unauthorized access and abuse.

## Core Features

- **Secure OTP Delivery**: Send OTPs for user registration and password reset with HTML-formatted email templates
- **HMAC-SHA256 Signature Validation**: Request authentication using HMAC-SHA256 signatures with timing-safe comparison
- **Rate Limiting**: Configurable IP-based rate limiting to prevent abuse and brute force attacks
- **Request Logging**: Comprehensive request logging for debugging and monitoring
- **Error Handling**: Graceful error handling with detailed error messages and standardized response formats
- **High Performance**: Built with Express.js and TypeScript for optimal performance
- **Asynchronous Email Processing**: Non-blocking email sending using Nodemailer with SMTP connection pooling
- **Email Templates**: Pre-built HTML templates for registration and password reset OTPs

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.2.1
- **Language**: TypeScript 5.9.3
- **Email Client**: Nodemailer 7.0.11
- **Rate Limiting**: express-rate-limit 8.2.1
- **Environment Management**: dotenv 17.2.3
- **Cryptography**: Native Node.js crypto module (HMAC-SHA256)

## 📋 Prerequisites

Before running OneMail, ensure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **SMTP Server** credentials (Gmail, SendGrid, or any SMTP provider)
- **Environment Variables** configured

## 🚀 Getting Started

### 1. Installation

Navigate to the OneMail directory and install dependencies:

```bash
cd OneMail
npm install
```

### 2. Environment Configuration

Create a `.env` file in the OneMail root directory with the following variables:

```env
# Server Configuration
PORT=3001

# Email (SMTP) Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Security
SIGNATURE_SECRET=your-secret-key-for-signature-validation

# Rate Limiting
RATE_LIMIT=5
RATE_LIMIT_WINDOW=900000
```

**Configuration Details:**

| Variable            | Description                              | Example               |
| ------------------- | ---------------------------------------- | --------------------- |
| `PORT`              | Server port                              | `3001`                |
| `MAIL_HOST`         | SMTP server hostname                     | `smtp.gmail.com`      |
| `MAIL_PORT`         | SMTP server port                         | `587`                 |
| `MAIL_USER`         | Email account username                   | `noreply@company.com` |
| `MAIL_PASS`         | Email account password or app password   | `abcd efgh ijkl mnop` |
| `SIGNATURE_SECRET`  | Secret key for HMAC signature validation | `your-secret-key`     |
| `RATE_LIMIT`        | Max requests per window                  | `5`                   |
| `RATE_LIMIT_WINDOW` | Time window in milliseconds              | `900000` (15 minutes) |

### 3. Running the Server

**Development Mode (with hot reload):**

```bash
npm run dev
```

**Production Build:**

```bash
npm run build
npm start
```

The server will start on `http://localhost:3001`

## Request Processing Architecture

The OneMail service implements a layered middleware architecture that processes each incoming request through multiple validation and security stages. This section details the complete lifecycle of a request from entry to email delivery.

### Request Flow Diagram

```
Incoming Request
        ↓
[1] Request Logger Middleware
        ↓
[2] Rate Limiter Middleware
        ↓
[3] Signature Validator Middleware
        ↓
[4] Route Handler (Controller)
        ↓
[5] Email Sending Process
        ↓
Response
```

### Stage 1: Request Logger Middleware

**Purpose**: Log all incoming requests for monitoring and debugging.

**Function**: Records request metadata including timestamp, method, endpoint, and client IP address.

**Implementation**: Executes before any other processing to ensure all requests are tracked, allowing administrators to monitor service usage and debug issues.

### Stage 2: Rate Limiter Middleware

**Purpose**: Prevent abuse by limiting requests from a single IP address.

**Algorithm**: Uses sliding window rate limiting that tracks requests per IP address and resets the counter based on configured window duration.

**Configuration Parameters**:

- `RATE_LIMIT`: Maximum number of requests allowed per window (default: 5)
- `RATE_LIMIT_WINDOW`: Duration of the window in milliseconds (default: 900,000 = 15 minutes)

**Default Behavior**:

- 5 requests per 15 minutes per IP address
- Returns HTTP 429 (Too Many Requests) when exceeded

**Error Response**:

```json
{
  "success": false,
  "message": "Too many requests"
}
```

**Implementation Details**:

- Uses the `express-rate-limit` package
- IP-based tracking (via X-Forwarded-For header in proxied environments)
- Automatic reset after window expires

### Stage 3: Signature Validator Middleware - Core Security Layer

**Purpose**: Verify request authenticity, validate request parameters, and prevent replay attacks.

This is the most critical security layer. It ensures that only authorized clients can send emails through OneMail.

#### 3.1 Field Presence Validation

The middleware first validates that all required fields are present in the request body:

```
Required Fields:
├── to        : Email recipient address
├── otp       : One-Time Password to be sent
├── timestamp : Request creation time (milliseconds since epoch)
└── signature : HMAC-SHA256 signature for authentication

If any field is missing → HTTP 400 (Bad Request)
Error: "Missing required fields"
```

#### 3.2 Type and Format Validation

All fields must be non-empty strings:

```
Validation Rules:
├── to        : must be string, non-empty after trim
├── otp       : must be string, non-empty after trim
├── timestamp : must be string, non-empty after trim
└── signature : must be string, non-empty

Field Normalization (during validation):
├── to        : trimmed whitespace + converted to lowercase
├── otp       : trimmed whitespace
├── timestamp : trimmed whitespace
└── signature : kept as-is for exact comparison

If validation fails → HTTP 400 (Bad Request)
Error: "All payload must be string and non-empty"
```

#### 3.3 Timestamp Validation - Replay Attack Prevention

The timestamp serves three critical purposes:

1. **Freshness Verification**: Ensures the request is recent (not old/archived)
2. **Replay Attack Prevention**: Old requests are automatically rejected
3. **Clock Skew Tolerance**: Allows for minor time differences between client and server

**Timestamp Validation Steps**:

```
Step 1: Parse and Type Verification
  ├─ Convert timestamp string to integer
  ├─ Check if conversion resulted in valid number
  └─ Verify: isNaN(timestamp) === false && timestamp > 0
     If fails → HTTP 400: "Invalid timestamp format"

Step 2: String Representation Check
  ├─ Convert parsed integer back to string
  ├─ Compare with original timestamp string
  └─ Verify: timestampString === timestampInteger.toString()
     Prevents: Leading zeros, scientific notation, etc.
     If fails → HTTP 400: "Invalid timestamp format"

Step 3: Future Timestamp Detection
  ├─ Calculate age: age = currentTime - timestamp
  └─ Verify: age >= 0 (timestamp not from future)
     If fails → HTTP 400: "Timestamp from future"
     Reason: Prevents requests with clock-adjusted timestamps

Step 4: Expiration Check (Replay Attack Prevention)
  ├─ Define MAX_AGE_MS = 2 * 60 * 1000 = 120,000 milliseconds
  ├─ Calculate age: age = currentTime - timestamp
  └─ Verify: age <= MAX_AGE_MS
     If fails → HTTP 410: "Request Expired"
     Rationale: 2-minute window allows for network delays
              while preventing old requests from being replayed
```

**Why 2 Minutes?**

- Sufficient time for network round-trip delays
- Short enough to prevent replay attacks
- Balances security with real-world network conditions
- Can be adjusted via implementation if needed

#### 3.4 Signature Generation and Verification

**Client-Side Signature Generation**:

The client must generate a signature before sending the request. This signature proves that the client knows the shared secret.

**Signature Generation Algorithm**:

```
Input:
  ├── to: "user@example.com"
  ├── otp: "123456"
  ├── timestamp: "1710086400000"
  └── SIGNATURE_SECRET: "your-secret-key"

Step 1: Concatenate payload fields (no delimiters)
  data = to + otp + timestamp
  data = "user@example.com1234561710086400000"

Step 2: Generate HMAC-SHA256
  signature = HMAC-SHA256(data, SIGNATURE_SECRET)
  signature = crypto
    .createHmac('sha256', SIGNATURE_SECRET)
    .update(data)
    .digest('hex')

Output:
  signature = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

**Server-Side Signature Verification**:

```
Input:
  ├── Received signature from client
  ├── Received and validated fields (to, otp, timestamp)
  └── SIGNATURE_SECRET (shared secret)

Step 1: Regenerate expected signature
  expected_signature = signatureGenerator(to, otp, timestamp)
  (uses same algorithm as client)

Step 2: Timing-Safe Comparison
  Use: crypto.timingSafeEqual(receivedBuffer, expectedBuffer)

  Compare each byte of received signature with expected
  Takes SAME amount of time regardless of where difference occurs

  If signatures do not match → HTTP 401: "Invalid signature"
     (Request rejected due to authentication failure)
```

**Why Timing-Safe Comparison?**

A naive string comparison would complete faster when the first character is wrong compared to when the last character is wrong. An attacker could exploit this timing difference to gradually brute-force the correct signature one character at a time.

Example attack using normal comparison:

```
Normal comparison:
  "abc123" vs "xyz456" → Fast (fails at 'a')
  "abc123" vs "abc456" → Slower (fails at '4')
  Time difference reveals position of mismatch

With timing-safe comparison:
  All mismatches take same time
  No information leaked about signature content
```

#### 3.5 Data Attachment and Forward Pass

After all validations pass successfully, the middleware normalizes and attaches cleaned data to the request object:

```typescript
req.body.data = {
  to: "user@example.com", // lowercase, trimmed
  otp: "123456", // trimmed
  timestamp: "1710086400000", // trimmed
};

next(); // Pass to next middleware/route handler
```

### Stage 4: Route Handler and Controller

Once a request successfully passes all middleware validation, it reaches the appropriate OTP controller.

**Controller Processing Logic**:

```
Input Request:
  ├── req.body.data.to: "user@example.com"
  ├── req.body.data.otp: "123456"
  └── req.body.data.timestamp: "1710086400000"

Step 1: Determine Email Type
  if (route === "/otp/mail/register")
    ├── templateFunction = signInOtpTemplate
    ├── senderName = "OneAuth Registration"
    └── subject = "OneAccounts Registration One Time Password"

  else if (route === "/otp/mail/forget-password")
    ├── templateFunction = forgetPasswordOtpTemplate
    ├── senderName = "OneAuth Reset Password"
    └── subject = "OneAccounts Reset Password One Time Password"

Step 2: Generate HTML Email Content
  htmlContent = templateFunction(otp)
  Returns: Formatted HTML with OTP embedded in template

Step 3: Prepare Email Options Object
  mailOptions = {
    from: `"${senderName}" <${MAIL_USER}>`,
    to: user_email,
    subject: subject_line,
    html: htmlContent
  }

Step 4: Send Email via Transporter
  result = await transporter.sendMail(mailOptions)
  Returns: { messageId: "...", accepted: [...], rejected: [...] }

Step 5: Send Success Response to Client
  res.status(200).json({
    message: "Mail sent successfully",
    success: true
  })

Error Handling:
  if (error)
    throw new APIError("Failed to send OTP", 500)
    → Caught by error handler middleware
```

### Stage 5: Email Sending Process

**SMTP Transporter Configuration**:

OneMail uses Nodemailer with the following SMTP configuration:

```typescript
{
  host: MAIL_HOST,                    // SMTP server address (e.g., smtp.gmail.com)
  port: MAIL_PORT,                    // Port 587 (STARTTLS) or 465 (SSL)
  secure: false,                      // Use STARTTLS on port 587
  auth: {
    user: MAIL_USER,                  // Email account username
    pass: MAIL_PASS                   // Email account password or app password
  },
  tls: {
    rejectUnauthorized: false         // Allow self-signed certificates in dev
  }
}
```

**Connection Modes**:

- **Port 587 (STARTTLS)**: Starts unencrypted, upgrades to TLS. Most common.
- **Port 465 (SSL)**: Connects with encryption from start. Requires `secure: true`

**Email Delivery Flow**:

```
1. Create Mail Object
   ├─ from: Sender address and name
   ├─ to: Recipient email address
   ├─ subject: Email subject line
   ├─ html: HTML email content
   └─ Additional options: replyTo, cc, bcc, etc.

2. SMTP Connection and Authentication
   ├─ Connect to MAIL_HOST on MAIL_PORT
   ├─ Send EHLO (SMTP greeting)
   ├─ Initiate TLS upgrade (STARTTLS)
   ├─ Send AUTH with username and password
   ├─ Receive 235 response (authentication successful)
   └─ Connection ready for sending

3. Email Transmission
   ├─ Construct MIME message from mail object
   ├─ Send MAIL FROM (sender address)
   ├─ Send RCPT TO (recipient address)
   ├─ Send DATA (message content)
   ├─ Receive 250 response (message accepted)
   └─ Message queued for delivery

4. Response Handling
   ├─ Success: Return messageId and delivery status
   ├─ Failure: Capture SMTP error and throw exception
   └─ Connection pooling: Keep alive for next email or close
```

**Connection Pooling and Performance**:

Nodemailer maintains connection pooling by default:

- Reuses SMTP connections across multiple emails
- Significantly reduces latency for sequential emails
- Automatically closes idle connections
- Handles reconnection if connection drops

**Asynchronous Processing**:

The email sending is fully asynchronous:

- Uses async/await pattern
- Does not block event loop
- Allows server to handle other requests while sending email
- Prevents timeout issues on slow SMTP servers

### Error Handling and Response Pipeline

**Error Detection and Flow**:

```
Error Occurs at Any Stage
        ↓
    Error Instance Created
        ↓
        ├─ APIError (Custom errors)
        │   ├─ ValidationError (400)
        │   ├─ AuthenticationError (401)
        │   ├─ RateLimitError (429)
        │   ├─ ExpiredError (410)
        │   └─ ServerError (500)
        │
        └─ Unexpected Error (uncaught exception)
        ↓
Error Handler Middleware
        ↓
    Check Error Type
        ├─ APIError → Use statusCode property
        └─ Other → Default to 500
        ↓
Format Response Object
        ↓
Send HTTP Response to Client
```

**Error Handler Implementation**:

```typescript
errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error(err)

  // Handle custom API errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    })
  }

  // Handle unexpected errors
  return res.status(500).json({
    success: false,
    message: "Internal Server Error"
  })
}
```

**Error Response Examples**:

```json
HTTP 400 - Bad Request
{
  "success": false,
  "message": "Missing required fields"
}

HTTP 401 - Invalid Signature
{
  "success": false,
  "message": "Invalid signature"
}

HTTP 410 - Request Expired
{
  "success": false,
  "message": "Request Expired"
}

HTTP 429 - Rate Limited
{
  "success": false,
  "message": "Too many requests"
}

HTTP 500 - Email Sending Failed
{
  "success": false,
  "message": "Failed to send OTP"
}
```

---

## 📡 API Endpoints

### 1. Register OTP Email

Send an OTP email for user registration.

**Endpoint:**

```
POST /otp/mail/register
```

**Headers:**

```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**

```json
{
  "to": "user@example.com",
  "otp": "123456",
  "timestamp": 1710086400000,
  "signature": "hmac-sha256-signature"
}
```

**Response (Success - 200):**

```json
{
  "message": "Mail sent successfully",
  "success": true
}
```

**Example cURL Request:**

```bash
curl -X POST http://localhost:3001/otp/mail/register \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "otp": "123456",
    "timestamp": 1710086400000,
    "signature": "your-signature"
  }'
```

### 2. Forget Password OTP Email

Send an OTP email for password reset.

**Endpoint:**

```
POST /otp/mail/forget-password
```

**Headers:**

```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**

```json
{
  "to": "user@example.com",
  "otp": "654321",
  "timestamp": 1710086400000,
  "signature": "hmac-sha256-signature"
}
```

**Response (Success - 200):**

```json
{
  "message": "Mail sent successfully",
  "success": true
}
```

**Example cURL Request:**

```bash
curl -X POST http://localhost:3001/otp/mail/forget-password \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "otp": "654321",
    "timestamp": 1710086400000,
    "signature": "your-signature"
  }'
```

### Health Check

**Endpoint:**

```
GET /
```

**Response (200):**

```json
{
  "success": true,
  "message": "Auth Mail server is alive on this port"
}
```

## Security Implementation Details

### Cryptographic Signature Validation

All requests to the `/otp` endpoints must include a valid HMAC-SHA256 signature. This ensures only authorized services can send emails through OneMail.

**How HMAC-SHA256 Works**:

```
HMAC = Hash-based Message Authentication Code
       Combines a cryptographic hash function with a secret key

Process:
1. Message: to + otp + timestamp
2. Secret Key: SIGNATURE_SECRET (shared between client and server)
3. Algorithm: SHA256 (produces 256-bit hash)
4. Result: Hexadecimal string that proves knowledge of secret
```

**Signature Generation on Client Side**:

```javascript
// Step-by-step example
import crypto from "crypto";

// Shared secret configured on both client and server
const SIGNATURE_SECRET = "your-secret-key";

// Prepare the payload
const to = "user@example.com";
const otp = "123456";
const timestamp = Date.now().toString();

// Concatenate fields (NO JSON serialization, NO delimiters)
const data = to + otp + timestamp;
// Result: "user@example.com1234561710086400000"

// Generate HMAC-SHA256 signature
const signature = crypto
  .createHmac("sha256", SIGNATURE_SECRET)
  .update(data)
  .digest("hex");
// Result: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6..."

// Send complete request
const request = {
  to: to,
  otp: otp,
  timestamp: timestamp,
  signature: signature, // This proves client knows the secret
};

// POST request body:
// {
//   "to": "user@example.com",
//   "otp": "123456",
//   "timestamp": "1710086400000",
//   "signature": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6..."
// }
```

**Important**: Do not JSON.stringify() the payload. Concatenate fields directly.

**Server-Side Signature Verification**:

```
1. Receive request with payload and signature
2. Extract: to, otp, timestamp, signature
3. Regenerate signature using same algorithm with received values
4. Compare regenerated signature with received signature
5. Use timing-safe comparison (crypto.timingSafeEqual)
6. If mismatch → Reject as unauthorized (HTTP 401)
```

**Signature Validation Rules**:

1. **Required Fields**: `to`, `otp`, `timestamp`, and `signature` must be present
2. **Field Validation**: All fields must be non-empty strings
3. **Timestamp Validation**:
   - Must be a valid integer (Unix milliseconds)
   - Cannot be from the future
   - Must be within 2 minutes (120,000ms) of server time
4. **Signature Verification**: HMAC-SHA256 signature must match using timing-safe comparison
5. **Case Normalization**: Email addresses converted to lowercase before signature generation

**Why This Matters**:

- **Authentication**: Only clients with correct secret can generate valid signatures
- **Integrity**: Any modification to to/otp/timestamp will invalidate signature
- **Non-Repudiation**: Client cannot deny sending a request (proved by valid signature)
- **Replay Prevention**: Combined with timestamp validation, prevents replaying old requests

### Rate Limiting - Abuse Prevention

OneMail implements multi-layer rate limiting:

**IP-Based Rate Limiting**:

- Tracks requests per IP address
- Default: 5 requests per 15 minutes per IP
- Implemented using sliding-window algorithm
- Returns HTTP 429 if limit exceeded

**Configuration**:

```env
RATE_LIMIT=5                    # Maximum requests
RATE_LIMIT_WINDOW=900000        # Window in milliseconds (15 minutes)
```

**How It Works**:

```
Request Timeline:
  Time 0ms   : Request 1 (Count: 1)
  Time 100ms : Request 2 (Count: 2)
  Time 200ms : Request 3 (Count: 3)
  Time 300ms : Request 4 (Count: 4)
  Time 400ms : Request 5 (Count: 5)
  Time 500ms : Request 6 → REJECTED (Count exceeds limit)
              HTTP 429: "Too many requests"

  Time 900,000ms+ : Window resets, counter resets to 0

Error Response (429 - Too Many Requests):
{
  "success": false,
  "message": "Too many requests"
}
```

**Recommended Limits by Use Case**:

```
Development/Testing:
  RATE_LIMIT=1000
  RATE_LIMIT_WINDOW=900000

Production (Conservative):
  RATE_LIMIT=100
  RATE_LIMIT_WINDOW=3600000        # 1 hour

Production (Moderate):
  RATE_LIMIT=500
  RATE_LIMIT_WINDOW=3600000        # 1 hour

Production (Relaxed):
  RATE_LIMIT=1000
  RATE_LIMIT_WINDOW=3600000        # 1 hour
```

### Timestamp-Based Replay Attack Prevention

Timestamps serve as primary defense against replay attacks:

**Attack Scenario Without Timestamp Validation**:

```
Attacker captures valid request:
  POST /otp/mail/register
  {
    "to": "attacker@mail.com",
    "otp": "123456",
    "timestamp": "1710086400000",
    "signature": "valid_signature_hash"
  }

Attacker replays same request hours/days later:
  Without timestamp check: Request accepted
  Result: OTP sent again to attacker's email

Impact: Could be exploited for brute forcing, email flooding, etc.
```

**How Timestamp Validation Prevents This**:

```
Replay Attempt Timeline:

Original Request:
  ├─ to: "attacker@mail.com"
  ├─ otp: "123456"
  ├─ timestamp: 1710086400000
  └─ signature: valid (matches current time)

Server Time: 1710086400000
Validation: (1710086400000 - 1710086400000) = 0ms → OK ✓

Replay Attempt (1 hour later):
Server Time: 1710090000000 (1 hour = 3,600,000ms later)
Validation: (1710090000000 - 1710086400000) = 3,600,000ms
           3,600,000ms > 120,000ms (MAX_AGE) → REJECTED ✗
           HTTP 410: "Request Expired"
```

**2-Minute Window Rationale**:

- Allows for normal network latency (typically 50-500ms)
- Provides buffer for client-server clock differences
- Prevents acceptance of stale requests
- Short enough to prevent replay attack window
- Long enough for real-world scenarios

## Project Structure and File Organization

```
OneMail/
│
├── app.ts                          # Express application setup and middleware configuration
│   ├─ Creates Express app instance
│   ├─ Registers middleware (logger, rate limiter, validator)
│   ├─ Mounts routers
│   ├─ Registers error handler
│   └─ Health check endpoint
│
├── server.ts                       # Application entry point and server initialization
│   ├─ Imports Express app
│   ├─ Loads environment configuration
│   ├─ Starts HTTP server
│   └─ Logs startup message
│
├── package.json                    # Project metadata and dependencies
├── tsconfig.json                   # TypeScript compiler configuration
├── .env                           # Environment variables (not versioned)
├── .gitignore                     # Git ignore rules
│
├── config/                         # Configuration modules
│   ├── env.ts                      # Environment variable loader
│   │   ├─ Reads .env file with dotenv
│   │   ├─ Exports config object with typed properties
│   │   ├─ Centralized configuration access point
│   │   └─ Properties: port, mail (host, port, user, pass), signaturesecret, rate limits
│   │
│   └── mailer.ts                   # Nodemailer SMTP transporter setup
│       ├─ Creates transporter instance
│       ├─ Configures SMTP connection
│       ├─ Handles TLS/SSL settings
│       ├─ Manages connection pooling
│       └─ Exported for use by controllers
│
├── controllers/                    # Request handlers / business logic
│   └── otp.controller.ts           # OTP email sending controller
│       ├─ sendRegisterOtp()        # Handler for registration OTP
│       ├─ sendForgetPasswordOtp()  # Handler for password reset OTP
│       ├─ Validates input data
│       ├─ Selects template
│       ├─ Sends email via transporter
│       └─ Returns standardized response
│
├── middlewares/                    # Express middleware functions
│   ├── errorHandler.ts             # Global error handling middleware
│   │   ├─ Catches all errors
│   │   ├─ Checks error type
│   │   ├─ Formats error response
│   │   └─ Returns appropriate HTTP status
│   │
│   ├── rateLimiter.ts              # Rate limiting middleware
│   │   ├─ Uses express-rate-limit package
│   │   ├─ Tracks requests per IP
│   │   ├─ Enforces configured limits
│   │   ├─ Returns 429 on exceeded
│   │   └─ Automatic reset after window
│   │
│   ├── requestLogger.ts            # Request logging middleware
│   │   ├─ Logs incoming requests
│   │   ├─ Records metadata
│   │   ├─ Non-blocking operation
│   │   └─ For audit/debugging
│   │
│   └── signatureValidator.ts       # HMAC signature validation middleware
│       ├─ Field presence check
│       ├─ Type and format validation
│       ├─ Timestamp freshness validation
│       ├─ Future timestamp detection
│       ├─ Request age validation (replay prevention)
│       ├─ Signature regeneration and comparison
│       ├─ Timing-safe comparison for security
│       └─ Attaches cleaned data to request
│
├── routes/                         # Express route definitions
│   └── otp.routes.ts               # OTP endpoint routes
│       ├─ POST /otp/mail/register
│       │  └─ Route to sendRegisterOtp controller
│       │
│       └─ POST /otp/mail/forget-password
│          └─ Route to sendForgetPasswordOtp controller
│
├── templates/                      # Email HTML templates
│   ├── signin-otp.template.ts      # Registration email template
│   │   ├─ Function takes OTP parameter
│   │   ├─ Returns formatted HTML
│   │   ├─ Used by sendRegisterOtp
│   │   └─ Subject: "OneAccounts Registration One Time Password"
│   │
│   └── forgetPwd-otp.template.ts   # Password reset email template
│       ├─ Function takes OTP parameter
│       ├─ Returns formatted HTML
│       ├─ Used by sendForgetPasswordOtp
│       └─ Subject: "OneAccounts Reset Password One Time Password"
│
└── utils/                          # Utility functions and classes
    ├── APIError.ts                 # Custom error class
    │   ├─ Extends Error class
    │   ├─ Adds statusCode property
    │   ├─ Used throughout app for typed errors
    │   └─ Caught by error handler middleware
    │
    └── signatureGenerator.ts       # HMAC-SHA256 signature generation
        ├─ Function: signatureGenerator(to, otp, timestamp)
        ├─ Algorithm: HMAC-SHA256
        ├─ Input: Email, OTP, timestamp string
        ├─ Output: Hexadecimal signature string
        ├─ Uses SIGNATURE_SECRET from config
        └─ Used by signatureValidator for verification
```

### File Relationships and Data Flow

```
Request Lifecycle:

  server.ts ─→ app.ts ─→ requestLogger ─→ rateLimiter ─→ signatureValidator
                              ↓                 ↓               ↓
                           (log)         (track IP)     (validate fields,
                                                         timestamp, signature)
                                                              ↓
  ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ← otp.routes.ts (dispatch)
          ↑                                              ↓
          ↑                         otp.controller.ts
          ↑                         ├─ Select template
          ↑                         ├─ Generate HTML
          ↑                         ├─ Call mailer
          ↑                         ↓
          ↑                      mailer.ts
          ↑                      ├─ SMTP connect
          ↑                      ├─ Send email
          ↑                      └─ Get response
          ↑                         ↓
          ↑                    Return response
          ↑                         ↓
          ← ─ ─ ← ─ ─ ← ─ ─ ← ─ ─ ← ─ ─
          ↓
    errorHandler (catch any error)
          ↓
    Format error response
          ↓
    Send to client
```

## HTTP Status Codes and Error Responses

OneMail returns standardized error responses with appropriate HTTP status codes:

### 400 Bad Request - Validation Errors

Returned when request validation fails:

```
Scenarios:
├─ Missing required fields (to, otp, timestamp, signature)
├─ Empty field values
├─ Invalid field types (non-string values)
├─ Whitespace-only fields
└─ Invalid timestamp format (non-numeric, leading zeros, etc.)

Response:
{
  "success": false,
  "message": "Missing required fields" | "Invalid timestamp format" | ...
}
```

### 401 Unauthorized - Invalid Signature

Returned when HMAC-SHA256 signature verification fails:

```
Scenarios:
├─ Signature does not match regenerated signature
├─ Client using wrong SIGNATURE_SECRET
├─ Payload was tampered with
└─ Timing-safe comparison rejected

Response:
{
  "success": false,
  "message": "Invalid signature"
}

Troubleshooting:
├─ Verify SIGNATURE_SECRET matches on client and server
├─ Ensure payload fields are concatenated (not JSON stringified)
├─ Check field values: to, otp, timestamp
└─ Verify client signature generation algorithm
```

### 410 Gone - Request Expired

Returned when timestamp is older than 2 minutes:

```
Scenario: Replay Attack Prevention
├─ Request created at time T1
├─ Request sent at time T1 + 5 seconds (valid)
├─ Same request replayed at time T1 + 3 minutes (rejected)
├─ Age: 3 minutes = 180,000 milliseconds
├─ Max allowed: 2 minutes = 120,000 milliseconds
└─ Difference: 60,000ms over limit

Response:
{
  "success": false,
  "message": "Request Expired"
}

Solutions:
├─ Generate new request with current timestamp
├─ New signature must be generated with new timestamp
├─ Ensure client-server clocks are reasonably synchronized
└─ Check server system time for accuracy
```

### 429 Too Many Requests - Rate Limit Exceeded

Returned when rate limit is exceeded:

```
Scenario: Rate Limiting
├─ IP address sends >5 requests in 15 minutes
├─ Requests are tracked and counted
├─ When 6th request arrives within window → rejected
└─ Counter resets after 15 minutes

Response:
{
  "success": false,
  "message": "Too many requests"
}

Solutions:
├─ Implement exponential backoff in client
├─ Distribute requests across time (don't burst)
├─ Contact administrator to increase rate limit if needed
└─ Check if multiple clients sharing same IP
```

### 500 Internal Server Error - Processing Failed

Returned when email sending or other server errors occur:

```
Scenarios:
├─ Email sending failed (SMTP connection error)
├─ SMTP authentication failed
├─ Database or configuration error
├─ Unexpected runtime exception
└─ Environment variable not configured

Response:
{
  "success": false,
  "message": "Failed to send OTP" | "Internal Server Error"
}

Debugging:
├─ Check SMTP credentials in .env
├─ Verify MAIL_HOST and MAIL_PORT are correct
├─ Review server logs for detailed error message
├─ Ensure all required environment variables are set
├─ Check email server firewall/network connectivity
└─ Verify MAIL_USER account hasn't hit sending limits
```

### Success Response - 200 OK

```
Response:
{
  "success": true,
  "message": "Mail sent successfully"
}

Indicates:
├─ All validations passed
├─ Email successfully sent to SMTP server
├─ SMTP accepted the message
└─ Message queued for delivery
```

## Middleware Architecture

The OneMail service uses a chain of middleware components to process each request. Middleware executes in order, with each layer adding security or logging capabilities.

### Middleware Execution Order

```
1. express.json() - Body Parser
   └─ Parses incoming JSON request body
   └─ Populates req.body with parsed JSON
   └─ Throws 400 if JSON is malformed

2. requestLogger - Logging Middleware
   └─ Logs request metadata (timestamp, method, path, IP)
   └─ Useful for debugging and monitoring
   └─ Does not block request processing

3. rateLimiter - Rate Limiting (on /otp routes)
   └─ Tracks requests per IP address
   └─ Enforces request count limits
   └─ Rejects with HTTP 429 if exceeded
   └─ Does not block if within limits

4. signatureValidator - Signature Validation (on /otp routes)
   └─ Validates all required fields present
   └─ Type checks all fields
   └─ Validates timestamp (freshness, future check, age check)
   └─ Regenerates and compares HMAC-SHA256 signature
   └─ Normalizes and attaches cleaned data to request
   └─ Rejects with appropriate HTTP error if validation fails

5. Route Handler / Controller
   └─ Processes validated request
   └─ Selects appropriate email template
   └─ Sends email via SMTP
   └─ Returns success response or throws error

6. errorHandler - Global Error Handler
   └─ Catches all errors from above layers
   └─ Formats error responses
   └─ Returns appropriate HTTP status and message
   └─ Final middleware in chain
```

### Middleware Request/Response Flow

```
Request → Parser → Logger → RateLimit → Validator → Handler
                ↓         ↓           ↓            ↓
             Logs       Check       Validate    Process
             Request    IP Limit    Signature   Request
                ↓         ↓           ↓            ↓
         Continue      OK/429     OK/401,410   OK/500
                ↓         ↓           ↓            ↓
             Next → Next → Next → Next → next() → Controller
                                        ↓
                                    Send Email
                                        ↓
                                    Response
                                        ↓
                                    ← Return to Client
```

### Key Middleware Details

**Request Logger**:

- Executes on ALL requests (including health check)
- Logs: timestamp, HTTP method, URL path, client IP, user-agent
- Non-blocking (does not add significant latency)
- Purpose: Audit trail and debugging

**Rate Limiter**:

- Executes on `/otp/*` routes only
- Tracks IP addresses (respects X-Forwarded-For in proxied environments)
- Sliding window algorithm (re-evaluates on each request)
- Returns 429 error if exceeded
- Window resets automatically after configured duration

**Signature Validator**:

- Executes on `/otp/*` routes only
- Most security-critical middleware
- Performs 5 validation stages (fields, types, timestamp, signature)
- Timing-safe signature comparison prevents timing attacks
- Attaches cleaned data to `req.body.data` for controller

**Error Handler**:

- Catches all errors from any middleware or route
- Checks if error is instance of custom `APIError` class
- Returns appropriate HTTP status code and error message
- Falls back to 500 for unknown error types

## 🧪 Testing the API

### Using Postman

1. **Import Collection**: Create a new request
2. **Method**: POST
3. **URL**: `http://localhost:3001/otp/mail/register`
4. **Headers**: `Content-Type: application/json`
5. **Body** (raw JSON):
   ```json
   {
     "to": "test@example.com",
     "otp": "123456",
     "timestamp": 1710086400000,
     "signature": "calculated-signature-here"
   }
   ```

### Using NodeJS

```javascript
import crypto from "crypto";

const SIGNATURE_SECRET = "your-signature-secret";
const MAIL_SERVICE_URL = "http://localhost:3001";

async function sendOTP(to, otp) {
  const timestamp = Date.now();

  const payload = { to, otp, timestamp };
  const signature = crypto
    .createHmac("sha256", SIGNATURE_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");

  const response = await fetch(`${MAIL_SERVICE_URL}/otp/mail/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, signature }),
  });

  return response.json();
}

sendOTP("user@example.com", "123456");
```

## 📝 Email Templates

### Registration OTP Template

- **File**: [templates/signin-otp.template.ts](templates/signin-otp.template.ts)
- **Purpose**: Sends OTP for user registration
- **Subject**: "OneAccounts Registration One Time Password"

### Password Reset OTP Template

- **File**: [templates/forgetPwd-otp.template.ts](templates/forgetPwd-otp.template.ts)
- **Purpose**: Sends OTP for password reset
- **Subject**: "OneAccounts Reset Password One Time Password"

## 🚨 Troubleshooting

### Email Not Sending

- **Check**: SMTP credentials in `.env`
- **Verify**: SMTP server allows connections on configured port
- **Try**: Use app-specific passwords for Gmail instead of regular passwords
- **Logs**: Check console output for detailed error messages

### Signature Validation Errors

- **Issue**: "Invalid timestamp format"
  - Solution: Ensure timestamp is a valid Unix millisecond timestamp
- **Issue**: "Request Expired"
  - Solution: Timestamp must be within 2 minutes of server time
- **Issue**: "Signature mismatch"
  - Solution: Verify signature generation uses correct secret and payload format

### Rate Limiting Issues

- **Issue**: Getting 429 errors
  - Solution: Increase `RATE_LIMIT` or `RATE_LIMIT_WINDOW` in `.env`
  - For testing: Set `RATE_LIMIT=1000` temporarily

### CORS Issues

- If calling from browser: The API needs CORS configuration (currently not enabled)
- Update [app.ts](app.ts) to add CORS headers if needed

## 🔄 Integration with OneSoftware Services

OneMail is designed to integrate seamlessly with other OneSoftware services:

- **OneAuth**: Sends registration and password reset OTPs
- **OneTeams**: Can be extended for team-related email notifications

## 📈 Performance Optimization

- **Connection Pooling**: Nodemailer reuses SMTP connections
- **Async Processing**: All email operations are non-blocking
- **Rate Limiting**: Protects against spam and abuse
- **Request Logging**: Minimal overhead logging for monitoring

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Rotate secrets regularly** - Update `SIGNATURE_SECRET` periodically
3. **Use strong credentials** - For SMTP authentication
4. **Enable HTTPS** - In production, use HTTPS for all communications
5. **Monitor rate limits** - Adjust based on actual usage patterns
6. **Validate emails** - Implement email validation on client side
7. **Log access** - Monitor failed authentication attempts

## 🚀 Production Deployment

### Environment Variables

Ensure all `.env` variables are set on your production server.

### Recommended Configuration

```env
PORT=3000
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASS=your-sendgrid-api-key
SIGNATURE_SECRET=very-long-random-secret-key
RATE_LIMIT=100
RATE_LIMIT_WINDOW=900000
```

### Monitoring

- Enable request logging
- Monitor email delivery success rate
- Track error rates and types
- Set up alerts for high error rates

## 📄 License

This project is part of the OneSoftware suite. All rights reserved.

## 👥 Support & Contribution

For issues, questions, or contributions, please reach out to the OneAuth team or submit an issue in your project management system.

---

**Version**: 1.0.0  
**Last Updated**: March 2026  
**Maintainer**: OneSoftware Development Team
