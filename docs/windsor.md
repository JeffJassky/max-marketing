# **Windsor.ai Connectors API Documentation**

# **Overview**

Windsor.ai Connectors provide a unified API to access data from over 300 marketing, analytics, and business platforms. This documentation will guide you through the process of using our API to retrieve data from various sources.

# **Getting Started**

# **Authentication**

All API requests require an API key for authentication. You can obtain your API key from your [Windsor.ai account](https://onboard.windsor.ai/app/data-preview). Please, keep in mind that your API key can’t be changed at the moment.

Include your API key in all requests using the `api_key` parameter:

```
⧉ Copyhttps://connectors.windsor.ai/{connector}?api_key=your_api_key_here&fields=date,spend
```

# **Base URL**

The base URL for all API requests is:

```
⧉ Copyhttps://connectors.windsor.ai
```

# **Making API Requests**

# **Basic Request Structure**

A basic API request follows this format:

```
⧉ Copyhttps://connectors.windsor.ai/{connector}?fields={field1,field2,...}&api_key={your_api_key}
```

Where:

- `{connector}` is the name of the data source (e.g., facebook, googleanalytics4, linkedin)
- `{field1,field2,...}` is a comma-separated list of fields you want to retrieve
- `{your_api_key}` is your Windsor.ai API key

# **Required Parameters**

Every API request must include these parameters:

| Parameter | Description |
| --- | --- |
| `api_key` | Your Windsor.ai API key |
| `fields` | Comma-separated list of fields to retrieve |

# **Optional Parameters**

You can customize your data request with these optional parameters:

| Parameter | Description | Example |
| --- | --- | --- |
| `date_preset` | Predefined date range | `last_7d`, `last_30d`, `last_90d`, `last_month`, `last_year` |
| `date_from` | Start date (YYYY-MM-DD) | `2023-01-01` |
| `date_to` | End date (YYYY-MM-DD) | `2023-01-31` |
| `sort` | Field to sort by | `date` |
| `order` | Sort order | `asc` or `desc` |
| `limit` | Maximum number of records to return | `100` |
| `offset` | Number of records to skip | `0` |
| `filter` | Filter expression | `campaign eq "Summer Sale"` |
| `date_aggregation` | Group results by time period | `day`, `week`, `month`, `year` |

# **Making API Requests – Code Examples**

**Python**

```
⧉ Copyimport requests

API_KEY = "your_api_key_here"
connector = "facebook"
fields = "date,campaign,spend,impressions,clicks"

url = f"https://connectors.windsor.ai/{connector}?api_key={API_KEY}&fields={fields}"

response = requests.get(url)
print(response.json())
```

**Javascript**

```
⧉ Copyconst API_KEY = "your_api_key_here";
const connector = "facebook";
const fields = "date,campaign,spend,impressions,clicks";

const url = `https://connectors.windsor.ai/${connector}?api_key=${API_KEY}&fields=${fields}`;

fetch(url)
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error("API error:", err));
```

# **Date Filtering**

You can specify date ranges in two ways:

1. Using `date_preset`:
    
    ```
    ⧉ Copyhttps://connectors.windsor.ai/facebook?fields=date,spend&date_preset=last_30d
    ```
    
2. Using `date_from` and `date_to`:
    
    ```
    ⧉ Copyhttps://connectors.windsor.ai/facebook?fields=date,spend&date_from=2023-01-01&date_to=2023-01-31&api_key={your_api_key}
    ```
    

Available date presets:

- `today`
- `yesterday`
- `last_7d` (Last 7 days)
- `last_30d` (Last 30 days)
- `last_90d` (Last 90 days)
- `last_month` (Previous calendar month)
- `last_year` (Previous calendar year)

# **Data Filtering**

Filters use a **JSON array format** for readability and grouping.

- Each condition is a list: `[field, operator, value]`
- Combine conditions with `"and"` / `"or"`
- Nest lists to group conditions

# **Supported operators**

| Operator | Description | Example |
| --- | --- | --- |
| eq | Equals | `["campaign", "eq", "Summer Sale"]` |
| neq | Not equals | `["campaign", "neq", "Winter Sale"]` |
| gt | Greater than | `["spend", "gt", 100]` |
| gte | Greater or equal | `["spend", "gte", 100]` |
| lt | Less than | `["spend", "lt", 100]` |
| lte | Less or equal | `["spend", "lte", 100]` |
| contains | Contains substring | `["campaign", "contains", "Sale"]` |
| ncontains | Does not contain substring | `["campaign", "ncontains", "Test"]` |
| null | Field is null | `["clicks", "null", null]` |
| notnull | Field is not null | `["clicks", "notnull", null]` |

# **Examples**

> ⚠️ Note: For actual API requests, URL-encode the filter parameter. The examples below are shown in plain JSON for readability.
> 
- **Single filter:**

```
⧉ Copyhttps://connectors.windsor.ai/facebook?fields=date,campaign,spend&filter=[["campaign","eq","Summer Sale"]]&api_key={your_api_key}
```

- **Check for null values:**

```
⧉ Copyhttps://connectors.windsor.ai/facebook?fields=date,campaign,clicks&filter=[["clicks","null",null]]&api_key={your_api_key}
```

- **Multiple conditions (AND):**

```
⧉ Copyhttps://connectors.windsor.ai/facebook?fields=date,spend&filter=[["spend","gt",100],"and",["campaign","contains","Sale"]]&api_key={your_api_key}
```

- **Nested groups (AND + OR):**

```
⧉ Copyhttps://connectors.windsor.ai/facebook?fields=date,campaign,spend&filter=[[["campaign","eq","foobar"],"or",["spend","eq",10]],"and",["campaign","eq","abc (us)"]]&api_key={your_api_key}
```

# **Code Examples**

**Python**

```
⧉ Copyimport requests
import json

api_key = "your_api_key_here"
connector = "facebook"
fields = "date,campaign,spend"

# Use json.dumps to convert the filter array to JSON string
filter_query = json.dumps([["spend","gt",100],"and",["campaign","contains","Sale"]])

url = f"https://connectors.windsor.ai/{connector}?api_key={api_key}&fields={fields}&filter={filter_query}"
response = requests.get(url)
print(response.json())
```

**Javascript**

```
⧉ Copyconst apiKey = "your_api_key_here";
const connector = "facebook";
const fields = "date,campaign,spend";

// Convert the filter array to JSON string
const filterQuery = JSON.stringify([["spend","gt",100],"and",["campaign","contains","Sale"]]);

const url = `https://connectors.windsor.ai/${connector}?api_key=${apiKey}&fields=${fields}&filter=${filterQuery}`;

fetch(url)
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error("API error:", err));
```

# **Data Aggregation**

You can aggregate data by time using the `date_aggregation` parameter:

```
⧉ Copyhttps://connectors.windsor.ai/facebook?fields=date,spend&date_aggregation=month&api_key={your_api_key}
```

Available aggregation periods:

- `day` (default)
- `week`
- `month`
- `year`

# **Discovering Available Connectors and Fields**

# **Listing All Connectors**

You can get a list of all available connectors by making a request to:

```
⧉ Copyhttps://connectors.windsor.ai/list_connectors
```

This endpoint returns a JSON array of all connectors that are available through the Windsor.ai API.

# **Retrieving Available Fields**

To see what fields are available for a specific connector, use:

```
⧉ Copyhttps://connectors.windsor.ai/{connector}/fields
```

For example, to get all available fields for Facebook:

```
⧉ Copyhttps://connectors.windsor.ai/facebook/fields
```

When authenticated with your API key, this endpoint will also return any custom fields that have been configured for your account:

```
⧉ Copyhttps://connectors.windsor.ai/facebook/fields?api_key={your_api_key}
```

The response includes detailed information about each field, including:

- Field ID (used in API requests)
- Field name (human-readable name)
- Field type (TEXT, NUMERIC, DATE, etc.)
- Field description

This information is essential for constructing effective API queries and understanding the data structure of each connector.

# **Supported Connectors**

Windsor.ai supports over 300 connectors, including:

- **Social Media:** Facebook, Instagram, LinkedIn, Twitter, TikTok, Snapchat, Pinterest
- **Search & Display:** Google Ads, Microsoft Bing, Google Search Ads, DV360, CM360
- **Analytics:** Google Analytics 4, Adobe Analytics, Mixpanel, Amplitude
- **CRM & Marketing:** Salesforce, HubSpot, Marketo, Mailchimp
- **E-commerce:** Shopify, WooCommerce, Amazon, Stripe
- And many more…

For a complete list of connectors and their specific fields, please refer to our [Connectors Directory](https://windsor.ai/data-field/facebook/).

# **Field Types**

Fields returned by the API can have the following types:

| Type | Description | Example |
| --- | --- | --- |
| `TEXT` | Text values | Campaign names, ad titles |
| `NUMERIC` | Numeric values | Spend, impressions, clicks |
| `TIMESTAMP` | Date and time values | Date field |
| `DATE` | Date values | Date field |
| `BOOLEAN` | Boolean values | True/false flags |
| `OBJECT` | Complex objects | JSON structures |

# **Response Format**

API responses are returned in JSON format:

```json
⧉ Copy{
  "data": [
    {
      "date": "2023-01-01",
      "spend": 125.45,
      "impressions": 10234,
      "clicks": 342
    },
    {
      "date": "2023-01-02",
      "spend": 134.67,
      "impressions": 11456,
      "clicks": 389
    }
  ],
  "meta": {
    "total_count": 31,
    "returned_count": 2
  }
}
```

# **Error Handling**

When an error occurs, the API will return an appropriate HTTP status code and a JSON response with error details:

```json
⧉ Copy{
  "error": {
    "code": "authentication_error",
    "message": "Invalid API key provided"
  }
}
```

Common error codes:

| HTTP Status | Error Code | Description |
| --- | --- | --- |
| 400 | `invalid_request` | The request is malformed or missing required parameters |
| 401 | `authentication_error` | Invalid API key or authentication credentials |
| 403 | `permission_denied` | The API key doesn’t have permission to access the requested resource |
| 404 | `not_found` | The requested connector or resource doesn’t exist |
| 429 | `rate_limit_exceeded` | Too many requests in a given amount of time |
| 500 | `server_error` | An unexpected server error occurred |

# **Rate Limits**

API requests are subject to rate limits to ensure fair usage. The current rate limits are:

- 600 requests per minute
- 10,000 requests per day

If you exceed these limits, you’ll receive a 429 status code. The response will include headers indicating your remaining quota and when it will reset.

# **Renderers**

The `_renderer` parameter specifies the format of the data returned by the Windsor.ai API. Available options include:

- **JSON**: returns data in JSON format, ideal for web applications and integrations.
    
    ```
    ⧉ Copyhttps://connectors.windsor.ai/googleanalytics4?api_key=your_api_key&fields=date,spend&_renderer=json
    ```
    
- **CSV**: returns data in CSV format, suitable for spreadsheets and data analysis.
    
    ```
    ⧉ Copyhttps://connectors.windsor.ai/googleanalytics4?api_key=your_api_key&fields=date,spend&_renderer=csv
    ```
    
- **Google Sheets**: directly imports data into Google Sheets.
    
    ```
    ⧉ Copyhttps://connectors.windsor.ai/googleanalytics4?api_key=your_api_key&fields=date,spend&_renderer=googlesheets
    ```
    

**Default:** If no `_renderer` is specified, the API returns JSON format by default.

# **Example Use Cases**

# **Retrieving Campaign Performance**

```
⧉ Copyhttps://connectors.windsor.ai/facebook?fields=date,campaign,spend,impressions,clicks&date_preset=last_30d&api_key={your_api_key}
```

# **Comparing Multiple Platforms**

```
⧉ Copyhttps://connectors.windsor.ai/all?fields=date,source,spend,impressions,clicks&date_preset=last_30d&api_key={your_api_key}
```

# **Getting E-commerce Conversion Data**

```
⧉ Copyhttps://connectors.windsor.ai/googleanalytics4?fields=date,campaign,transactions,revenue&date_preset=last_30d&api_key={your_api_key}
```

# **Best Practices**

1. Request only needed fields
2. Use date presets when possible
3. Implement caching
4. Handle pagination with `limit` + `offset`
5. Always handle errors with care
- 

# **User Agent**

When making API requests to Windsor.ai connectors, the system identifies itself using the following user agent:

```
⧉ CopyWindsor/1.0
```

This user agent is automatically included in all API requests made through our official SDKs and libraries. If you’re building custom integrations or directly interacting with our API, we recommend including this user agent in your requests for better tracking and support.

# **Support**

If you encounter any issues or have questions about using our API, please contact our support team at [support@windsor.ai](mailto:support@windsor.ai) or visit our [Help Center](https://support.windsor.ai/).

# **Changelog**

# **2025-04-02**

- Added information about different renderers

# **2025-03-18**

- Added information about user agent

# **2025-03-17**

- Initial API documentation release