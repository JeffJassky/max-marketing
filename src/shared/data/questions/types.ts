import { z } from "zod";

// ─── Core Question Definition Schema ──────────────────────────────────────────

export const QuestionCategorySchema = z.enum([
  "momentum",
  "opportunity",
  "guardrail",
  "narrative"
]);

export const ComparisonTypeSchema = z.enum(["WoW", "MoM", "YoY", "MTD", "QTD"]);

export const RelevanceOperatorSchema = z.enum([
  ">", "<", ">=", "<=", "==", "!=", "exists", "not_exists"
]);

export const RelevanceConditionSchema = z.object({
  source: z.string(),
  field: z.string(),
  operator: RelevanceOperatorSchema,
  value: z.union([z.number(), z.string(), z.boolean()]).optional(),
});

export const QuestionDefinitionSchema = z.object({
  // Identity
  id: z.string(),

  // The question headline (what the user clicks to ask)
  question: z.string(),

  // Classification (used internally, not shown in UI)
  category: QuestionCategorySchema,

  // Selection Logic - conditions that make this question relevant
  conditions: z.array(RelevanceConditionSchema),

  // Priority for selection (higher = more important)
  priority: z.number().default(0),

  // Hints for answer generation
  answerHints: z.string().optional(),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type QuestionCategory = z.infer<typeof QuestionCategorySchema>;
export type ComparisonType = z.infer<typeof ComparisonTypeSchema>;
export type RelevanceOperator = z.infer<typeof RelevanceOperatorSchema>;
export type RelevanceCondition = z.infer<typeof RelevanceConditionSchema>;
export type QuestionDefinition = z.infer<typeof QuestionDefinitionSchema>;

// ─── Generated Question (ready for display) ──────────────────────────────────

export interface GeneratedQuestion {
  id: string;
  // The question to ask (may be templated with actual values)
  question: string;
  // The data-driven insight that explains WHY this question is relevant
  insight: string;
  // Category for internal use (styling, etc)
  category: QuestionCategory;
  // The matched data that generated this question
  matchedData: Record<string, any>;
}

// ─── Data Context for evaluation ──────────────────────────────────────────────

export interface QuestionDataContext {
  superlatives?: any[];
  anomalies?: any[];
  executive?: {
    mer?: number;
    merChange?: number;
    spend?: number;
    spendChange?: number;
    revenue?: number;
    revenueChange?: number;
  };
  userSettings?: Record<string, any>;
}
