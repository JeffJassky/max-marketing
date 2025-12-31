I want to essentially programatically create a system that will automatically loop over ALL entities, then loop over ALL dimensions, and all metrics to find the top one by that metric..

So for example: in the `campaign_daily` entity, find the top (campaign) by sum(impressions)

My thinking is that we would create a new aggregateReport that would have these fields:
account_id, entity_name, dimension_name, metric_name, metric_value

then we would be able to say something like..

the (name) (campaign, adset, ad, creative) had the most (metrics)