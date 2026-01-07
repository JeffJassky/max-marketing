import { z } from "zod";
import { AppDataModel } from "./AppDataModel";

const ClientAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  googleAdsId: z.string().optional().nullable(),
  facebookAdsId: z.string().optional().nullable(),
  ga4Id: z.string().optional().nullable(),
});

export type ClientAccount = z.infer<typeof ClientAccountSchema>;

export class ClientAccountModel extends AppDataModel<typeof ClientAccountSchema> {
  readonly datasetId = "app_data";
  readonly tableId = "accounts";
  readonly schema = ClientAccountSchema;
}

export const clientAccountModel = new ClientAccountModel();