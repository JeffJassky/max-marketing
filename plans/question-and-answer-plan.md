**Executive/ Developer Summary**

Giving businesses access to their own data and creating a structure to allow them to “chat with it” has long been a goal of our SaaS offering, but the tension has been finding a way to do it that is beyond what we can assume everyone else will just offer as ‘table stakes’.  What I would like to explore are ideas for making **chat genuinely useful, trusted, and habit-forming** for real marketers.

The problem we’re solving:

- Most “chat with your data” tools fail because:
  - Users don’t know _what to ask_
  - The answers aren’t defensible
  - The experience feels either stressful (all bad news) or useless (all fluff)

Our belief is that **chat needs structure, judgment, and guidance** to be valuable, especially for small and mid-sized marketing teams who:

- Answer to owners who aren’t marketers
- Need to look competent, calm, and in control
- Need insights they can actually act on or repeat in meetings

So in addition to our blank chat bot "Max", we’re designing a **thinking surface** that:

- Guides users toward the _right_ questions
- Balances wins, risks, and opportunities
- Uses chat as a drill-down tool, not the homepage

The system centers around 8 dynamic “Momentum Cards” that sit below the chat.

If this is working correctly:

- A marketer opens Maxed and immediately sees:
  - What’s working
  - What’s worth improving
  - What needs protection
  - What story they’d tell their boss
- They don’t have to invent questions from scratch
- They feel encouraged, not judged
- They can click into any card and get:
  - A clear conclusion
  - Evidence
  - Next steps
  - Follow-up questions

In short:

Chat becomes smarter because we control the entry points.

**High-level system overview**

The system has three visible layers:

1. **Ask Bar (top of page)**
   - Users can always ask anything manually
   - Chat is always available
2. **8 Momentum Cards (primary UI surface)**

- System-generated
- Dynamic
- Designed to guide attention and thinking

1. **Conversation History / Drill-Down Area (below cards)**

- Shows past questions
- Shows answers generated from card clicks or manual asks

The cards are the key innovation.

**The 8-Card Momentum System (core concept)**

**Hard rules (these are intentional constraints)**

- Exactly **8 cards** are always shown
- Cards are **dynamically selected** each refresh
- Cards must be distributed as:
  - 2 Momentum (wins / learning)
  - 2 Opportunity (improvement potential)
  - 2 Guardrail / Risk (protection)
  - 2 Executive Narrative (owner-level framing)

Within **each pair**:

- One card must relate to **Now / Soon**
- One card must relate to **Next / Explain**

This is not labeled in the UI — it’s enforced by logic.

The purpose of this constraint is to:

- Force variety
- Avoid negativity spirals
- Avoid over-optimizing for only short-term signals

**Language rules (important)**

Only **2 cards** use owner / executive language:

- The Executive Narrative cards

Everything else uses **marketer/operator language**.

This is intentional:

- Marketers think differently than owners
- We want screen-sharing with leadership to feel _intentional_, not awkward

**Confidence thresholds**

We are **not** building a speculative AI.

Rules:

- Cards should only appear when signal confidence is **mid to high**
- Exploratory prompts are allowed **only if**:
  - They replace a lower-impact card
  - They are clearly framed as opportunities, not conclusions

If confidence is too low:

- Do not invent insight
- Either reframe (learning, explanation)
- Or omit the card type if absolutely necessary

**Card behavior (what happens when clicked)**

Clicking a card should:

1. Restate the question clearly
2. Provide a **clear conclusion first**
3. Show **2–4 supporting drivers** (not raw charts)
4. End with **1–3 suggested next actions**
5. Offer **follow-up questions** to continue the conversation

Chat is used here as:

- A structured explainer
- A continuation mechanism
- Not a free-form brainstorm

**Card refresh cadence (practical guidance)**

Conceptually:

- Guardrail signals want to refresh more frequently
- Momentum and opportunity are more stable

For MVP:

- Weekly refresh is acceptable if it simplifies implementation
- Architecture should _allow_ adaptive refresh later

The design intent should be preserved even if the first implementation is simpler.

**Why this matters technically**

From a systems perspective, this work does a few critical things:

- Reduces hallucination risk by constraining entry points
- Makes chat answers more consistent and defensible
- Creates repeat usage loops (users come back to see “what changed”)
- Sets the foundation for:
  - Attribution reconciliation
  - Executive summaries
  - CEO memo generation later

This is not UI polish — this is **product architecture**.

**What comes next (after this doc)**

Once this is implemented:

- We’ll formalize the card selection logic into stricter rules
- We’ll layer in deeper “truth checks” (platform vs blended reality)
- We’ll eventually build executive outputs on top of this system

But this card system is the **front door** for all of that.

**Final note**

The goal here is not to tell marketers what’s wrong.

The goal is to help them:

- Think better
- Explain better
- Learn from wins
- Protect performance
- Look good doing it

If this system feels calm, useful, and slightly smarter than expected — we’ve done it right.
