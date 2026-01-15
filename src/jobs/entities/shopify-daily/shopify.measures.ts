import { Measure } from "../../../shared/data/types";
import { shopifyDaily } from "./shopify-daily.entity";
import { shopifyProductDaily } from "./shopify-product-daily.entity";

export const shopifyRevenueMeasure: Measure = {
  id: "shopify_revenue_daily",
  entityId: shopifyDaily.id,
  name: "Daily Shopify Revenue",
  description: "Total daily revenue from Shopify orders.",
  value: { field: "revenue", aggregation: "sum" },
  allowedDimensions: ["account_id", "country", "region", "city", "date"],
};

export const shopifyOrdersMeasure: Measure = {
  id: "shopify_orders_daily",
  entityId: shopifyDaily.id,
  name: "Daily Shopify Orders",
  description: "Total daily count of Shopify orders.",
  value: { field: "orders", aggregation: "sum" },
  allowedDimensions: ["account_id", "country", "region", "city", "date"],
};

export const shopifyUnitsSoldMeasure: Measure = {
  id: "shopify_units_sold_daily",
  entityId: shopifyProductDaily.id,
  name: "Daily Shopify Units Sold",
  description: "Total daily units sold for Shopify products.",
  value: { field: "units_sold", aggregation: "sum" },
  allowedDimensions: ["account_id", "product_id", "product_vendor", "product_type", "date"],
};

