SO I want to add a system that will automatically identify superlative entities and generate a report with all of the examples.

I added a `superlatives` config to the `EntitySchema` in types.ts for the configs.

# The gold `reports.superlatives` data shape 
Column,Type,Description,Example
report_date,Date,When this run happened,2023-10-27
account_id,String,The client ID,act_12345
time_period,String,The lookback window,last_30_days
entity_type,String,What are we looking at?,"campaign, ad_creative, product_sku"
item_name,String,The human-readable winner,Retargeting - Fall Sale
item_id,String,The system ID (for linking),123456789
metric_name,String,The metric used to judge,"spend, roas, clicks"
metric_value,Float,The winning score,5420.50

Loop over entities
	Loop over superlatves
		Loop over metrics
			Find the top item by metric
			Insert it into the gold 'superlatives' table



Something sorta kinda like:

def generate_superlatives(account_id, config, date_range):
    results = []
    
    for item in config:
        # Loop over every metric we care about for this entity
        for metric in item['metrics']:
            
            # 1. Find the WINNER (Highest)
            winner = db.query(f"""
                SELECT {item['primary_dimension']}, {item['id_dimension']}, SUM({metric}) as score
                FROM {item['entity']}
                WHERE account_id = '{account_id}'
                AND date BETWEEN '{date_range.start}' AND '{date_range.end}'
                GROUP BY 1, 2
                HAVING SUM({item['threshold_metric']}) > {item['threshold_value']} -- Safety filter
                ORDER BY score DESC
                LIMIT 1
            """)
            
            # 2. Append to results list
            results.append({
                "entity_type": item['entity'],
                "item_name": winner.name,
                "metric_name": metric,
                "metric_value": winner.score,
                "rank_type": "highest"
            })
            
    # Bulk insert 'results' into Report_Superlatives table
    return results


# On the front end:
The Template: "The {item_name} {entity_type} had the {rank_type} {metric_name} ({metric_value})."