import { createBigQueryClient } from '../../shared/vendors/google/bigquery/bigquery';
import { AccountSettingsPatchSchema } from '../../shared/settings/schema';
import type { AccountSettingsOverrides } from '../../shared/settings/types';

/**
 * BigQuery model for managing account settings.
 * Stores sparse overrides in a JSON column; defaults applied at read time.
 */
export class AccountSettingsModel {
  private readonly datasetId = 'app_data';
  private readonly tableId = 'account_settings';

  private get fqn(): string {
    const project = process.env.BIGQUERY_PROJECT;
    return `${project}.${this.datasetId}.${this.tableId}`;
  }

  private get bq() {
    return createBigQueryClient();
  }

  /**
   * Initialize the settings table if it doesn't exist.
   */
  async initialize(): Promise<void> {
    const bq = this.bq;
    const dataset = bq.dataset(this.datasetId);
    const [datasetExists] = await dataset.exists();

    if (!datasetExists) {
      console.log(`[AccountSettingsModel] Creating dataset ${this.datasetId}...`);
      await dataset.create({ location: 'US' });
    }

    const table = dataset.table(this.tableId);
    const [tableExists] = await table.exists();

    if (!tableExists) {
      console.log(`[AccountSettingsModel] Creating table ${this.fqn}...`);
      await dataset.createTable(this.tableId, {
        schema: {
          fields: [
            { name: 'account_id', type: 'STRING', mode: 'REQUIRED' },
            { name: 'settings', type: 'JSON', mode: 'NULLABLE' },
            { name: 'updated_at', type: 'TIMESTAMP', mode: 'NULLABLE' },
            { name: 'updated_by', type: 'STRING', mode: 'NULLABLE' },
          ],
        },
      });
      console.log(`[AccountSettingsModel] Table ${this.fqn} created.`);
    }
  }

  /**
   * Get sparse overrides for an account (empty object if not found).
   */
  async getOverrides(accountId: string): Promise<AccountSettingsOverrides> {
    const query = `
      SELECT settings FROM ${this.fqn}
      WHERE account_id = @accountId
      LIMIT 1
    `;

    try {
      const [rows] = await this.bq.query({
        query,
        params: { accountId },
      });

      if (rows.length === 0) return {};

      const settings = rows[0].settings;

      // BigQuery returns JSON as a string, so parse it
      if (typeof settings === 'string') {
        return JSON.parse(settings) as AccountSettingsOverrides;
      }

      return (settings as AccountSettingsOverrides) || {};
    } catch (error) {
      console.error(`[AccountSettingsModel] Error fetching overrides for ${accountId}:`, error);
      return {};
    }
  }

  /**
   * Save sparse overrides for an account (creates or updates).
   */
  async setOverrides(
    accountId: string,
    overrides: AccountSettingsOverrides
  ): Promise<void> {
    // Validate overrides against patch schema
    const validated = AccountSettingsPatchSchema.parse(overrides);

    const settingsJson = JSON.stringify(validated);

    const query = `
      MERGE INTO ${this.fqn} T
      USING (SELECT @accountId as account_id) S
      ON T.account_id = S.account_id
      WHEN MATCHED THEN
        UPDATE SET
          settings = PARSE_JSON(@settingsJson),
          updated_at = CURRENT_TIMESTAMP()
      WHEN NOT MATCHED THEN
        INSERT (account_id, settings, updated_at)
        VALUES (@accountId, PARSE_JSON(@settingsJson), CURRENT_TIMESTAMP())
    `;

    try {
      await this.bq.query({
        query,
        params: {
          accountId,
          settingsJson,
        },
      });
    } catch (error) {
      console.error(`[AccountSettingsModel] Error saving overrides for ${accountId}:`, error);
      throw error;
    }
  }
}

export const accountSettingsModel = new AccountSettingsModel();
