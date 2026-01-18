`https://connectors.windsor.ai/searchconsole?api_key=[your API key]&date_preset=last_7d&fields=site,query,clicks,position,ctr,impressions&_renderer=csv`

# **Available options**

| **ID** | **Type** | **Name** | **Description** | **Options** |
| --- | --- | --- | --- | --- |
| [**include_fresh_data**](https://windsor.ai/data-field/searchconsole/#include_fresh_data) | **CHECKBOX** | **Include Fresh Data** | **If this option is set, fresh data, not finalized would be included into the results. More information about fresh data is available at: https://developers.google.com/search/blog/2019/09/search-performance-fresh-data** | **undefined** |

# **Fields**

| **ID** | **Type** | **Name** | **Description** | **Report** |
| --- | --- | --- | --- | --- |
| [**account_id**](https://windsor.ai/data-field/searchconsole/#account_id) | **TEXT** | **Account ID** | **The Site** | **Search Analytics** |
| [**account_name**](https://windsor.ai/data-field/searchconsole/#account_name) | **TEXT** | **Account Name** | **The Site** | **Search Analytics** |
| [**anchor**](https://windsor.ai/data-field/searchconsole/#anchor) | **TEXT** | **Anchor** | **Anchor of the Page, e.g. if site is https://abc.foo.bar/a.html#anchor1 then this is 'anchor1'** | **Search Analytics** |
| [**branded_vs_nonbranded**](https://windsor.ai/data-field/searchconsole/#branded_vs_nonbranded) | **TEXT** | **Branded vs Non-Branded** | **The value is "branded" if the domain name is included in the search query, otherwise it's "nonbranded"** | **Search Analytics** |
| [**clicks**](https://windsor.ai/data-field/searchconsole/#clicks) | **NUMERIC** | **Clicks** | **The Number of Clicks** | **Search Analytics** |
| [**country**](https://windsor.ai/data-field/searchconsole/#country) | **COUNTRY** | **Country Name** | **Country Name** | **Search Analytics** |
| [**countryname**](https://windsor.ai/data-field/searchconsole/#countryname) | **COUNTRY** | **Country Name** | **The Country Name** | **Search Analytics** |
| [**ctr**](https://windsor.ai/data-field/searchconsole/#ctr) | **PERCENT** | **CTR** | **The Click Through Rate** | **Search Analytics** |
| [**datasource**](https://windsor.ai/data-field/searchconsole/#datasource) | **TEXT** | **Data Source** | **The name of the Windsor connector returning the row** | **undefined** |
| [**date**](https://windsor.ai/data-field/searchconsole/#date) | **DATE** | **Date** | **The date (for Sitemaps this is the date of the last submission)** | **Search Analytics** |
| [**day_of_month**](https://windsor.ai/data-field/searchconsole/#day_of_month) | **TEXT** | **Day of month** | **Day of the month** | **undefined** |
| [**device**](https://windsor.ai/data-field/searchconsole/#device) | **TEXT** | **Device** | **The Device Used for the Search** | **Search Analytics** |
| [**errors**](https://windsor.ai/data-field/searchconsole/#errors) | **NUMERIC** | **Errors** | **Number of errors in the sitemap** | **Sitemaps** |
| [**hostname**](https://windsor.ai/data-field/searchconsole/#hostname) | **TEXT** | **Hostname** | **The domain name of the Page** | **Search Analytics** |
| [**impressions**](https://windsor.ai/data-field/searchconsole/#impressions) | **NUMERIC** | **Impressions** | **The Number of Impressions** | **Search Analytics** |
| [**indexed**](https://windsor.ai/data-field/searchconsole/#indexed) | **NUMERIC** | **Indexed (deprecated)** | **The number of indexed URLs from the sitemap (deprecated)** | **Sitemaps** |
| [**is_sitemaps_index**](https://windsor.ai/data-field/searchconsole/#is_sitemaps_index) | **BOOLEAN** | **Is sitemaps index** | **If true, the sitemap is a collection of sitemaps** | **Sitemaps** |
| [**last_downloaded**](https://windsor.ai/data-field/searchconsole/#last_downloaded) | **DATE** | **Last downloaded** | **Date and time in which this sitemap was last downloaded** | **Sitemaps** |
| [**last_submitted**](https://windsor.ai/data-field/searchconsole/#last_submitted) | **DATE** | **Last submitted** | **Date and time in which this sitemap was submitted** | **Sitemaps** |
| [**month**](https://windsor.ai/data-field/searchconsole/#month) | **TEXT** | **Month** | **Number of the month** | **undefined** |
| [**page**](https://windsor.ai/data-field/searchconsole/#page) | **TEXT** | **Page** | **The Page** | **Search Analytics** |
| [**pagepath**](https://windsor.ai/data-field/searchconsole/#pagepath) | **TEXT** | **Page Path** | **Full path of the Page, excluding the Protocol and Hostname** | **Search Analytics** |
| [**path**](https://windsor.ai/data-field/searchconsole/#path) | **TEXT** | **Path** | **The url of the sitemap** | **Sitemaps** |
| [**pathlevel1**](https://windsor.ai/data-field/searchconsole/#pathlevel1) | **TEXT** | **pagePathlevel1** | **Top-level Directory Path of the Page, e.g. if site is https://abc.foo.bar/a/b/c/dd.html?a=b then pathlevel1 is 'a'** | **Search Analytics** |
| [**pathlevel2**](https://windsor.ai/data-field/searchconsole/#pathlevel2) | **TEXT** | **pagePathlevel2** | **2nd level Directory Path of the Page, e.g. if site is https://abc.foo.bar/a/b/c/dd.html?a=b then pathlevel2 is 'a/b'** | **Search Analytics** |
| [**pathlevel3**](https://windsor.ai/data-field/searchconsole/#pathlevel3) | **TEXT** | **pagePathlevel3** | **3rd level Directory Path of the Page, e.g. if site is https://abc.foo.bar/a/b/c/dd.html?a=b then pathlevel3 is 'a/b/c'** | **Search Analytics** |
| [**pathlevel4**](https://windsor.ai/data-field/searchconsole/#pathlevel4) | **TEXT** | **pagePathlevel4** | **4th level Directory Path of the Page, e.g. if site is https://abc.foo.bar/a/b/c/dd.html?a=b then pathlevel4 is 'a/b/c'** | **Search Analytics** |
| [**position**](https://windsor.ai/data-field/searchconsole/#position) | **NUMERIC** | **Position** | **The Average Position** | **Search Analytics** |
| [**position_page**](https://windsor.ai/data-field/searchconsole/#position_page) | **NUMERIC** | **Average SERP position** | **The average page number in the Google search results** | **Search Analytics** |
| [**protocol**](https://windsor.ai/data-field/searchconsole/#protocol) | **TEXT** | **Protocol** | **"http" or "https"** | **Search Analytics** |
| [**query**](https://windsor.ai/data-field/searchconsole/#query) | **TEXT** | **Search Query** | **The Search Query** | **Search Analytics** |
| [**queryparams**](https://windsor.ai/data-field/searchconsole/#queryparams) | **TEXT** | **Query params** | **Query parameters of the Page, e.g. if site is https://abc.foo.bar/a.html?a=b then this is 'a=b'** | **Search Analytics** |
| [**search_appearance**](https://windsor.ai/data-field/searchconsole/#search_appearance) | **TEXT** | **Search Appearance** | **How the site appears in the search results** | **Search Appearance** |
| [**search_type**](https://windsor.ai/data-field/searchconsole/#search_type) | **TEXT** | **Search type** | **news, image, video or web, fetching this field could impact the time needed to get response** | **Search Analytics** |
| [**site**](https://windsor.ai/data-field/searchconsole/#site) | **TEXT** | **Site** | **The Site** | **Search Analytics** |
| [**source**](https://windsor.ai/data-field/searchconsole/#source) | **TEXT** | **Source** | **The name of the Windsor connector returning the row** | **undefined** |
| [**submitted**](https://windsor.ai/data-field/searchconsole/#submitted) | **NUMERIC** | **Submitted** | **The number of submitted URLs in the sitemap** | **Sitemaps** |
| [**today**](https://windsor.ai/data-field/searchconsole/#today) | **DATE** | **Today** | **Today's date** | **undefined** |
| [**warnings**](https://windsor.ai/data-field/searchconsole/#warnings) | **NUMERIC** | **Warnings** | **Number of warnings for the sitemap** | **Sitemaps** |
| [**week**](https://windsor.ai/data-field/searchconsole/#week) | **TEXT** | **Week** | **Week (Sun-Sat).** | **undefined** |
| [**week_day**](https://windsor.ai/data-field/searchconsole/#week_day) | **TEXT** | **Day of week and day number** | **Weekday number and name combined (Sun-Sat).Numbered from 0 Sunday to 6 Saturday.** | **undefined** |
| [**week_day_iso**](https://windsor.ai/data-field/searchconsole/#week_day_iso) | **TEXT** | **Day of week and day number, ISO** | **Weekday number and name combined, ISO format (Mon-Sun).Numbered from 1 Monday to 7** | **undefined** |
| [**week_iso**](https://windsor.ai/data-field/searchconsole/#week_iso) | **TEXT** | **Week ISO** | **Week, ISO format (Mon-Sun).** | **undefined** |
| [**words_in_query**](https://windsor.ai/data-field/searchconsole/#words_in_query) | **NUMERIC** | **Words in Query** | **The number of words in the query** | **Search Analytics** |
| [**year**](https://windsor.ai/data-field/searchconsole/#year) | **TEXT** | **Year** | **Year** | **undefined** |
| [**year_month**](https://windsor.ai/data-field/searchconsole/#year_month) | **TEXT** | **Yearmonth** | **Year and month, e.g. 2024|3** | **undefined** |
| [**year_of_week**](https://windsor.ai/data-field/searchconsole/#year_of_week) | **TEXT** | **Year of week** | **The year that contains first day of the week (Sun-Sat).** | **undefined** |
| [**year_of_week_iso**](https://windsor.ai/data-field/searchconsole/#year_of_week_iso) | **TEXT** | **Year of week, ISO** | **The year that contains first day of the ISO week (Mon-Sun).** | **undefined** |
| [**year_week**](https://windsor.ai/data-field/searchconsole/#year_week) | **TEXT** | **Year week** | **Year and week for US weeks (Sun-Sat), e.g. 2024|15** | **undefined** |
| [**year_week_iso**](https://windsor.ai/data-field/searchconsole/#year_week_iso) | **TEXT** | **Year week ISO** | **Year and week for ISO weeks (Mon-Sun), e.g. 2024|20** | **undefined** |