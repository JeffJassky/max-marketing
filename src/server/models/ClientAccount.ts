import { z } from "zod";
import { AppDataModel } from "./AppDataModel";

const ClientAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  googleAdsId: z.string().optional().nullable(),
  facebookAdsId: z.string().optional().nullable(),
  ga4Id: z.string().optional().nullable(),
  shopifyId: z.string().optional().nullable(),
  instagramId: z.string().optional().nullable(),
  facebookPageId: z.string().optional().nullable(),
  gscId: z.string().optional().nullable(),
  tiktokId: z.string().optional().nullable(),
  googleAdsCurrency: z.string().optional().nullable(),   // ISO 4217, e.g. 'USD', 'GBP'
  facebookAdsCurrency: z.string().optional().nullable(), // ISO 4217
  shopifyCurrency: z.string().optional().nullable(),     // ISO 4217
});

export type ClientAccount = z.infer<typeof ClientAccountSchema>;

export class ClientAccountModel extends AppDataModel<typeof ClientAccountSchema> {
  readonly datasetId = "app_data";
  readonly tableId = "accounts";
  readonly schema = ClientAccountSchema;
}

export const clientAccountModel = new ClientAccountModel();