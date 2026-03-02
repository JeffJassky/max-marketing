The other section that we want to get polished and ready for the initial MVP users is the Dashboard. The idea is that this will be a page that marketers and reluctant marketers can look at daily to see how things are going. Where Overview is a deep dive on each platform, this is designed to summarize where they are at today and add a few details behind the numbers to help them see what is moving that number.

The approach I am asking for is to create 9 information blocks for the Dashboard. Each user will be able to customize their view, but we will have two template starting points which we will set as the starting point depending on the customers business. In this first version the two types of customers that we are supporting are those that prioritize Shopify/ online sales and then those that don't track conversions, but rather are prioritizing brand reach. I will explain more on Monday, but here are the documents/ files you will need:

Preview the visual approach with a short overview in these two short videos: Shopify Merchant Dashboard run-thru | Brand-Centric Dashboard run-thru  
See the full report (from Claude) for this here: Google Doc link  
Dropbox folder: DB Link [this includes code for each of the 9 info blocks, plus the files for the 3 items above]
Brand Voice was initially developed for our visual report landing page, so notes are not exactly for this, but I wanted to give it to you this way since it will be applied in a number of places.

# Video 1

0:00 Hey Jeff, this is the, uh, first preview of this dashboard idea that I've been working on. This is Claude's little mock-up, so certainly not designed to be, uhm, pre-emptive over everything else.
0:12 Like, for instance, this top was not supposed to change, that's just what you had, uhm, although I kinda like how they might have shortened it a little bit, but, you know, general idea is good.
0:20 And then what you'll see is we've kind of, you know, basically, on the keeping a simple design here where each one of these cards is just a half a page on a desktop, uhm, half width, doesn't mean that's what we need to do or anything like that necessarily.
0:35 I just wanted to keep it simple in the design because I was focused on what we wanted to tell and how we wanted to visualize it.
0:40 So, that is pretty accurate and this is one of two dashboards. So, this is the one for people who actually have Shopify shops and focus on that.
0:48 The other one I'll show you in a moment is, uhm, is different. It's for people who want to, uhm, focus more on their brand and stuff like that, which is basically the two that will account for our current clients and allow us to get going with our MVP efforts.
1:03 So, you know, Brand Pulse is one I've been working on for a while. These other ones I think are relatively simple.
1:07 You're going to have a document with each of them and hopefully, uhm, uh, uh, I don't not necessarily hallucination-free, but, uh, relatively real.
1:16 I've been, again, pushing to use, uhm, the access to Windsor to test different stuff and make sure and at least ask the right questions.
1:25 So, hopefully, I've got you some things here that make some sense. And so, as you can see, this one has seven, uhm, different little boxes on it.
1:33 And I think the assumption I have a total of, I believe, nine at the moment and the assumption would be this would be our pre-built one for somebody who's a Shopify person.
1:40 The other one would be a pre-built one for the other person, but that in either case, we'd have a little way somebody could remove some of these and or add one of those because if we made them, why not, right?
1:49 So, that's my note on this one. I'll give you the other one momentarily.

# Video 2

0:00 Hey Jeff, here's a quick look at the dashboard for someone who is not a Shopify user and their optimization is about getting more brand views and things like that.
0:10 So, as you'll see, this one here, Brand Pulse, and a few others are actually the same as the other one.
0:14 That was part of the idea. And, but there's other things that are prioritized here that would be priorities for people like this.
0:20 So, Audience Growth, this is the one kind of showing followers on each of the platforms. And, what the total is, kind of almost like what we do on CV for the creators.
0:29 You know, Paid Reach, Total Reach, sort of thing, uhm, Search Visibility, uhm, you know, and that is kind of, each one of these, we'll explain what they are, but, you know, using Google Search, Google Search Console information to see when they showed up.
0:42 Reach Breakdown, you know, where did it come from. So, this one is Branded versus Non-Branded, which we've got to classify to make that work, uhm, where the reach comes from, is it Social, you know, Organic, Social, Paid, or Search is also visible here, which is cool, and then Site Traffic, you know,
0:58 showing whether it came, you know, so this is Organic Traffic via GA4 from these places, but you can just see visually what it looks like.
1:04 Again, I didn't mess with this top bar, intentionally at least, assuming that if we get, once we have the chat working, that we want to surface it pretty early.
1:12 And whether that would be at the top or not, still, uhm, something we can, you know, maybe it would be a, you know, start to chat, so it was not open all the time, but nevertheless, I think we've got something cool here.
1:23 Thanks!

# Brand Pulse

Overview explanation (made for our visual report version) | The Story: "How Many Times Did the World See You This Month?" This answers the fundamental growth question every business owner has but rarely gets a clean answer to. It consolidates every verified brand touchpoint - organic, paid, and search - into a single view that shows the total "weight" of the brand in the market. Rooted in the proven marketing principle that consumers need multiple exposures before taking action, this score tells the
client whether their brand is gaining or losing presence in the minds of consumers.
The Score: A 0-100 Brand Impact Score, normalized against the client's own rolling 6-month
baseline. 50 = steady state. Above 50 = the brand is growing its footprint. Below 50 = visibility
is shrinking. Displayed with month-over-month and year-over-year directional arrows. The Number: Total Brand Impressions for the month, displayed prominently alongside the score. This is the raw, tangible count of every time a consumer encountered the brand across
all channels. It grounds the score in something concrete the client can feel. The Visual: A layered "Gravity Center" donut. The center displays Total Brand Impressions as the hero number. The outer rings represent three Awareness Layers, each sized proportionally
to their contribution: • Earned Layer (Organic): Social organic reach across Meta and TikTok, branded search impressions from Google Search Console, direct website traffic from GA4. This
is the exposure the brand earned through content, reputation, and recognition. • Paid Layer: Ad impressions across Google Ads, Meta Ads, and TikTok Ads. This is the
exposure the brand purchased. Engaged Layer: Clicks, engagements, and confirmed interactions where a consumer did more than just see the brand - they acted on it. Includes search clicks, social
engagement, ad clicks, and Shopify orders. Data Sources: Meta Organic (page impressions, engaged users) + Instagram Organic (media impressions, engagement) + TikTok Organic (video views, shares) + Google Search Console (branded query impressions, non-branded impressions where position ≤ 5, clicks) + Google Ads (impressions, clicks) + Meta Ads (impressions, reach, clicks) + TikTok Ads (impressions, clicks) + GA4 (sessions, direct traffic, engaged sessions) + Shopify (order count as validation
signal). Exec Insight Example: "Your brand was seen 2.4 million times this month - up 18% from last month and 34% from this time last year. The biggest driver was a 45% surge in organic social reach, with your Instagram Reels generating 380K impressions alone. Brand searches on Google also climbed 12%, which tells us that the increased social visibility is converting into
active consumer interest." Hero Maker Note: Our design will consider our goal to find the best way to make our
stakeholder marketer look like a hero. The "Exec Insight Example" above is the start of that. Another driver of that could be comparing the various comparison options. In many cases, showing year-over-year comparisons will be the best way to showcase the biggest win. In other cases it will be the prior month, but in others we might want to look at the trajectory over the prior 3 months. We will build this to look at a few comparisons to find the most positive and
interesting story when showcasing this for the internal sharing.
