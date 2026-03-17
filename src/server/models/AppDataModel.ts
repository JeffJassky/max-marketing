import { z } from "zod";
import { createBigQueryClient } from "../../shared/vendors/google/bigquery/bigquery";
import { getDatasetInfo } from "../../shared/data/bigQueryLocation";

export abstract class AppDataModel<T extends z.ZodObject<any>> {
  abstract readonly datasetId: string;
  abstract readonly tableId: string;
  abstract readonly schema: T;
  
  protected get bq() {
    return createBigQueryClient();
  }

  get fqn(): string {
    const project = process.env.BIGQUERY_PROJECT;
    return `${project}.${this.datasetId}.${this.tableId}`;
  }

  /**
   * Initializes the table and dataset if they don't exist.
   */
  async initialize(): Promise<void> {
    const bq = this.bq;
    const datasetInfo = await getDatasetInfo(bq, this.datasetId);
    
    if (!datasetInfo.exists) {
      console.log(`[AppDataModel] Creating dataset ${this.datasetId}...`);
      await datasetInfo.ref.create({ location: "US" });
    }

    const tableRef = datasetInfo.ref.table(this.tableId);
    const [exists] = await tableRef.exists();

    if (!exists) {
      console.log(`[AppDataModel] Creating table ${this.fqn}...`);
      const schema = this.generateBqSchema();
      await tableRef.create({ schema });
      console.log(`[AppDataModel] Table ${this.fqn} created.`);
    } else {
      // Add any missing columns from the schema
      await this.syncColumns(tableRef);
    }
  }

  private async syncColumns(tableRef: any): Promise<void> {
    const [metadata] = await tableRef.getMetadata();
    const existingFields = new Set(
      (metadata.schema?.fields || []).map((f: any) => f.name)
    );
    const desiredSchema = this.generateBqSchema();
    const missing = desiredSchema.filter((f) => !existingFields.has(f.name));

    if (missing.length === 0) return;

    console.log(
      `[AppDataModel] Adding columns to ${this.datasetId}.${this.tableId}: ${missing.map((f) => f.name).join(", ")}`
    );

    const updatedFields = [
      ...metadata.schema.fields,
      ...missing.map((f) => ({ name: f.name, type: f.type, mode: "NULLABLE" })),
    ];

    metadata.schema.fields = updatedFields;
    await tableRef.setMetadata(metadata);
  }

  private generateBqSchema() {
    return Object.entries(this.schema.shape).map(([name, type]) => {
      let bqType = "STRING";
      let unwrapped = type as any;
      
      // Handle ZodOptional and ZodNullable
      while (unwrapped._def?.innerType) {
        unwrapped = unwrapped._def.innerType;
      }

      if (unwrapped instanceof z.ZodNumber) bqType = "FLOAT64";
      if (unwrapped instanceof z.ZodBoolean) bqType = "BOOL";
      if (unwrapped instanceof z.ZodDate) bqType = "TIMESTAMP";
      
      const isOptional = type instanceof z.ZodOptional || type instanceof z.ZodNullable;
      
      return { 
        name, 
        type: bqType,
        mode: isOptional ? "NULLABLE" : "REQUIRED"
      };
    });
  }

  async findAll(): Promise<z.infer<T>[]> {
    const query = `SELECT * FROM 
${this.fqn}
`;
    const [rows] = await this.bq.query({ query });
    return rows;
  }

  async create(data: z.infer<T>): Promise<void> {
    // Use DML INSERT instead of streaming API to avoid streaming buffer
    // (streaming buffer blocks UPDATE/DELETE for up to 90 minutes)
    const entries = Object.entries(data);
    const columns = entries.map(([k]) => k).join(", ");
    const params: Record<string, any> = {};
    const placeholders = entries.map(([k, v]) => {
      params[k] = v;
      return `@${k}`;
    }).join(", ");

    const query = `INSERT INTO ${this.fqn} (${columns}) VALUES (${placeholders})`;
    await this.bq.query({ query, params });
  }

  async update(id: string, data: Partial<z.infer<T>>): Promise<void> {
    const updates = Object.entries(data).filter(([k]) => k !== 'id');
    if (updates.length === 0) return;

    const setClause = updates
      .map(([key, value]) => {
         let val: string;
         if (value === null || value === undefined) {
           val = "NULL";
         } else if (typeof value === 'string') {
           val = `'${value.replace(/'/g, "\'")}'`;
         } else if (typeof value === 'number' || typeof value === 'boolean') {
           val = String(value);
         } else {
           val = `'${JSON.stringify(value).replace(/'/g, "\'")}'`;
         }
         return `${key} = ${val}`;
      })
      .join(", ");
    
    const query = `UPDATE 
${this.fqn}
 SET ${setClause} WHERE id = '${id}'`;
    await this.bq.query({ query });
  }

  async delete(id: string): Promise<void> {
    const query = `DELETE FROM 
${this.fqn}
 WHERE id = '${id}'`;
    await this.bq.query({ query });
  }
}
