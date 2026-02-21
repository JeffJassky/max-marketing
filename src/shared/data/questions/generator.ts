import {
  QuestionDataContext,
  GeneratedQuestion,
  QuestionCategory,
} from "./types";

// ─── Formatting Helpers ───────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  return `${Math.abs(value).toFixed(0)}%`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

function formatMetric(name: string, value: number): string {
  const lower = name.toLowerCase();
  if (lower.includes("roas")) return `${value.toFixed(2)}x`;
  if (
    lower.includes("cpa") ||
    lower.includes("spend") ||
    lower.includes("revenue") ||
    lower.includes("value")
  ) {
    return formatCurrency(value);
  }
  if (lower.includes("rate") || lower.includes("ctr"))
    return `${(value * 100).toFixed(1)}%`;
  return value.toLocaleString();
}

// ─── Question Generators ──────────────────────────────────────────────────────

/**
 * Generate questions from superlatives data.
 * Looks for top performers, momentum changes, consistent winners, platform comparisons.
 */
function generateSuperlativeQuestions(
  context: QuestionDataContext,
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const superlatives = context.superlatives;

  if (!superlatives || superlatives.length === 0) {
    return questions;
  }

  // ─── Group data by various dimensions ───────────────────────────────────────

  // Campaign winners
  const campaignWinners = superlatives.filter(
    (s) =>
      s.entity_type?.includes("campaign") && s.position === 1 && s.item_name,
  );
  const uniqueCampaigns = [
    ...new Set(campaignWinners.map((s) => s.item_name)),
  ].filter(Boolean);

  // Items with momentum (RocketShip awards or positive rank delta)
  const momentumItems = superlatives.filter(
    (s) =>
      s.item_name &&
      (s.awards?.some((a: any) => a.id?.includes("rocket")) ||
        (s.rank_delta && s.rank_delta > 2)),
  );

  // Consistent performers (3+ months on chart)
  const consistentPerformers = superlatives.filter(
    (s) => s.item_name && s.periods_on_chart && s.periods_on_chart >= 3,
  );

  // New entries (no previous position)
  const newEntries = superlatives.filter(
    (s) => s.item_name && s.position <= 3 && !s.previous_position,
  );

  // Declining performers (negative rank delta)
  const decliningItems = superlatives.filter(
    (s) => s.item_name && s.rank_delta && s.rank_delta < -2,
  );

  // Platform-level winners
  const platformWinners = superlatives.filter(
    (s) => s.dimension_name === "platform" && s.position === 1 && s.item_name,
  );

  // Channel group winners
  const channelWinners = superlatives.filter(
    (s) =>
      s.dimension_name === "channel_group" && s.position === 1 && s.item_name,
  );

  // Creative winners
  const creativeWinners = superlatives.filter(
    (s) =>
      s.entity_type?.includes("creative") && s.position === 1 && s.item_name,
  );

  // ROAS leaders
  const roasLeaders = superlatives.filter(
    (s) =>
      s.metric_name?.toLowerCase().includes("roas") &&
      s.position === 1 &&
      s.item_name,
  );

  // CPA leaders (lower is better for CPA)
  const cpaPerformers = superlatives.filter(
    (s) =>
      s.metric_name?.toLowerCase().includes("cpa") &&
      s.position <= 3 &&
      s.item_name,
  );

  // Keywords performing well
  const keywordWinners = superlatives.filter(
    (s) => s.entity_type?.includes("keyword") && s.position <= 3 && s.item_name,
  );

  // ─── Generate questions ─────────────────────────────────────────────────────

  // Top campaigns question
  if (uniqueCampaigns.length > 0 && uniqueCampaigns.length <= 5) {
    const topCampaign = campaignWinners[0];
    questions.push({
      id: "top_campaigns",
      question: "What should we repeat based on recent wins?",
      insight: `${uniqueCampaigns.length} campaign${uniqueCampaigns.length > 1 ? "s" : ""} outperformed others this month. "${uniqueCampaigns[0]}" leads with ${formatMetric(topCampaign.metric_name, topCampaign.metric_value)}.`,
      category: "momentum",
      matchedData: { campaigns: uniqueCampaigns, topPerformer: topCampaign },
    });
  }

  // Momentum question
  if (momentumItems.length > 0) {
    const item = momentumItems[0];
    const change = item.rank_delta
      ? `jumped ${item.rank_delta} positions`
      : "is gaining momentum";
    questions.push({
      id: "momentum_item",
      question: "What's driving this growth?",
      insight: `"${item.item_name}" ${change}. Worth understanding what's working.`,
      category: "momentum",
      matchedData: { item },
    });
  }

  // Consistent performer question
  if (consistentPerformers.length > 0) {
    const item = consistentPerformers[0];
    questions.push({
      id: "consistent_performer",
      question: "What can we learn from consistent winners?",
      insight: `"${item.item_name}" has been a top performer for ${item.periods_on_chart} months straight.`,
      category: "momentum",
      matchedData: { item },
    });
  }

  // New entry question
  if (newEntries.length > 0) {
    const item = newEntries[0];
    questions.push({
      id: "new_entry",
      question: "Should we double down on this new winner?",
      insight: `"${item.item_name}" is new to the charts at #${item.position} for ${item.metric_name}.`,
      category: "opportunity",
      matchedData: { item },
    });
  }

  // Declining performers - guardrail
  if (decliningItems.length > 0) {
    const item = decliningItems[0];
    questions.push({
      id: "declining_performer",
      question: "Why is this performer losing ground?",
      insight: `"${item.item_name}" dropped ${Math.abs(item.rank_delta)} positions. Worth investigating before it falls further.`,
      category: "guardrail",
      matchedData: { item },
    });
  }

  // Platform comparison
  if (platformWinners.length >= 2) {
    const topPlatform = platformWinners[0];
    questions.push({
      id: "platform_winner",
      question: "Which platform is delivering the best results?",
      insight: `${topPlatform.item_name} leads with ${formatMetric(topPlatform.metric_name, topPlatform.metric_value)} for ${topPlatform.metric_name}.`,
      category: "momentum",
      matchedData: { platforms: platformWinners },
    });
  }

  // Channel group performance
  if (channelWinners.length > 0) {
    const topChannel = channelWinners[0];
    questions.push({
      id: "channel_winner",
      question: "Which channel type is most efficient right now?",
      insight: `${topChannel.item_name} campaigns are leading for ${topChannel.metric_name} with ${formatMetric(topChannel.metric_name, topChannel.metric_value)}.`,
      category: "momentum",
      matchedData: { channel: topChannel },
    });
  }

  // Creative performance
  if (creativeWinners.length > 0) {
    const topCreative = creativeWinners[0];
    questions.push({
      id: "top_creative",
      question: "What creative elements are working best?",
      insight: `"${topCreative.item_name}" is the top-performing creative with ${formatMetric(topCreative.metric_name, topCreative.metric_value)}.`,
      category: "momentum",
      matchedData: { creative: topCreative },
    });
  }

  // ROAS leaders
  if (roasLeaders.length > 0) {
    const leader = roasLeaders[0];
    questions.push({
      id: "roas_leader",
      question: "Where are we getting the best return on ad spend?",
      insight: `"${leader.item_name}" has the best ROAS at ${leader.metric_value.toFixed(2)}x. Can we scale this?`,
      category: "opportunity",
      matchedData: { leader },
    });
  }

  // Efficiency analysis
  if (cpaPerformers.length > 0) {
    const best = cpaPerformers[0];
    questions.push({
      id: "cpa_efficiency",
      question: "What's driving our most efficient conversions?",
      insight: `"${best.item_name}" delivers conversions at ${formatCurrency(best.metric_value)} CPA. Understand what makes it work.`,
      category: "momentum",
      matchedData: { performer: best },
    });
  }

  // Keyword opportunities
  if (keywordWinners.length > 0) {
    const topKeyword = keywordWinners[0];
    questions.push({
      id: "keyword_winner",
      question: "Which keywords should we prioritize?",
      insight: `"${topKeyword.item_name}" ranks #${topKeyword.position} for ${topKeyword.metric_name}. Consider building around this theme.`,
      category: "opportunity",
      matchedData: { keyword: topKeyword },
    });
  }

  // Multiple momentum items - scaling opportunity
  if (momentumItems.length >= 3) {
    questions.push({
      id: "scaling_candidates",
      question: "What's small but growing that we could scale?",
      insight: `${momentumItems.length} items are showing strong momentum. Some may be ready for more budget.`,
      category: "opportunity",
      matchedData: { items: momentumItems.slice(0, 5) },
    });
  }

  return questions;
}

/**
 * Generate questions from anomalies/monitor data.
 * Looks for spend issues, performance drops, creative fatigue, efficiency problems.
 */
function generateAnomalyQuestions(
  context: QuestionDataContext,
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const anomalies = context.anomalies;

  if (!anomalies || anomalies.length === 0) {
    return questions;
  }

  // ─── Group anomalies by type ────────────────────────────────────────────────

  const spendAnomalies = anomalies.filter(
    (a) => a.monitor_id?.includes("spend") || a.measure_id?.includes("spend"),
  );
  const conversionAnomalies = anomalies.filter(
    (a) =>
      a.monitor_id?.includes("conversion") ||
      a.measure_id?.includes("conversion"),
  );
  const creativeFatigue = anomalies.filter(
    (a) =>
      a.monitor_id?.includes("fatigue") || a.monitor_id?.includes("creative"),
  );
  const wastedSpend = anomalies.filter((a) => a.monitor_id?.includes("wasted"));
  const highCPA = anomalies.filter(
    (a) => a.monitor_id?.includes("cpa") || a.monitor_id?.includes("high-cpa"),
  );
  const lowROAS = anomalies.filter(
    (a) => a.monitor_id?.includes("roas") || a.monitor_id?.includes("low-roas"),
  );
  const positionDrops = anomalies.filter(
    (a) => a.monitor_id?.includes("position") || a.monitor_id?.includes("gsc"),
  );
  const clickDrops = anomalies.filter(
    (a) =>
      a.monitor_id?.includes("click-drop") || a.monitor_id?.includes("ctr"),
  );
  const impressionDrops = anomalies.filter((a) =>
    a.monitor_id?.includes("impression"),
  );
  const audienceSaturation = anomalies.filter(
    (a) =>
      a.monitor_id?.includes("audience") ||
      a.monitor_id?.includes("saturation"),
  );
  const broadMatchDrift = anomalies.filter(
    (a) => a.monitor_id?.includes("broad") || a.monitor_id?.includes("match"),
  );

  // ─── Generate questions ─────────────────────────────────────────────────────

  // Spend anomaly
  if (spendAnomalies.length > 0) {
    const anomaly = spendAnomalies[0];
    const impact = anomaly.anomaly_impact
      ? formatCurrency(anomaly.anomaly_impact)
      : null;
    questions.push({
      id: "spend_anomaly",
      question: "Is there unusual spending we should look at?",
      insight:
        anomaly.anomaly_message ||
        `Spend anomaly detected${impact ? ` with ${impact} impact` : ""}.`,
      category: "guardrail",
      matchedData: { anomaly },
    });
  }

  // Conversion drop
  if (conversionAnomalies.length > 0) {
    const anomaly = conversionAnomalies[0];
    questions.push({
      id: "conversion_drop",
      question: "What's causing conversions to drop?",
      insight:
        anomaly.anomaly_message ||
        "Conversion performance is below expected levels.",
      category: "guardrail",
      matchedData: { anomaly },
    });
  }

  // Creative fatigue
  if (creativeFatigue.length > 0) {
    questions.push({
      id: "creative_fatigue",
      question: "Where could performance improve with refreshed creative?",
      insight: `${creativeFatigue.length} ad${creativeFatigue.length > 1 ? "s are" : " is"} showing creative fatigue. Fresh creative could recover performance.`,
      category: "opportunity",
      matchedData: { anomalies: creativeFatigue },
    });
  }

  // Wasted spend
  if (wastedSpend.length > 0) {
    const totalWasted = wastedSpend.reduce(
      (sum, a) => sum + (a.anomaly_impact || 0),
      0,
    );
    questions.push({
      id: "wasted_spend",
      question: "Are we wasting spend on underperformers?",
      insight: `${wastedSpend.length} keyword${wastedSpend.length > 1 ? "s" : ""} spent ${formatCurrency(totalWasted)} with poor returns. Consider pausing.`,
      category: "guardrail",
      matchedData: { anomalies: wastedSpend, totalWasted },
    });
  }

  // High CPA alerts
  if (highCPA.length > 0) {
    const worst = highCPA[0];
    questions.push({
      id: "high_cpa_alert",
      question: "Which campaigns have CPA spiraling out of control?",
      insight: `${highCPA.length} item${highCPA.length > 1 ? "s have" : " has"} CPA above target thresholds. May need bid adjustments or pausing.`,
      category: "guardrail",
      matchedData: { anomalies: highCPA },
    });
  }

  // Low ROAS alerts
  if (lowROAS.length > 0) {
    questions.push({
      id: "low_roas_alert",
      question: "Where is ad spend not generating enough return?",
      insight: `${lowROAS.length} campaign${lowROAS.length > 1 ? "s are" : " is"} underperforming on ROAS. Review targeting and creative.`,
      category: "guardrail",
      matchedData: { anomalies: lowROAS },
    });
  }

  // Search position drops (GSC)
  if (positionDrops.length > 0) {
    const drop = positionDrops[0];
    questions.push({
      id: "position_drop",
      question: "Are we losing organic visibility on key terms?",
      insight:
        drop.anomaly_message ||
        `Search rankings dropped for ${positionDrops.length} query${positionDrops.length > 1 ? "s" : ""}. Worth investigating.`,
      category: "guardrail",
      matchedData: { anomalies: positionDrops },
    });
  }

  // Click drops
  if (clickDrops.length > 0) {
    questions.push({
      id: "click_drop",
      question: "Why are clicks declining?",
      insight: `Click performance dropped on ${clickDrops.length} item${clickDrops.length > 1 ? "s" : ""}. Check ad copy and targeting.`,
      category: "guardrail",
      matchedData: { anomalies: clickDrops },
    });
  }

  // Impression drops
  if (impressionDrops.length > 0) {
    questions.push({
      id: "impression_drop",
      question: "Why is reach declining?",
      insight: `Impressions down on ${impressionDrops.length} item${impressionDrops.length > 1 ? "s" : ""}. May indicate budget, bidding, or competition changes.`,
      category: "guardrail",
      matchedData: { anomalies: impressionDrops },
    });
  }

  // Audience saturation
  if (audienceSaturation.length > 0) {
    questions.push({
      id: "audience_saturation",
      question: "Are our audiences getting saturated?",
      insight: `${audienceSaturation.length} audience${audienceSaturation.length > 1 ? "s show" : " shows"} signs of saturation. Consider expanding or refreshing targeting.`,
      category: "opportunity",
      matchedData: { anomalies: audienceSaturation },
    });
  }

  // Broad match drift
  if (broadMatchDrift.length > 0) {
    questions.push({
      id: "broad_match_drift",
      question: "Are broad match keywords matching irrelevant queries?",
      insight: `${broadMatchDrift.length} keyword${broadMatchDrift.length > 1 ? "s are" : " is"} matching unexpected search terms. Review and add negatives.`,
      category: "guardrail",
      matchedData: { anomalies: broadMatchDrift },
    });
  }

  // Multiple severe issues - triage question
  const severeCount = anomalies.filter(
    (a) => a.severity === "high" || a.severity === "critical",
  ).length;
  if (severeCount >= 3) {
    questions.push({
      id: "triage_priorities",
      question: "What should we fix first?",
      insight: `${severeCount} high-priority issues detected. Let's prioritize by impact.`,
      category: "guardrail",
      matchedData: {
        severeCount,
        anomalies: anomalies.filter(
          (a) => a.severity === "high" || a.severity === "critical",
        ),
      },
    });
  }

  return questions;
}

/**
 * Generate questions from executive metrics (MER, spend, revenue).
 */
function generateExecutiveQuestions(
  context: QuestionDataContext,
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const exec = context.executive;

  if (!exec) {
    return questions;
  }

  // ─── MER-based questions ────────────────────────────────────────────────────

  if (exec.mer !== undefined && exec.merChange !== undefined) {
    const direction = exec.merChange >= 0 ? "up" : "down";
    const verb = exec.merChange >= 0 ? "improved" : "declined";

    // Significant MER change
    if (Math.abs(exec.merChange) >= 5) {
      questions.push({
        id: "mer_change",
        question:
          exec.merChange >= 0
            ? "What drove the efficiency improvement?"
            : "Why is efficiency declining?",
        insight: `MER is ${exec.mer.toFixed(2)}x, ${direction} ${formatPercent(exec.merChange)} from last period.`,
        category: exec.merChange >= 0 ? "momentum" : "guardrail",
        matchedData: { mer: exec.mer, merChange: exec.merChange },
      });
    }

    // Executive summary question (always relevant when we have MER)
    questions.push({
      id: "executive_summary",
      question: "What would I tell my boss about performance?",
      insight: `MER ${verb} to ${exec.mer.toFixed(2)}x. A clear summary of wins and challenges.`,
      category: "narrative",
      matchedData: { mer: exec.mer, merChange: exec.merChange },
    });

    // Month story for executives
    questions.push({
      id: "month_story",
      question: "What's the story of this month so far?",
      insight: `Create a narrative around ${exec.mer.toFixed(2)}x MER and key drivers.`,
      category: "narrative",
      matchedData: { mer: exec.mer },
    });
  }

  // ─── Revenue-based questions ────────────────────────────────────────────────

  if (exec.revenue !== undefined && exec.revenueChange !== undefined) {
    const direction = exec.revenueChange >= 0 ? "up" : "down";

    // Significant revenue change
    if (Math.abs(exec.revenueChange) >= 10) {
      questions.push({
        id: "revenue_change",
        question:
          exec.revenueChange >= 0
            ? "What's driving the revenue growth?"
            : "What's causing revenue to decline?",
        insight: `Revenue is ${direction} ${formatPercent(exec.revenueChange)} from last period (${formatCurrency(exec.revenue)}).`,
        category: exec.revenueChange >= 0 ? "momentum" : "guardrail",
        matchedData: {
          revenue: exec.revenue,
          revenueChange: exec.revenueChange,
        },
      });
    }

    // Revenue goal tracking
    if (exec.revenue !== undefined) {
      questions.push({
        id: "goal_tracking",
        question: "How are we tracking against our goals?",
        insight: `Current revenue: ${formatCurrency(exec.revenue)}. See how we compare to targets.`,
        category: "narrative",
        matchedData: { revenue: exec.revenue },
      });
    }
  }

  // ─── Spend-based questions ──────────────────────────────────────────────────

  if (exec.spend !== undefined && exec.spendChange !== undefined) {
    // Significant spend change
    if (Math.abs(exec.spendChange) >= 15) {
      const over = exec.spendChange > 0;
      questions.push({
        id: "spend_pacing",
        question: over
          ? "Is spend pacing ahead of plan?"
          : "Are we underspending?",
        insight: `Spend is tracking ${formatPercent(exec.spendChange)} ${over ? "over" : "under"} pace (${formatCurrency(exec.spend)}).`,
        category: "guardrail",
        matchedData: { spend: exec.spend, spendChange: exec.spendChange },
      });
    }

    // Budget reallocation opportunity
    if (exec.spend !== undefined && exec.revenue !== undefined) {
      questions.push({
        id: "budget_reallocation",
        question: "Should we reallocate budget between channels?",
        insight: `Currently spending ${formatCurrency(exec.spend)} generating ${formatCurrency(exec.revenue)}. See channel breakdown.`,
        category: "opportunity",
        matchedData: { spend: exec.spend, revenue: exec.revenue },
      });
    }
  }

  // ─── Combined analysis questions ────────────────────────────────────────────

  // Performance vs spend efficiency
  if (
    exec.spend !== undefined &&
    exec.revenue !== undefined &&
    exec.spendChange !== undefined &&
    exec.revenueChange !== undefined
  ) {
    // Revenue growing faster than spend = good
    if (exec.revenueChange > exec.spendChange + 5) {
      questions.push({
        id: "efficiency_gains",
        question: "What's making us more efficient?",
        insight: `Revenue up ${formatPercent(exec.revenueChange)} while spend only up ${formatPercent(exec.spendChange)}. Efficiency improving.`,
        category: "momentum",
        matchedData: {
          spend: exec.spend,
          revenue: exec.revenue,
          spendChange: exec.spendChange,
          revenueChange: exec.revenueChange,
        },
      });
    }
    // Spend growing faster than revenue = concern
    else if (exec.spendChange > exec.revenueChange + 5) {
      questions.push({
        id: "efficiency_decline",
        question: "Why is spend growing faster than revenue?",
        insight: `Spend up ${formatPercent(exec.spendChange)} but revenue only up ${formatPercent(exec.revenueChange)}. Efficiency declining.`,
        category: "guardrail",
        matchedData: {
          spend: exec.spend,
          revenue: exec.revenue,
          spendChange: exec.spendChange,
          revenueChange: exec.revenueChange,
        },
      });
    }
  }

  // Week-in-review narrative
  if (exec.mer !== undefined || exec.revenue !== undefined) {
    questions.push({
      id: "week_review",
      question: "What changed this week that I should know about?",
      insight: `Key changes and trends from the past 7 days.`,
      category: "narrative",
      matchedData: { ...exec },
    });
  }

  // Forward-looking question
  questions.push({
    id: "next_week_focus",
    question: "What should we focus on next week?",
    insight: "Based on current trends, here's what deserves attention.",
    category: "narrative",
    matchedData: { ...exec },
  });

  return questions;
}

/**
 * Generate fallback questions when we don't have specific data.
 */
function generateFallbackQuestions(): GeneratedQuestion[] {
  return [
    {
      id: "fallback_performance",
      question: "How is overall performance trending?",
      insight: "Get a summary of recent wins, challenges, and opportunities.",
      category: "narrative",
      matchedData: {},
    },
    {
      id: "fallback_opportunities",
      question: "Where are the biggest opportunities right now?",
      insight: "Identify areas where small changes could drive big results.",
      category: "opportunity",
      matchedData: {},
    },
    {
      id: "fallback_risks",
      question: "Is there anything we should keep an eye on?",
      insight: "Review potential risks and areas needing attention.",
      category: "guardrail",
      matchedData: {},
    },
    {
      id: "fallback_wins",
      question: "What's been working well recently?",
      insight: "Celebrate and understand recent successes.",
      category: "momentum",
      matchedData: {},
    },
  ];
}

// ─── Main Generator ───────────────────────────────────────────────────────────

/**
 * Generate all relevant questions from the data context.
 * Returns questions sorted by priority/relevance.
 */
export function generateQuestions(
  context: QuestionDataContext,
): GeneratedQuestion[] {
  const allQuestions: GeneratedQuestion[] = [];

  // Generate from each data source
  allQuestions.push(...generateSuperlativeQuestions(context));
  allQuestions.push(...generateAnomalyQuestions(context));
  allQuestions.push(...generateExecutiveQuestions(context));

  // If we have very few questions, add fallbacks
  if (allQuestions.length < 4) {
    allQuestions.push(...generateFallbackQuestions());
  }

  // Dedupe by id
  const seen = new Set<string>();
  const unique = allQuestions.filter((q) => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });

  // Sort: guardrails first (urgent), then momentum, then opportunity, then narrative
  const categoryOrder: Record<QuestionCategory, number> = {
    guardrail: 0,
    momentum: 1,
    opportunity: 2,
    narrative: 3,
  };

  return unique.sort(
    (a, b) => categoryOrder[a.category] - categoryOrder[b.category],
  );
}

/**
 * Generate questions for a specific source type (superlatives, monitors, etc.)
 */
export function generateQuestionsForSource(
  sourceType: "superlatives" | "monitors",
  context: QuestionDataContext,
): GeneratedQuestion[] {
  switch (sourceType) {
    case "superlatives":
      return generateSuperlativeQuestions(context);
    case "monitors":
      return generateAnomalyQuestions(context);
    default:
      return [];
  }
}

/**
 * Format questions for API response.
 */
export function formatQuestionsForResponse(
  questions: GeneratedQuestion[],
): Array<{
  id: string;
  question: string;
  insight: string;
}> {
  return questions.map((q) => ({
    id: q.id,
    question: q.question,
    insight: q.insight,
  }));
}
