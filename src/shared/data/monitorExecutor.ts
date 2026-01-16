import { MeasureExecutor } from "./measureExecutor";
import { getStrategy, TimeSeriesPoint, Anomaly } from "./strategies";
import type { MonitorDef, Measure } from "./types";
import { Entity } from "../../jobs/base";
import { upsertPartitionedClusteredTable } from "../vendors/google/bigquery/bigquery";
import snakeCase from "lodash/snakeCase";

export interface AnomalyCandidate {
  monitorId: string;
  measureId: string;
  entityId: string;
  dimensions: Record<string, any>;
  metric: string;
  anomaly: Anomaly;
  detectedAt: string;
}

export class MonitorExecutor {
  private measureExecutor: MeasureExecutor;

  constructor(projectId: string, measureExecutor?: MeasureExecutor) {
    this.measureExecutor = measureExecutor || new MeasureExecutor(projectId);
  }

  async run(
    monitor: MonitorDef,
    measure: Measure,
    entity: Entity<any>
  ): Promise<AnomalyCandidate[]> {
    // 1. Calculate Date Range
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - monitor.lookbackDays);

    const options = {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };

    // 2. Identify Date Column & Dimensions
    const dateField = this.findDateColumn(entity) || "date";
    // Unique dimensions to fetch (scan dimensions + date)
    const fetchDimensions = Array.from(
      new Set([...monitor.scanConfig.dimensions, dateField])
    );

    // 3. Fetch Data
    const contextMetrics = monitor.contextMetrics || [];
    const rows = await this.measureExecutor.fetch(
      {
        ...measure,
        filters: [
          ...(measure.filters || []),
          ...(monitor.scanConfig.filters || []),
        ],
      },
      entity,
      options,
      fetchDimensions,
      contextMetrics
    );

    // 4. Group by Dimensions (create Time Series)
    const groupDimensions = monitor.scanConfig.dimensions.filter(
      (d: string) => d !== dateField
    );

    const seriesMap = new Map<
      string,
      { dimensions: Record<string, any>; points: TimeSeriesPoint[] }
    >();

    for (const row of rows) {
      const dimKey = groupDimensions.map((d: string) => `${d}:${row[d]}`).join("|");

      if (!seriesMap.has(dimKey)) {
        const dimValues: Record<string, any> = {};
        groupDimensions.forEach((d: string) => (dimValues[d] = row[d]));
        seriesMap.set(dimKey, { dimensions: dimValues, points: [] });
      }

      const val = Number(row.value);
      if (!isNaN(val)) {
        const metrics: Record<string, number> = {};
        contextMetrics.forEach((m: string) => {
          const mVal = Number(row[m]);
          if (!isNaN(mVal)) metrics[m] = mVal;
        });

        seriesMap.get(dimKey)!.points.push({
          timestamp: row[dateField],
          value: val,
          metrics,
        });
      }
    }

    // 5. Prune & Analyze
    const anomalies: AnomalyCandidate[] = [];
    const strategy = getStrategy(monitor.strategy.type);

    for (const [key, { dimensions, points }] of seriesMap.entries()) {
      const totalVolume = points.reduce((sum, p) => sum + p.value, 0);
      if (totalVolume < monitor.scanConfig.minVolume) {
        continue;
      }

      const detectedAnomalies = strategy.detect(points, monitor.strategy);

      for (const anomaly of detectedAnomalies) {
        anomalies.push({
          monitorId: monitor.id,
          measureId: measure.id,
          entityId: entity.id,
          dimensions,
          metric: "field" in measure.value ? measure.value.field : measure.id,
          anomaly,
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // 6. Save to BigQuery
    if (anomalies.length > 0) {
      console.log(
        `Found ${anomalies.length} anomalies. Saving to BigQuery...`
      );

      const rowsToInsert = anomalies.map((s) => {
        let financial_impact: number | null = null;
        const impactType = monitor.impact?.type;

        if (impactType === "financial") {
          financial_impact =
            s.anomaly.impact * (monitor.impact?.multiplier ?? 1);
        }

        return {
          monitor_id: s.monitorId,
          measure_id: s.measureId,
          entity_id: s.entityId,
          metric: s.metric,
          detected_at: s.detectedAt,
          anomaly_score: s.anomaly.score,
          anomaly_impact: s.anomaly.impact,
          anomaly_message: s.anomaly.message,
          source_table: snakeCase(monitor.id),

          classification: monitor.classification || "heuristic",
          impact_type: impactType || null,
          impact_unit: monitor.impact?.unit || null,
          financial_impact: financial_impact,

          // Map the primary anomaly value to the metric name (e.g., 'spend')
          [s.metric]: s.anomaly.context.value,

          ...s.anomaly.context,
          ...s.dimensions,
        };
      });

      const clusteringFields = Object.keys(
        anomalies[0].dimensions
      ).slice(0, 4);

      await upsertPartitionedClusteredTable(rowsToInsert, {
        datasetId: "anomalies",
        tableId: snakeCase(monitor.id),
        partitionField: "detected_at",
        clusteringFields,
      });

      console.log(
        `Saved anomalies to anomalies.${snakeCase(monitor.id)}`
      );
    } else {
      console.log(`No anomalies found for ${monitor.id}.`);
    }

    return anomalies;
  }

  private findDateColumn(entity: Entity<any>): string | null {
    const dimensions =
      (entity as any).definition?.dimensions || (entity as any).dimensions;

    // Try to find a dimension of type 'date'
    for (const [name, dim] of Object.entries(dimensions || {})) {
      if ((dim as any).type === "date") return name;
    }
    // Fallback common names
    if (dimensions?.["date"]) return "date";
    if (dimensions?.["day"]) return "day";
    return null;
  }

  private findDateField(row: any): string | null {
    // Legacy helper, keeping just in case or removing if unused.
    // Logic moved to findDateColumn(entity).
    return null;
  }
}
