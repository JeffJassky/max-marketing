import { z } from 'zod';
import type { TableField } from '@google-cloud/bigquery';

export function zodToBigQuerySchema(schema: z.ZodObject<any>): TableField[] {
  const shape = schema.shape;
  const fields: TableField[] = [];

  for (const [name, zodType] of Object.entries(shape)) {
    fields.push(mapZodField(name, zodType as z.ZodTypeAny));
  }

  return fields;
}

function mapZodField(name: string, type: z.ZodTypeAny): TableField {
  let current: any = type;
  let mode: 'REQUIRED' | 'NULLABLE' | 'REPEATED' = 'NULLABLE';

  // Loop to unwrap wrappers (Optional, Nullable, Default, Array)
  while (true) {
    // 1. Handle Optional/Nullable/Default wrappers FIRST
    if (current instanceof z.ZodOptional || current instanceof z.ZodNullable || current instanceof z.ZodDefault) {
      current = current._def.innerType;
      continue;
    }

    // 2. Handle Arrays - use instanceof only
    if (current instanceof z.ZodArray) {
      mode = 'REPEATED';
      current = current._def.element; // ZodArray stores element type in _def.element
      continue;
    }

    // If we get here, it's not a wrapper we need to strip
    break;
  }

  // 3. Handle Objects (Record)
  if (current instanceof z.ZodObject) {
    const shape = current.shape;
    const subFields = Object.entries(shape).map(([subName, subType]) =>
      mapZodField(subName, subType as z.ZodTypeAny)
    );
    return {
      name,
      type: 'RECORD',
      mode,
      fields: subFields
    };
  }

  // 4. Scalar mapping
  let bqType: string = 'STRING';

  if (current instanceof z.ZodNumber) {
    bqType = 'FLOAT64';
  } else if (current instanceof z.ZodBoolean) {
    bqType = 'BOOL';
  } else if (current instanceof z.ZodDate) {
    bqType = 'DATE';
  } else if (current instanceof z.ZodString) {
    // Special case for common date field names
    if (['date', 'report_date', 'period_start', 'period_end'].includes(name.toLowerCase())) {
      bqType = 'DATE';
    } else if (name.toLowerCase() === 'detected_at') {
      bqType = 'TIMESTAMP';
    }
  }

  return {
    name,
    type: bqType as any,
    mode
  };
}
