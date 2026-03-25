# MaxMarketing Security Overview

This document outlines how MaxMarketing protects customer data across infrastructure, application, third-party integrations, and AI services.

---

## Infrastructure & Hosting

### Database — MongoDB (DigitalOcean Managed)
- **Encryption in transit**: TLS-enforced connections
- **Encryption at rest**: DigitalOcean managed encryption
- **Network isolation**: Private VPC networking; database not publicly accessible
- **Access control**: Connection restricted to application servers via connection string credentials
- **Data stored**: User accounts, account memberships, Shopify session tokens

### Data Warehouse — Google BigQuery
- **Encryption at rest**: AES-256, Google-managed keys (default)
- **Encryption in transit**: TLS for all API calls
- **Access control**: Service account with scoped IAM permissions (`amplify-11` project)
- **Authentication**: JWT-based service account credentials (no user-level keys)
- **Data partitioning**: Tables partitioned by date and clustered for query isolation and cost control
- **Data stored**: Marketing performance metrics, ad spend, analytics, social media engagement, agent chat logs

### Object Storage — AWS S3
- **Encryption at rest**: Server-side encryption (AWS default SSE-S3)
- **Encryption in transit**: HTTPS for all operations
- **Access control**: IAM credentials with scoped bucket access
- **Data stored**: Social media and creative ad thumbnails only (no PII)

### Job Queue — Redis
- **TLS support**: Configurable for production deployments
- **Access**: Connection string with authentication
- **Data stored**: Transient job payloads for data import scheduling (no PII persisted)

---

## Application Security

### Authentication
- **Method**: Session-based authentication via Passport.js (local strategy)
- **Password hashing**: bcrypt with 12 salt rounds (one-way, industry standard)
- **Session cookies**:
  - `httpOnly: true` — prevents JavaScript access (XSS protection)
  - `sameSite: lax` — mitigates CSRF attacks
  - Max age: 7 days
  - Cleared on logout
- **Session storage**: MongoDB-backed (MongoStore) — not in-memory

### Password Reset
- **Token generation**: 32-byte cryptographically random token
- **Token storage**: SHA-256 hashed in database (never stored in plaintext)
- **Expiration**: 1 hour, single use
- **Delivery**: Via SendGrid transactional email

### Role-Based Access Control
- **Roles**: `admin` and `user`
- **Middleware enforcement**: `requireAuth`, `requireAdmin`, `requireAccountAccess`
- **Multi-tenancy**: Users only access accounts they have explicit membership in (AccountMembership model)
- **Account isolation**: All data queries are filtered by the user's authorized account IDs

### Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| Login / Forgot Password | 10 requests | 15 minutes |
| Chat (AI Agent) | 10 requests | 1 minute |
| General API | 100 requests | 1 minute |

### Input Validation
- **Environment config**: Zod schema validation on startup — process exits if required variables are missing
- **Request body limits**: 10 MB max for JSON and URL-encoded payloads
- **Thumbnail proxy**: Path traversal protection with platform whitelist and fileKey validation
- **Shopify OAuth**: HMAC signature verification (SHA-256, timing-safe comparison) and nonce-based CSRF protection

---

## Third-Party Data Integrations

MaxMarketing connects to marketing platforms to import performance data. Here's how each integration handles credentials and data:

### Windsor.ai (Data Aggregator)
- **Role**: Aggregates data from Google Ads, Meta Ads, GA4, Instagram, Facebook, TikTok, and Google Search Console
- **Authentication**: API key
- **Data flow**: Windsor pulls data from connected ad platforms → MaxMarketing imports it into BigQuery
- **Token management**: Windsor OAuth tokens stored in BigQuery with available/assigned/invalid states; validated on each use
- **Data accessed**: Campaign performance metrics, ad spend, engagement — no end-user PII

### Google Ads & Meta Ads (via Windsor)
- No direct API credentials stored — Windsor acts as the authorized intermediary
- MaxMarketing receives aggregated performance metrics only

### Google Analytics 4 (via Windsor)
- Session, conversion, and traffic source data
- No raw user-level data imported — aggregated metrics only

### Shopify (Direct OAuth)
- **Authentication**: OAuth 2.0 with PKCE-like nonce flow
- **Scopes**: `read_orders`, `read_products`, `read_customers` (read-only)
- **Token storage**: Encrypted in MongoDB
- **HMAC verification**: All callbacks verified with timing-safe SHA-256 comparison
- **Data accessed**: Order totals, product catalog, customer counts — used for revenue metrics

### SendGrid (Email)
- **Purpose**: Transactional emails only (password resets)
- **Data sent**: Recipient email address and reset link
- **No marketing data** is sent through SendGrid

---

## AI / LLM Security

### Google Gemini (Marketing Agent)

MaxMarketing uses Google's Gemini API to power an AI marketing analyst chat feature. Here's how we protect data in that interaction:

#### What data is sent to Gemini
- **Chat history**: The user's conversation messages within the current session
- **Schema catalog**: Table and metric definitions (structure only, not raw data)
- **Query results**: Aggregated marketing metrics returned from BigQuery tool calls
- **Account context**: Account IDs for query filtering

#### What data is NOT sent to Gemini
- **Passwords or authentication tokens**
- **Raw database connection strings**
- **Other users' data** — queries are filtered to the authenticated user's accounts
- **Real table names** — virtual/alias names are used in the schema catalog

#### Safeguards
- **Rate limited**: 10 requests per minute per user
- **Tool sandboxing**: The agent can only execute read-only BigQuery queries (`execute_sql`) and fetch distinct dimension values — no write operations
- **Iteration cap**: Max 5 tool-call iterations per request to prevent runaway loops
- **Account isolation**: All SQL queries generated by the agent are scoped to the user's authorized account IDs
- **Audit logging**: All chat interactions, SQL queries, and errors are logged to BigQuery monitoring tables
- **System prompt guardrails**: The agent persona includes explicit instructions about data privacy and business safety

#### Google Gemini Data Policies
- Gemini API (paid tier) does **not** use customer data for model training
- Data is processed for the API request and not retained beyond the request lifecycle
- Google Cloud terms of service and data processing agreements apply

### Content Generation (Analyst/Editor)
- **Purpose**: Generates business insight summaries from aggregated performance data
- **Data sent**: Pre-aggregated metric summaries (spend, ROAS, impressions, etc.)
- **No PII** is included in content generation prompts

---

## Secrets Management

### How secrets are stored
- **Environment variables**: All credentials stored as environment variables, validated at startup via Zod schema
- **No hardcoded secrets**: Credentials are never committed to source code
- **`.env` files**: Excluded from version control via `.gitignore`

### Critical secrets inventory
| Secret | Purpose |
|--------|---------|
| `SESSION_SECRET` | Express session signing |
| `MONGODB_URI` | Database connection |
| `GOOGLE_APPLICATION_CREDENTIALS_BASE64` | BigQuery service account |
| `GEMINI_API_KEY` | AI agent API access |
| `WINDSOR_API_KEY` | Marketing data aggregator |
| `SENDGRID_API_KEY` | Transactional email |
| `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` | Shopify OAuth |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 thumbnail storage |
| `REDIS_URL` | Job queue connection |

---

## Data Residency

| Service | Provider | Region |
|---------|----------|--------|
| Application Server | DigitalOcean | NYC |
| MongoDB | DigitalOcean Managed | NYC |
| BigQuery | Google Cloud | US |
| S3 (Thumbnails) | AWS | us-east-2 (Ohio) |
| Gemini API | Google Cloud | US |
| Redis | DigitalOcean Managed | NYC |

All data is stored and processed within the United States.

---

## Summary of Protections

| Layer | Protection |
|-------|-----------|
| Passwords | bcrypt (12 rounds), never stored in plaintext |
| Sessions | httpOnly, sameSite, MongoDB-backed, 7-day expiry |
| API access | Rate limiting on auth, chat, and general endpoints |
| Data in transit | TLS/HTTPS across all services |
| Data at rest | Provider-managed encryption (Google, AWS, DigitalOcean) |
| Multi-tenancy | Account membership checks on every request |
| AI interactions | Read-only queries, account-scoped, rate-limited, audit-logged |
| OAuth flows | HMAC verification, nonce CSRF protection, timing-safe comparison |
| Secrets | Environment variables, Zod-validated, never in source code |
