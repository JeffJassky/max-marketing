# How We Protect Your Data

At MaxMarketing, the security of your business data is a top priority. This page explains how we keep your information safe — from the moment it enters our platform to how it's stored, accessed, and used.

---

## Your Data Is Encrypted

All data is encrypted both in transit and at rest. When your data moves between your browser and our servers — or between our servers and partner services — it's protected by industry-standard TLS encryption. When stored, your data is encrypted using AES-256 encryption managed by our infrastructure providers (Google Cloud, AWS, and DigitalOcean).

## Passwords Are Never Stored

We never store your password. Instead, we use a one-way hashing algorithm (bcrypt) that makes it mathematically impossible to reverse-engineer your password from what we store. If you ever need to reset your password, we generate a secure, single-use token that expires within one hour.

## Account Isolation

Your data is completely isolated from other customers. Every request to our platform is verified against your account permissions, ensuring you only ever see data that belongs to you. Our role-based access control system means team members only see what they're authorized to access.

## How We Connect to Your Marketing Platforms

MaxMarketing integrates with platforms like Google Ads, Meta Ads, Google Analytics, Shopify, Instagram, Facebook, TikTok, and Google Search Console to bring your marketing data together in one place.

- **Read-only access**: We only request the minimum permissions needed to pull performance metrics. We never modify your campaigns, ads, or store settings.
- **Secure authentication**: Platform connections use industry-standard OAuth, meaning we never see or store your platform passwords. You authorize access directly through each platform.
- **Aggregated metrics only**: We import performance data like spend, impressions, clicks, and conversions — not your customers' personal information.

## AI-Powered Insights

Our AI marketing analyst helps you understand your data through natural conversation. Here's how we keep that interaction secure:

- **Your data stays yours**: Our AI provider (Google Gemini) does not use your data to train their models. Your information is processed for your request and not retained.
- **Scoped to your accounts**: The AI can only access data from accounts you're authorized to view — never other customers' data.
- **Read-only**: The AI can query your marketing metrics but cannot modify anything in your accounts or connected platforms.
- **Rate-limited and monitored**: AI interactions are rate-limited to prevent abuse and logged for quality assurance.

## Infrastructure & Hosting

Our platform runs on trusted, enterprise-grade cloud providers:

- **DigitalOcean** — Application servers and primary database (managed MongoDB)
- **Google Cloud** — Data warehouse (BigQuery) and AI services
- **AWS** — Media storage (thumbnails and creative assets only)

All data is stored and processed within the **United States**.

## Secrets & Credentials

API keys, database credentials, and other sensitive configuration are stored as encrypted environment variables — never in source code. Access to production systems is restricted to authorized personnel only.

## Ongoing Practices

- **Rate limiting** on login, API, and AI endpoints to prevent abuse
- **Session management** with automatic expiration and secure cookie settings
- **Input validation** on all API requests to prevent injection attacks
- **Audit logging** on AI interactions and data access patterns

---

## Questions?

If you have questions about our security practices or need additional information for your organization's review, reach out to us at **security@maxedmarketing.com**.
