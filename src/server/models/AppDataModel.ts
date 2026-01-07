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
    }
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
    const tableRef = this.bq.dataset(this.datasetId).table(this.tableId);
    await tableRef.insert(data);
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
