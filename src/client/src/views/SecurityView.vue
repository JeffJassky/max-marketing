<script setup lang="ts">
import { Shield, Lock, Eye, Database, Bot, Globe, Server, ArrowLeft } from 'lucide-vue-next';
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
          <Shield :size="32" class="text-amplify-green" />
        </div>
        <h1 class="text-3xl font-bold text-white mb-3">How We Protect Your Data</h1>
        <p class="text-slate-400 text-lg max-w-xl mx-auto">
          Your business data is a top priority. Here's how we keep it safe at every step.
        </p>
      </div>

      <!-- Sections -->
      <div class="space-y-6">
        <!-- Encryption -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Lock :size="20" class="text-indigo-400" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-white mb-2">Encrypted Everywhere</h2>
              <p class="text-sm text-slate-400 leading-relaxed">
                All data is encrypted in transit using TLS and at rest using AES-256 encryption across all of our
                infrastructure providers. Your connection to MaxMarketing is always secure.
              </p>
            </div>
          </div>
        </div>

        <!-- Passwords -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Eye :size="20" class="text-green-400" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-white mb-2">Passwords Are Never Stored</h2>
              <p class="text-sm text-slate-400 leading-relaxed">
                We use one-way hashing so your password can never be retrieved &mdash; not even by us. Password resets
                use a secure, single-use token that expires within one hour.
              </p>
            </div>
          </div>
        </div>

        <!-- Account Isolation -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Database :size="20" class="text-amber-400" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-white mb-2">Account Isolation</h2>
              <p class="text-sm text-slate-400 leading-relaxed">
                Your data is completely isolated from other customers. Every request is verified against your account
                permissions, and role-based access control ensures team members only see what they're authorized to view.
              </p>
            </div>
          </div>
        </div>

        <!-- Platform Connections -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Globe :size="20" class="text-sky-400" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-white mb-2">Platform Connections</h2>
              <p class="text-sm text-slate-400 leading-relaxed mb-3">
                We connect to Google Ads, Meta Ads, GA4, Shopify, Instagram, Facebook, TikTok, and Google Search Console
                to bring your marketing data together.
              </p>
              <ul class="space-y-2">
                <li class="flex items-start gap-2 text-sm text-slate-400">
                  <span class="text-sky-400 mt-1 shrink-0">&bull;</span>
                  <span><span class="text-slate-300 font-medium">Read-only access</span> &mdash; we never modify your campaigns, ads, or store settings</span>
                </li>
                <li class="flex items-start gap-2 text-sm text-slate-400">
                  <span class="text-sky-400 mt-1 shrink-0">&bull;</span>
                  <span><span class="text-slate-300 font-medium">Secure OAuth</span> &mdash; we never see or store your platform passwords</span>
                </li>
                <li class="flex items-start gap-2 text-sm text-slate-400">
                  <span class="text-sky-400 mt-1 shrink-0">&bull;</span>
                  <span><span class="text-slate-300 font-medium">Performance metrics only</span> &mdash; spend, clicks, conversions &mdash; not your customers' personal info</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- AI Security -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Bot :size="20" class="text-purple-400" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-white mb-2">AI-Powered Insights</h2>
              <p class="text-sm text-slate-400 leading-relaxed mb-3">
                Our AI marketing analyst helps you understand your performance data through conversation. Here's how we keep it safe:
              </p>
              <ul class="space-y-2">
                <li class="flex items-start gap-2 text-sm text-slate-400">
                  <span class="text-purple-400 mt-1 shrink-0">&bull;</span>
                  <span><span class="text-slate-300 font-medium">Your data stays yours</span> &mdash; our AI provider does not use your data to train models</span>
                </li>
                <li class="flex items-start gap-2 text-sm text-slate-400">
                  <span class="text-purple-400 mt-1 shrink-0">&bull;</span>
                  <span><span class="text-slate-300 font-medium">Scoped access</span> &mdash; the AI can only see data from your authorized accounts</span>
                </li>
                <li class="flex items-start gap-2 text-sm text-slate-400">
                  <span class="text-purple-400 mt-1 shrink-0">&bull;</span>
                  <span><span class="text-slate-300 font-medium">Read-only</span> &mdash; it can query your metrics but never modify anything</span>
                </li>
                <li class="flex items-start gap-2 text-sm text-slate-400">
                  <span class="text-purple-400 mt-1 shrink-0">&bull;</span>
                  <span><span class="text-slate-300 font-medium">Rate-limited &amp; monitored</span> &mdash; every interaction is logged and limited to prevent misuse</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Infrastructure -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Server :size="20" class="text-rose-400" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-white mb-2">Infrastructure &amp; Hosting</h2>
              <p class="text-sm text-slate-400 leading-relaxed mb-3">
                We run on enterprise-grade cloud providers with all data stored and processed in the <span class="text-slate-300 font-medium">United States</span>.
              </p>
              <div class="grid grid-cols-3 gap-3">
                <div class="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p class="text-xs font-bold text-slate-300">DigitalOcean</p>
                  <p class="text-[11px] text-slate-500 mt-0.5">App &amp; Database</p>
                </div>
                <div class="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p class="text-xs font-bold text-slate-300">Google Cloud</p>
                  <p class="text-[11px] text-slate-500 mt-0.5">Data &amp; AI</p>
                </div>
                <div class="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p class="text-xs font-bold text-slate-300">AWS</p>
                  <p class="text-[11px] text-slate-500 mt-0.5">Media Storage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-10 text-center space-y-4">
        <p class="text-sm text-slate-500">
          Questions about our security practices?
          <a href="mailto:security@maxedmarketing.com" class="text-indigo-400 hover:text-indigo-300 transition-colors">
            security@maxedmarketing.com
          </a>
        </p>
        <router-link to="/login" class="text-sm text-slate-500 hover:text-slate-400 transition-colors inline-flex items-center gap-1">
          <ArrowLeft :size="14" />
          Back to sign in
        </router-link>
      </div>
    </div>
  </div>
</template>
