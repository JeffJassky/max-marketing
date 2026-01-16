import { Entity } from "../../base";
import { shopifyOrders } from "../../imports/shopify/orders.import";
import { z } from "zod";
import {
  VolumeTitanAward,
  RocketShipAward,
  FirstPlaceAward,
  EfficiencyKingAward,
  DominatorAward,
} from "../../../shared/data/awards/library";

export const shopifyDaily = new Entity({
  id: "shopifyDaily",
  label: "Shopify Performance",
  description: "Daily Shopify sales performance broken down by location.",
  sources: [shopifyOrders],
  partitionBy: "date",
  clusterBy: ["account_id", "source", "country", "region"],
  grain: ["date", "account_id", "source", "country", "region", "city"],
  dimensions: {
    date: { type: z.string() },
    account_id: { type: z.string() },
    source: { type: z.string(), sourceField: "source" },
    country: { 
      type: z.string(), 
      sourceField: "order_shipping_address_country" 
    },
    region: {
      type: z.string(),
      sourceField: "order_shipping_address_province"
    },
    city: {
      type: z.string(),
      expression: "CONCAT(order_shipping_address_city, ', ', order_shipping_address_province)"
    },
  },
  metrics: {
    orders: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "order_total_count",
    },
    revenue: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "order_total_price",
    },
    tax: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "order_current_total_tax",
    },
    discounts: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "order_total_discounts",
    },
    refunds: {
      type: z.number(),
      aggregation: "sum",
      sourceField: "order_refunds_subtotal",
    },
  },
  superlatives: [
    {
      dimensionId: "city",
      dimensionLabel: "City",
      limit: 10,
      metrics: [
        { 
          metric: "revenue", 
          awards: [VolumeTitanAward, RocketShipAward, FirstPlaceAward] 
        },
        { 
          metric: "orders",
          awards: [VolumeTitanAward]
        },
      ],
    },
    {
      dimensionId: "region",
      dimensionLabel: "Region",
      limit: 5,
      metrics: [
        { 
          metric: "revenue", 
          awards: [DominatorAward, VolumeTitanAward] 
        },
        { 
          metric: "orders",
          awards: [VolumeTitanAward]
        },
      ],
    },
    {
      dimensionId: "country",
      dimensionLabel: "Country",
      limit: 5,
      metrics: [
        { 
          metric: "revenue", 
          awards: [DominatorAward, VolumeTitanAward] 
        },
        { 
          metric: "orders",
          awards: [VolumeTitanAward]
        },
      ],
    },
  ],
});
