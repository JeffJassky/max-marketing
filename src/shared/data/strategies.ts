import { MonitorStrategyThresholdSchema, MonitorStrategyRelativeDeltaSchema, MonitorStrategyZScoreSchema } from './types';
import { z } from 'zod';

export interface TimeSeriesPoint {
    timestamp: string; // ISO Date
    value: number;
    metrics?: Record<string, number>;
}

export interface Anomaly {
    score: number; // 0-1 (severity)
    impact: number; // Magnitude of the issue
    message: string;
    context: Record<string, any>; // e.g., the specific date or dimensions
}

export interface DetectionStrategy {
    detect(series: TimeSeriesPoint[], config: any): Anomaly[];
}

// ─── THRESHOLD STRATEGY ──────────────────────────────────────────────────────

type ThresholdConfig = z.infer<typeof MonitorStrategyThresholdSchema>;

export class ThresholdStrategy implements DetectionStrategy {
    detect(series: TimeSeriesPoint[], config: ThresholdConfig): Anomaly[] {
        const anomalies: Anomaly[] = [];
        const { min, max } = config;

        for (const point of series) {
            let isAnomaly = false;
            let message = '';

            if (min !== undefined && point.value < min) {
                isAnomaly = true;
                message = `Value ${point.value} is below minimum threshold ${min}`;
            }
            if (max !== undefined && point.value > max) {
                isAnomaly = true;
                message = `Value ${point.value} is above maximum threshold ${max}`;
            }

            if (isAnomaly) {
                anomalies.push({
                    score: 1.0, 
                    impact: Math.abs(point.value - (min ?? max ?? 0)), 
                    message,
                    context: { 
                        date: point.timestamp, 
                        value: point.value,
                        ...point.metrics 
                    }
                });
            }
        }

        return anomalies;
    }
}

// ─── RELATIVE DELTA STRATEGY ─────────────────────────────────────────────────

type RelativeDeltaConfig = z.infer<typeof MonitorStrategyRelativeDeltaSchema>;

export class RelativeDeltaStrategy implements DetectionStrategy {
    detect(series: TimeSeriesPoint[], config: RelativeDeltaConfig): Anomaly[] {
        const anomalies: Anomaly[] = [];
        if (series.length < 2) return [];

        const sorted = [...series].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const previous = sorted[i-1];
            
            if (previous.value === 0) continue; 

            const delta = (current.value - previous.value) / previous.value;
            const deltaPct = delta * 100;
            const absDeltaPct = Math.abs(deltaPct);

            if (absDeltaPct > config.maxDeltaPct) {
                anomalies.push({
                    score: Math.min(absDeltaPct / config.maxDeltaPct, 1.0),
                    impact: Math.abs(current.value - previous.value),
                    message: `Change of ${deltaPct.toFixed(2)}% exceeds limit of ${config.maxDeltaPct}%`,
                    context: { 
                        date: current.timestamp, 
                        value: current.value, 
                        previousDate: previous.timestamp, 
                        previousValue: previous.value 
                    }
                });
            }
        }

        return anomalies;
    }
}

// ─── Z-SCORE STRATEGY ────────────────────────────────────────────────────────

type ZScoreConfig = z.infer<typeof MonitorStrategyZScoreSchema>;

export class ZScoreStrategy implements DetectionStrategy {
    detect(series: TimeSeriesPoint[], config: ZScoreConfig): Anomaly[] {
        const anomalies: Anomaly[] = [];
        if (series.length < config.minDataPoints) return [];

        const values = series.map(p => p.value);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        if (stdDev === 0) return []; // No variance, no anomalies possible via Z-Score

        for (const point of series) {
            const zScore = (point.value - mean) / stdDev;
            const absZScore = Math.abs(zScore);

            if (absZScore > config.threshold) {
                anomalies.push({
                    score: Math.min(absZScore / (config.threshold * 2), 1.0), // Normalize roughly
                    impact: Math.abs(point.value - mean),
                    message: `Z-Score ${zScore.toFixed(2)} exceeds threshold ${config.threshold}`,
                    context: {
                        date: point.timestamp,
                        value: point.value,
                        mean: mean.toFixed(2),
                        stdDev: stdDev.toFixed(2),
                        zScore: zScore.toFixed(2)
                    }
                });
            }
        }

        return anomalies;
    }
}

// ─── FACTORY ─────────────────────────────────────────────────────────────────

export function getStrategy(type: string): DetectionStrategy {
    switch (type) {
        case 'threshold': return new ThresholdStrategy();
        case 'relative_delta': return new RelativeDeltaStrategy();
        case 'z_score': return new ZScoreStrategy();
        case 'poisson': 
        case 'seasonal_trend':
            throw new Error(`Strategy '${type}' is not yet implemented.`);
        default: throw new Error(`Unknown strategy type: ${type}`);
    }
}
