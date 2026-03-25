# Social Media Demographics & Audience Data Reference

Windsor.ai field reference for audience demographics, geographic, and location data across TikTok Organic, Instagram, and Facebook Page Insights connectors.

---

## TikTok Organic

### Account-Level Follower Demographics (Report: Account)

#### Gender
| Field | Type | Description |
|---|---|---|
| `audience_genders_gender` | TEXT | Gender distribution of followers. One of: Female, Male, Other |
| `audience_genders_percentage` | NUMERIC | Percentage of followers associated with specified gender |

#### Age
| Field | Type | Description |
|---|---|---|
| `audience_ages_age` | TEXT | Age group: 18-24, 25-34, 35-44, 45-54, 55+ |
| `audience_ages_percentage` | NUMERIC | Percentage of followers in that age group |

#### Country
| Field | Type | Description |
|---|---|---|
| `audience_countries_country` | COUNTRY | Country distribution of the account's followers |
| `audience_countries_percentage` | NUMERIC | Percentage of followers from that country |

#### City
| Field | Type | Description |
|---|---|---|
| `audience_cities_city_name` | CITY | City name |
| `audience_cities_percentage` | NUMERIC | Percentage of followers from that city |

#### Activity / Online Hours
| Field | Type | Description |
|---|---|---|
| `audience_activity_hour` | TEXT | Specific hour in the day |
| `audience_activity_count` | NUMERIC | Number of followers online in that hour |

### Video-Level Viewer Demographics (Report: Video)

TikTok is the only platform that provides per-content audience demographics.

#### Gender
| Field | Type | Description |
|---|---|---|
| `video_audience_genders_gender` | TEXT | Gender of video viewers: Female, Male, Other |
| `video_audience_genders_percentage` | PERCENT | Percentage of viewers per gender |

#### Country
| Field | Type | Description |
|---|---|---|
| `video_audience_countries_country` | COUNTRY | Country or region code of video viewers |
| `video_audience_countries_percentage` | PERCENT | Percentage of viewers from that country |
| `video_audience_countries` | OBJECT | **(Deprecated)** Top 10 countries as list of `{country, percentage}` objects |

#### City
| Field | Type | Description |
|---|---|---|
| `video_audience_cities_city_name` | CITY | City name of video viewers |
| `video_audience_cities_percentage` | PERCENT | Percentage of viewers from that city |

#### Audience Type (Follower vs Non-Follower)
| Field | Type | Description |
|---|---|---|
| `video_audience_types_type` | TEXT | One of: NEW_VIEWER, RETURN_VIEWER, FOLLOWER_PERCENT, NON_FOLLOWER_PERCENT |
| `video_audience_types_percentage` | PERCENT | Percentage of viewers per audience type |

---

## Instagram

### Account-Level Follower Demographics (Lifetime)

All Instagram audience demographics are **lifetime** metrics (not daily). They are returned under separate report types that should be queried independently.

#### Age
| Field | Type | Report |Description |
|---|---|---|---|
| `audience_age_name` | TEXT | `user_insights_lifetime_age` | Age group name |
| `audience_age_size` | NUMERIC | `user_insights_lifetime_age` | Number of followers in that age group |

#### Gender
| Field | Type | Report | Description |
|---|---|---|---|
| `audience_gender_name` | TEXT | `user_insights_lifetime_gender` | Gender group name |
| `audience_gender_size` | NUMERIC | `user_insights_lifetime_gender` | Number of followers in that gender group |

#### Gender + Age Combined
| Field | Type | Report | Description |
|---|---|---|---|
| `audience_gender_age_name` | TEXT | `user_insights_lifetime_gender_age` | Combined gender/age group name |
| `audience_gender_age_size` | NUMERIC | `user_insights_lifetime_gender_age` | Number of followers in that gender/age group |

#### Country
| Field | Type | Report | Description |
|---|---|---|---|
| `audience_country_name` | COUNTRY | `user_insights_lifetime_country` | Follower's country code |
| `audience_country_size` | NUMERIC | `user_insights_lifetime_country` | Number of followers from that country |

#### City
| Field | Type | Report | Description |
|---|---|---|---|
| `city` | CITY | `user_insights_lifetime_city` | Follower's city |
| `audience_city_size` | NUMERIC | `user_insights_lifetime_city` | Number of followers from that city |

#### Locale (Deprecated)
| Field | Type | Report | Description |
|---|---|---|---|
| `audience_locale_name` | TEXT | Deprecated | Instagram API no longer supports this |
| `audience_locale_size` | NUMERIC | Deprecated | Instagram API no longer supports this |

### Media-Level Demographics

Instagram does **not** provide per-media (post/reel/story) audience demographic breakdowns. Media insights only include aggregate metrics like reach, engagement, impressions, saves, and shares without viewer demographic splits.

---

## Facebook Page Insights

### Page-Level Fan Demographics (Active)

Facebook fan demographics by city and country are still active. These fields must be used together with `page_fans_likes` (or `page_fans_likes_daily`) and `date` as co-dimensions.

#### Country
| Field | Type | Description |
|---|---|---|
| `page_fans_country` | COUNTRY | Fans broken down by country (use with `page_fans_likes` + `date`) |
| `page_fans_country_name` | COUNTRY | Specific country name from the breakdown |
| `page_fans_country_value` | NUMERIC | Fan count for that country |

#### City
| Field | Type | Description |
|---|---|---|
| `page_fans_city` | CITY | Fans broken down by city (use with `page_fans_likes` + `date`) |
| `page_fans_city_name` | CITY | Specific city name from the breakdown |
| `page_fans_city_value` | NUMERIC | Fan count for that city |

#### Fan Count Dimensions
| Field | Type | Report | Description |
|---|---|---|---|
| `page_fans_likes` | NUMERIC | Page | Fan count broken down by any of the dimension fields above |
| `page_fans_likes_daily` | NUMERIC | Page | Daily version of the above |

### Page-Level Fan Demographics (Deprecated)

These used to provide gender, age, and locale breakdowns but have been deprecated by the Facebook API.

| Field | Type | Description |
|---|---|---|
| `page_fans_age` | TEXT | **(Deprecated)** Fans by age group |
| `page_fans_gender` | TEXT | **(Deprecated)** Fans by gender |
| `page_fans_gender_age` | TEXT | **(Deprecated)** Fans by gender + age |
| `page_fans_locale` | TEXT | **(Deprecated)** Fans by locale |

### Page-Level Click Breakdowns by Demographics (All Deprecated)

All of these click-by-demographic fields have been deprecated by Facebook.

#### Phone Call Clicks
| Field | Description |
|---|---|
| `page_call_phone_clicks_by_age_gender_logged_in_unique` | By age/gender |
| `page_call_phone_clicks_logged_in_by_city_unique` | By city |
| `page_call_phone_clicks_logged_in_by_country_unique` | By country |

#### CTA Button Clicks
| Field | Description |
|---|---|
| `page_cta_clicks_by_age_gender_logged_in_unique` | By age/gender |
| `page_cta_clicks_logged_in_by_city_unique` | By city |
| `page_cta_clicks_logged_in_by_country_unique` | By country |

#### Website Clicks
| Field | Description |
|---|---|
| `page_website_clicks_by_age_gender_logged_in_unique` | By age/gender |
| `page_website_clicks_logged_in_by_city_unique` | By city |
| `page_website_clicks_logged_in_by_country_unique` | By country |

#### Get Directions Clicks
| Field | Description |
|---|---|
| `page_get_directions_clicks_by_age_gender_logged_in_unique` | By age/gender |
| `page_get_directions_clicks_logged_in_by_city_unique` | By city |
| `page_get_directions_clicks_logged_in_by_country_unique` | By country |

#### Check-in Demographics (Deprecated)
| Field | Description |
|---|---|
| `page_places_checkins_by_age_gender` | Check-ins by age/gender |
| `page_places_checkins_by_country` | Check-ins by country |
| `page_places_checkins_by_locale` | Check-ins by locale |

### Post/Video/Reel-Level Demographics

Facebook does **not** provide per-post, per-video, or per-reel audience demographic breakdowns. Post and video insights only include aggregate metrics (impressions, reach, engagement, reactions, clicks). The `targeting` field on posts reflects the audience targeting set by the publisher, not viewer demographics.

---

## Cross-Platform Comparison

### Available Demographic Dimensions

| Dimension | TikTok (Account) | TikTok (Video) | Instagram (Account) | Facebook (Page) |
|---|---|---|---|---|
| **Gender** | `audience_genders_gender` + `%` | `video_audience_genders_gender` + `%` | `audience_gender_name` + size | Deprecated |
| **Age** | `audience_ages_age` + `%` | -- | `audience_age_name` + size | Deprecated |
| **Gender + Age** | -- | -- | `audience_gender_age_name` + size | Deprecated |
| **Country** | `audience_countries_country` + `%` | `video_audience_countries_country` + `%` | `audience_country_name` + size | `page_fans_country_name` + value |
| **City** | `audience_cities_city_name` + `%` | `video_audience_cities_city_name` + `%` | `city` + `audience_city_size` | `page_fans_city_name` + value |
| **Locale** | -- | -- | Deprecated | Deprecated |
| **Activity Hours** | `audience_activity_hour` + count | -- | -- | Deprecated |
| **Audience Type** | -- | `video_audience_types_type` + `%` | -- | -- |

### Key Differences

| Capability | TikTok | Instagram | Facebook |
|---|---|---|---|
| Account-level gender | Yes (%) | Yes (count) | Deprecated |
| Account-level age | Yes (%) | Yes (count) | Deprecated |
| Account-level country | Yes (%) | Yes (count) | Yes (count) |
| Account-level city | Yes (%) | Yes (count) | Yes (count) |
| Per-content viewer demographics | Yes (gender, country, city, audience type) | No | No |
| Follower activity hours | Yes | No | Deprecated |
| Data format | Percentages | Absolute counts | Absolute counts |
| Temporal scope | Daily | Lifetime only | Lifetime (with daily variant for counts) |

### Geographic Granularity

No platform provides state/region-level data. The finest geographic granularity available is **city**.

- **Country**: Available on all three platforms
- **City**: Available on all three platforms
- **State/Region**: Not available on any platform
- **Locale/Language**: Deprecated on both Instagram and Facebook; not available on TikTok

### Data Format Notes

- **TikTok** returns demographic data as **percentages** (0.0 to 1.0 or 0 to 100). Account demographics are daily snapshots. Video demographics are lifetime totals per video.
- **Instagram** returns demographic data as **absolute counts** (number of followers). All audience demographics are lifetime-only and are returned under separate report types (`user_insights_lifetime_age`, `user_insights_lifetime_gender`, etc.).
- **Facebook** returns fan demographics as **absolute counts**. The `page_fans_city`/`page_fans_country` dimension fields must be queried alongside `page_fans_likes` and `date` as co-fields. Gender and age breakdowns have been deprecated.
