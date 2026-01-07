import { AwardDefinition } from '../types';

// ─── UNIVERSAL: MOVEMENT BASED ───────────────────────────────────────────────

export const NewEntryAward: AwardDefinition = {
  id: 'new-entry',
  label: 'New Entry',
  description: 'A fresh arrival on the chart this period. Great to see new items scaling up!',
  icon: '🆕',
  evaluate: ({ currentItem, previousItem }) => {
    return !previousItem;
  }
};

export const RocketShipAward: AwardDefinition = {
  id: 'rocket-ship',
  label: 'Rocket Ship',
  description: 'Fastest riser on the charts, jumping at least 3 positions since last period.',
  icon: '🚀',
  evaluate: ({ currentItem, previousItem }) => {
    if (!previousItem) return false;
    const delta = previousItem.position - currentItem.position;
    return delta >= 3;
  }
};

export const SteadyClimberAward: AwardDefinition = {
  id: 'steady-climber',
  label: 'Steady Climber',
  description: 'Consistent upward momentum, gaining 1-2 positions since last period.',
  icon: '🧗',
  evaluate: ({ currentItem, previousItem }) => {
    if (!previousItem) return false;
    const delta = previousItem.position - currentItem.position;
    return delta > 0 && delta < 3;
  }
};

// ─── UNIVERSAL: POSITION BASED ───────────────────────────────────────────────

export const FirstPlaceAward: AwardDefinition = {
  id: 'gold-medal',
  label: 'Number One',
  description: 'The undisputed champion of this metric. Sitting at the very top of the podium.',
  icon: '🥇',
  evaluate: ({ currentItem }) => currentItem.position === 1
};

export const PodiumAward: AwardDefinition = {
  id: 'podium',
  label: 'Podium Finish',
  description: 'A prestigious Top 3 finish. One of the strongest performers in the account.',
  icon: '🏆',
  evaluate: ({ currentItem }) => currentItem.position <= 3 && currentItem.position > 1
};

export const PeakPerformerAward: AwardDefinition = {
  id: 'peak-performer',
  label: 'All-Time High',
  description: 'This item has reached or maintained its best rank ever recorded.',
  icon: '🏔️',
  evaluate: ({ currentItem }) => {
    return currentItem.position === 1 || (currentItem.peak_position === currentItem.position);
  }
};

// ─── UNIVERSAL: CONSISTENCY ──────────────────────────────────────────────────

export const ThreeMonthStreakAward: AwardDefinition = {
  id: 'streak-3mo',
  label: '3-Month Streak',
  description: 'Incredible consistency! This item has been on the charts for 3 consecutive months.',
  icon: '🔥',
  evaluate: ({ history }) => {
    if (history.length < 2) return false;
    return true;
  }
};

export const DominatorAward: AwardDefinition = {
  id: 'dominator',
  label: 'Chart Dominator',
  description: 'Long-term supremacy. Held the #1 spot for at least 3 consecutive months.',
  icon: '👑',
  evaluate: ({ currentItem, history }) => {
    if (currentItem.position !== 1) return false;
    if (history.length < 2) return false;
    return history.slice(0, 2).every(h => h.position === 1);
  }
};

// ─── METRIC SPECIFIC (CONTEXTUAL) ────────────────────────────────────────────

export const EfficiencyKingAward: AwardDefinition = {
  id: 'efficiency-king',
  label: 'Efficiency King',
  description: 'Exceptional ROI/CPA performance. The most capital-efficient item in the group.',
  icon: '💎',
  evaluate: ({ currentItem }) => {
    return currentItem.position === 1; 
  }
};

export const VolumeTitanAward: AwardDefinition = {
  id: 'volume-titan',
  label: 'Volume Titan',
  description: 'The heaviest hitter by volume (Conversions, Clicks, or Impressions).',
  icon: '📢',
  evaluate: ({ currentItem }) => {
    return currentItem.position === 1;
  }
};

// ─── ENTITY SPECIFIC (MIGRATED) ─────────────────────────────────────────────

export const HighRollerAward: AwardDefinition = {
  id: "high-roller",
  label: "High Roller",
  description: "Exceptionally high ROAS (> 10x). This item is printing money!",
  icon: "🤑",
  evaluate: ({ currentItem }) => {
    return currentItem.metric_value > 10;
  },
};

export const HighROASAward: AwardDefinition = {
  id: "high-roas",
  label: "High ROAS (>8x)",
  description: "Outstanding Return on Ad Spend. A highly profitable performer.",
  icon: "💰",
  evaluate: ({ currentItem }) => currentItem.metric_value > 8,
};

// ─── COLLECTION ──────────────────────────────────────────────────────────────

export const AllAwards = [
    NewEntryAward,
    RocketShipAward,
    SteadyClimberAward,
    FirstPlaceAward,
    PodiumAward,
    PeakPerformerAward,
    ThreeMonthStreakAward,
    DominatorAward,
    EfficiencyKingAward,
    VolumeTitanAward,
    HighRollerAward,
    HighROASAward
];

export const StandardAwards = {
  Movement: [NewEntryAward, RocketShipAward, SteadyClimberAward],
  Position: [FirstPlaceAward, PodiumAward, PeakPerformerAward],
  Consistency: [ThreeMonthStreakAward, DominatorAward]
};
