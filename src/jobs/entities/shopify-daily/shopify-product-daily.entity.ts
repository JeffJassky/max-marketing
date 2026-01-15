import { Entity } from "../../base";
import { shopifyProducts } from "../../imports/shopify/products.import";
import { z } from "zod";
import {
  VolumeTitanAward,
  RocketShipAward,
  FirstPlaceAward,
  DominatorAward,
  GrowthAward,
} from "../../../shared/data/awards/library";

export const shopifyProductDaily = new (class ShopifyProductDailyEntity extends Entity<typeof shopifyProducts> {
  constructor() {
    super({
      id: "shopifyProductDaily",
      label: "Shopify Product Performance",
      description: "Daily performance of products joined with metadata (vendor, type).",
      sources: [shopifyProducts],
      partitionBy: "date",
      clusterBy: ["account_id", "product_vendor", "product_type", "product_title"],
      grain: ["date", "account_id", "product_id"],
      dimensions: {
        date: { type: z.string() },
        account_id: { type: z.string() },
        product_id: { type: z.string() },
        product_title: { type: z.string() },
        product_type: { type: z.string() },
        product_vendor: { type: z.string() },
      },
      metrics: {
        units_sold: {
          type: z.number(),
          aggregation: "sum",
        },
        revenue: {
          type: z.number(),
          aggregation: "sum",
        },
        orders: {
          type: z.number(),
          aggregation: "sum",
        },
      },
      superlatives: [
        {
          dimensionId: "product_id",
          dimensionNameField: "product_title",
          dimensionLabel: "Product",
          limit: 10,
          metrics: [
            { 
              metric: "revenue", 
              awards: [VolumeTitanAward, RocketShipAward, FirstPlaceAward] 
            },
            { 
              metric: "units_sold",
              awards: [VolumeTitanAward, DominatorAward, GrowthAward]
            },
          ],
        },
        {
          dimensionId: "product_vendor",
          dimensionLabel: "Vendor",
          limit: 10,
          metrics: [
            { metric: "revenue", awards: [VolumeTitanAward, FirstPlaceAward] },
            { metric: "units_sold", awards: [VolumeTitanAward] },
          ],
        },
        {
          dimensionId: "product_type",
          dimensionLabel: "Product Type",
          limit: 10,
          metrics: [
            { metric: "revenue", awards: [VolumeTitanAward, FirstPlaceAward] },
            { metric: "units_sold", awards: [VolumeTitanAward] },
          ],
        },
      ],
    });
  }

  getTransformQuery(): string {
    const sourceTable = shopifyProducts.fqn;
    return "WITH sales AS (" +
      "  SELECT " +
      "    date, " +
      "    account_id, " +
      "    COALESCE(line_item__product_id, product_id) as product_id, " +
      "    COALESCE(line_item__name, product_title) as product_title, " +
      "    line_item__vendor, " +
      "    order_id, " +
      "    SAFE_CAST(line_item__quantity AS FLOAT64) as quantity, " +
      "    SAFE_CAST(line_item__price AS FLOAT64) as price " +
      "  FROM `" + sourceTable + "` " +
      "  WHERE order_id IS NOT NULL AND (line_item__quantity > 0 OR line_item__quantity IS NOT NULL)" +
      "), " +
      "metadata AS (" +
      "  SELECT " +
      "    account_id, " +
      "    product_id, " +
      "    ANY_VALUE(product_type) as product_type, " +
      "    ANY_VALUE(COALESCE(product_vendor, line_item__vendor)) as product_vendor " +
      "  FROM `" + sourceTable + "` " +
      "  WHERE product_id IS NOT NULL AND product_type IS NOT NULL AND product_type != '' " +
      "  GROUP BY 1, 2" +
      ") " +
      "SELECT " +
      "  s.date, " +
      "  s.account_id, " +
      "  s.product_id, " +
      "  ANY_VALUE(s.product_title) as product_title, " +
      "  ANY_VALUE(COALESCE(m.product_type, 'Uncategorized')) as product_type, " +
      "  ANY_VALUE(COALESCE(m.product_vendor, s.line_item__vendor, 'Unknown')) as product_vendor, " +
      "  SUM(s.quantity) as units_sold, " +
      "  SUM(s.quantity * s.price) as revenue, " +
      "  COUNT(DISTINCT s.order_id) as orders " +
      "FROM sales s " +
      "LEFT JOIN metadata m ON s.account_id = m.account_id AND s.product_id = m.product_id " +
      "GROUP BY 1, 2, 3";
  }
})();