import { createBigQueryClient } from '../vendors/google/bigquery/bigquery';
import type { Measure } from './types';
import { Entity } from '../../jobs/base';
import knex from 'knex';

const qb = knex({ client: 'pg' }); // Used for SQL generation

export interface MeasureFetchOptions {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
}

export interface MeasureResultRow {
    [key: string]: any;
    date?: string; // If date is a dimension
}

export class MeasureExecutor {
    constructor(private readonly projectId: string) {}

    /**
     * Fetches data for a Measure from BigQuery.
     * 
     * @param measure The Measure definition
     * @param entity The source Entity definition (needed for table name/schema)
     * @param options Time range for the fetch
     */
    async fetch(measure: Measure, entity: Entity<any>, options: MeasureFetchOptions, dimensions: string[] = [], extraMetrics: string[] = []): Promise<MeasureResultRow[]> {
        const query = this.buildQuery(measure, entity, options, dimensions, extraMetrics);
        
        console.log(`Executing Measure Fetch for ${measure.id} with context [${extraMetrics.join(',')}]...`);
        
        const bq = createBigQueryClient();
        const [job] = await bq.createQueryJob({ query });
        const [rows] = await job.getQueryResults();
        
        return rows;
    }

    private buildQuery(measure: Measure, entity: Entity<any>, options: MeasureFetchOptions, dimensions: string[], extraMetrics: string[]): string {
        const table = entity.tableName;
        const tableName = `${this.projectId}.${entity.dataset}.${table}`;
        
        // Validate Dimensions
        if (measure.allowedDimensions) {
            const invalid = dimensions.filter(d => !measure.allowedDimensions!.includes(d));
            if (invalid.length > 0) {
                console.warn(`Requested dimensions [${invalid.join(', ')}] are not in allowed list for measure ${measure.id}. Ignoring restrictions for now.`);
            }
        }

        // 1. SELECT Dimensions & Metrics
        const selects: string[] = [];
        
        // Dimensions
        dimensions.forEach(dim => {
            selects.push(`\`${dim}\``);
        });

        // Metric (Atomic)
        if ('expression' in measure.value) {
            selects.push(`${measure.value.expression} AS value`);
        } else {
            const { field, aggregation } = measure.value;
            selects.push(`${aggregation.toUpperCase()}(\`${field}\`) AS value`);
        }

        // Extra Context Metrics
        extraMetrics.forEach(metricName => {
            const entityMetrics = (entity as any).definition?.metrics || (entity as any).metrics || {};
            const def = entityMetrics[metricName];
            
            if (def) {
                if (def.expression) {
                     selects.push(`${def.expression} AS ${metricName}`);
                } else {
                    // For Silver entities, the column name IS the metricName.
                    // sourceField is only relevant when transforming Bronze -> Silver.
                    const agg = def.aggregation || 'sum'; 
                    selects.push(`${agg.toUpperCase()}(\`${metricName}\`) AS ${metricName}`);
                }
            } else {
                // Fallback: assume simple sum of a column with same name
                selects.push(`SUM(\`${metricName}\`) AS ${metricName}`);
            }
        });

        const queryBuilder = qb
            .from(qb.raw(`\`${tableName}\``))
            .select(qb.raw(selects.join(', ')));

        // 2. WHERE (Time Range)
        const dateCol = this.findDateColumn(entity);
        if (dateCol) {
            queryBuilder.whereRaw(`\`${dateCol}\` >= ?`, [options.startDate]);
            queryBuilder.whereRaw(`\`${dateCol}\` <= ?`, [options.endDate]);
        } else {
            console.warn(`No date column found for entity ${entity.id}. Fetching without time bounds.`);
        }

        // 3. WHERE (Measure Filters)
        if (measure.filters) {
            measure.filters.forEach(filter => {
                // Use qb.raw for the field to ensure backticks, let Knex handle the operator and value binding
                queryBuilder.where(qb.raw(`\`${filter.field}\``), filter.op, filter.value);
            });
        }

        // 4. GROUP BY
        if (dimensions.length > 0) {
            queryBuilder.groupByRaw(dimensions.map(d => `\`${d}\``).join(', '));
        }
        
        // 5. ORDER BY (Optional, but good for time series)
        if (dateCol && dimensions.includes(dateCol)) {
            queryBuilder.orderByRaw(`\`${dateCol}\` ASC`);
        }

        return queryBuilder.toQuery();
    }

    private findDateColumn(entity: Entity<any>): string | null {
        const dimensions = (entity as any).definition?.dimensions || (entity as any).dimensions;
        
        // Try to find a dimension of type 'date'
        // Note: Entity class dims are { type: z.ZodType, sourceField: ... }
        // EntitySchema dims are { type: string ... }
        // We need to handle both structures or assume key name checking.
        
        for (const [name, dim] of Object.entries(dimensions || {})) {
            if ((dim as any).type === 'date' || (dim as any).type?.name === 'ZodString') { 
               // Zod check is hard without instance check. 
               // Let's rely on name fallback if type check fails.
               return name;
            }
             // For EntitySchema (from types.ts), dim.type is 'date' string.
             if ((dim as any).type === 'date') return name;
        }
        // Fallback common names
        if (dimensions?.['date']) return 'date';
        if (dimensions?.['day']) return 'day';
        return null;
    }
}
