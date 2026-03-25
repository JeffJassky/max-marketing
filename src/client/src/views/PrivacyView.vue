<script setup lang="ts">
import { FileText, ArrowLeft } from 'lucide-vue-next';
</script>

<template>
  <div class="min-h-screen bg-amplify-dark px-4 py-12">
    <div class="max-w-3xl mx-auto">
      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center gap-3">
          <div class="w-10 h-10 bg-amplify-green rounded-lg flex items-center justify-center text-amplify-darker font-bold text-2xl relative overflow-hidden">
            <span class="z-10">M</span>
            <div class="absolute top-0 right-0 w-5 h-5 bg-white/30 rounded-bl-lg" />
          </div>
          <div class="text-left">
            <h1 class="text-xl font-bold text-white tracking-tight leading-none">MAXED</h1>
            <p class="text-[10px] text-amplify-green font-mono tracking-widest uppercase">Marketing.OS</p>
          </div>
        </div>
      </div>

      <!-- Header -->
      <div class="text-center mb-12">
        <div class="w-16 h-16 bg-amplify-green/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <FileText :size="32" class="text-amplify-green" />
        </div>
        <h1 class="text-3xl font-bold text-white mb-3">Privacy Policy</h1>
        <p class="text-slate-500 text-sm">Last updated: March 25, 2026</p>
      </div>

      <!-- Content -->
      <div class="space-y-8 text-sm text-slate-400 leading-relaxed">

        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 class="text-lg font-bold text-white">1. Introduction</h2>
          <p>
            Maxed Marketing ("we", "us", "our") operates the Maxed Marketing.OS platform. This Privacy Policy explains
            what information we collect, how we use it, and the choices you have regarding your data.
          </p>
          <p>
            By using our platform, you agree to the collection and use of information in accordance with this policy.
          </p>
        </section>

        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 class="text-lg font-bold text-white">2. Information We Collect</h2>
          <h3 class="text-sm font-semibold text-slate-300">Account Information</h3>
          <p>
            When you create an account, we collect your name and email address. Passwords are one-way hashed and cannot
            be retrieved by anyone, including us.
          </p>
          <h3 class="text-sm font-semibold text-slate-300">Connected Platform Data</h3>
          <p>
            When you connect third-party platforms &mdash; including Google Ads, Meta Ads, Google Analytics 4, Shopify,
            Instagram, Facebook Pages, TikTok, and Google Search Console &mdash; we import <span class="text-slate-300 font-medium">aggregated performance
            metrics only</span> (e.g., impressions, clicks, spend, conversions, revenue). We request read-only access and
            do not modify your campaigns, ads, products, or store settings.
          </p>
          <h3 class="text-sm font-semibold text-slate-300">Usage Data</h3>
          <p>
            We collect standard usage information such as pages visited, features used, and session duration to improve
            the platform experience.
          </p>
        </section>

        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 class="text-lg font-bold text-white">3. How We Use Your Information</h2>
          <ul class="space-y-2 list-none">
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span>To provide, operate, and maintain the platform and its features</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span>To generate dashboards, reports, insights, and AI-powered analysis from your connected marketing data</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span>To authenticate your identity and enforce role-based access control</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span>To send transactional emails such as password resets</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span>To monitor platform health, detect issues, and improve reliability</span>
            </li>
          </ul>
        </section>

        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 class="text-lg font-bold text-white">4. AI-Powered Features</h2>
          <p>
            Our platform includes an AI marketing analyst that can query and interpret your performance data. Conversations
            with the AI are scoped to your authorized accounts and processed by our AI provider (Anthropic).
          </p>
          <p>
            <span class="text-slate-300 font-medium">Your data is not used to train AI models.</span> The AI operates in
            read-only mode and cannot modify your accounts or platform data.
          </p>
        </section>

        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 class="text-lg font-bold text-white">5. Data Storage &amp; Security</h2>
          <p>
            All data is stored and processed in the <span class="text-slate-300 font-medium">United States</span> using
            enterprise-grade cloud infrastructure provided by DigitalOcean, Google Cloud, and AWS.
          </p>
          <ul class="space-y-2 list-none">
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span>Data is encrypted in transit (TLS) and at rest (AES-256)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span>Customer data is logically isolated between accounts</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span>Platform connections use OAuth &mdash; we never see or store your third-party passwords</span>
            </li>
          </ul>
          <p>
            For more details, see our <router-link to="/security" class="text-indigo-400 hover:text-indigo-300 transition-colors">Security page</router-link>.
          </p>
        </section>

        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 class="text-lg font-bold text-white">6. Third-Party Services</h2>
          <p>We use the following third-party services to operate the platform:</p>
          <ul class="space-y-2 list-none">
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span><span class="text-slate-300 font-medium">Google Cloud (BigQuery)</span> &mdash; data warehousing and analytics</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span><span class="text-slate-300 font-medium">DigitalOcean</span> &mdash; application hosting and managed database</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span><span class="text-slate-300 font-medium">AWS (S3)</span> &mdash; media and asset storage</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span><span class="text-slate-300 font-medium">Anthropic</span> &mdash; AI-powered analysis (does not train on your data)</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span><span class="text-slate-300 font-medium">Windsor.ai</span> &mdash; data connector for importing marketing platform metrics</span>
            </li>
          </ul>
          <p>
            We do not sell, rent, or share your data with third parties for advertising or marketing purposes.
          </p>
        </section>

        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 class="text-lg font-bold text-white">7. Data Retention</h2>
          <p>
            We retain your connected platform data for as long as your account is active and the platform connection remains
            enabled. You may disconnect a platform at any time, and we will stop importing new data from that source.
          </p>
          <p>
            If you delete your account, we will remove your personal information and associated data within 30 days.
            Aggregated, de-identified data may be retained for analytics purposes.
          </p>
        </section>

        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 class="text-lg font-bold text-white">8. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul class="space-y-2 list-none">
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span>Access the personal data we hold about you</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span>Request correction of inaccurate data</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span>Request deletion of your data</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span>Export your data in a portable format</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-amplify-green mt-0.5 shrink-0">&bull;</span>
              <span>Withdraw consent for optional data processing</span>
            </li>
          </ul>
          <p>
            To exercise any of these rights, contact us at the email below.
          </p>
        </section>

        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 class="text-lg font-bold text-white">9. Cookies</h2>
          <p>
            We use essential cookies and local storage to maintain your session, remember your selected account, and store
            preferences. We do not use third-party tracking cookies or advertising pixels.
          </p>
        </section>

        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 class="text-lg font-bold text-white">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by posting the
            updated policy on this page with a revised "Last updated" date.
          </p>
        </section>

        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 class="text-lg font-bold text-white">11. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or your data, contact us at
            <a href="mailto:privacy@maxedmarketing.com" class="text-indigo-400 hover:text-indigo-300 transition-colors">privacy@maxedmarketing.com</a>.
          </p>
        </section>
      </div>

      <!-- Footer -->
      <div class="mt-10 text-center">
        <router-link to="/login" class="text-sm text-slate-500 hover:text-slate-400 transition-colors inline-flex items-center gap-1">
          <ArrowLeft :size="14" />
          Back to sign in
        </router-link>
      </div>
    </div>
  </div>
</template>
