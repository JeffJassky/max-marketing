import mongoose, { Schema, Document } from "mongoose";

export interface IShopifySession extends Document {
  shop: string; // e.g. "mystore.myshopify.com"
  accessToken: string;
  scope: string;
  installedAt: Date;
  clientAccountId?: string; // link to BigQuery ClientAccount.id
}

const ShopifySessionSchema = new Schema<IShopifySession>(
  {
    shop: { type: String, required: true, unique: true, index: true },
    accessToken: { type: String, required: true },
    scope: { type: String, required: true },
    installedAt: { type: Date, default: Date.now },
    clientAccountId: { type: String, default: null },
  },
  { timestamps: true },
);

export const ShopifySession = mongoose.model<IShopifySession>(
  "ShopifySession",
  ShopifySessionSchema,
);
