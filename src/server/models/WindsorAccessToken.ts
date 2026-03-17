import { z } from "zod";
import { AppDataModel } from "./AppDataModel";

const WindsorAccessTokenSchema = z.object({
  access_token: z.string(),
  maxed_account_id: z.string().nullable(),
  status: z.string(), // 'available' | 'assigned' | 'invalid'
  assigned_at: z.date().nullable(),
});

export type WindsorAccessToken = z.infer<typeof WindsorAccessTokenSchema>;

export class WindsorAccessTokenModel extends AppDataModel<typeof WindsorAccessTokenSchema> {
  readonly datasetId = "app_data";
  readonly tableId = "windsor_access_tokens";
  readonly schema = WindsorAccessTokenSchema;

  /**
   * Find the token currently assigned to a given account.
   */
  async findByAccountId(accountId: string): Promise<WindsorAccessToken | null> {
    const query = `
      SELECT access_token, maxed_account_id, status, assigned_at
      FROM ${this.fqn}
      WHERE maxed_account_id = @accountId AND status = 'assigned'
      LIMIT 1
    `;
    const [rows] = await this.bq.query({ query, params: { accountId } });
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Fetch the first available (unassigned) token from the pool.
   */
  async findFirstAvailable(): Promise<WindsorAccessToken | null> {
    const query = `
      SELECT access_token, maxed_account_id, status, assigned_at
      FROM ${this.fqn}
      WHERE status = 'available' AND maxed_account_id IS NULL
      LIMIT 1
    `;
    const [rows] = await this.bq.query({ query });
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Assign a token to an account, marking it as 'assigned'.
   */
  async assignToAccount(token: string, accountId: string): Promise<void> {
    const query = `
      UPDATE ${this.fqn}
      SET maxed_account_id = @accountId,
          status = 'assigned',
          assigned_at = CURRENT_TIMESTAMP()
      WHERE access_token = @token
    `;
    await this.bq.query({ query, params: { accountId, token } });
  }

  /**
   * Mark a token as invalid (e.g., when Windsor returns 401).
   */
  async markInvalid(token: string): Promise<void> {
    const query = `
      UPDATE ${this.fqn}
      SET status = 'invalid'
      WHERE access_token = @token
    `;
    await this.bq.query({ query, params: { token } });
  }
}

export const windsorAccessTokenModel = new WindsorAccessTokenModel();
