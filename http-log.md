## Request 1 — GET /users/1

### Command

```powershell
curl.exe -i https://jsonplaceholder.typicode.com/users/1

## Request
GET /users/1 HTTP/1.1
Host: jsonplaceholder.typicode.com

## Response

HTTP/1.1 200 OK
Date: Wed, 12 Aug 2026 13:18:51 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 509
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"1fd-+2Y3G3w049iSZtw5t1mzSnunngE"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=NVHMmsJEBkM7qu1GHaCXZTnlunlD5CjSht%2Ff%2FvAFIG4%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1786263775"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=NVHMmsJEBkM7qu1GHaCXZTnlunlD5CjSht%2Ff%2FvAFIG4%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1786263775"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 999
x-ratelimit-reset: 1786263835
Age: 17200
Accept-Ranges: bytes
cf-cache-status: HIT
CF-RAY: a29fc4b67e9f0b19-BOM
alt-svc: h3=":443"; ma=86400
## Response Body
{
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "Sincere@april.biz",
  "address": {
    "street": "Kulas Light",
    "suite": "Apt. 556",
    "city": "Gwenborough",
    "zipcode": "92998-3874",
    "geo": {
      "lat": "-37.3159",
      "lng": "81.1496"
    }
  },
  "phone": "1-770-736-8031 x56442",
  "website": "hildegard.org",
  "company": {
    "name": "Romaguera-Crona",
    "catchPhrase": "Multi-layered client-server neural-net",
    "bs": "harness real-time e-markets"
  }
}
<------------------------------------------------------------------------------------------------------>
Annotation
Status: 200 OK — The server successfully processed the request and returned the requested resource.
Content-Type: application/json; charset=utf-8 — The response body is JSON encoded using UTF-8.
<------------------------------------------------------------------------------------------------------>


## Request 2 — GET /users/5
### command 
curl.exe -i https://jsonplaceholder.typicode.com/users/5

## Request
GET /users/5 HTTP/1.1
Host: jsonplaceholder.typicode.com
## Response 
HTTP/1.1 200 OK
Date: Wed, 12 Aug 2026 13:19:52 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 507
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"1fb-gmS8Go1GsKpTWscwm+5AFpuro+k"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=FjpWASbUPXq9tFs0eIFciiEvK%2BbvLMuLROneiPZZnbE%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1786540792"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=FjpWASbUPXq9tFs0eIFciiEvK%2BbvLMuLROneiPZZnbE%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1786540792"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 999
x-ratelimit-reset: 1786540795
Accept-Ranges: bytes
cf-cache-status: MISS
CF-RAY: a29fc62d7d5a8ee9-BOM
alt-svc: h3=":443"; ma=86400
## Response Body
{
  "id": 5,
  "name": "Chelsey Dietrich",
  "username": "Kamren",
  "email": "Lucio_Hettinger@annie.ca",
  "address": {
    "street": "Skiles Walks",
    "suite": "Suite 351",
    "city": "Roscoeview",
    "zipcode": "33263",
    "geo": {
      "lat": "-31.8129",
      "lng": "62.5342"
    }
  },
  "phone": "(254)954-1289",
  "website": "demarco.info",
  "company": {
    "name": "Keebler LLC",
    "catchPhrase": "User-centric fault-tolerant solution",
    "bs": "revolutionize end-to-end systems"
  }
}
<---------------------------------------------------------------------------------------------->
Annotation
Status: 200 OK — The requested user resource was found and successfully returned.
Content-Type: application/json; charset=utf-8 — The response body is JSON encoded using UTF-8.
<---------------------------------------------------------------------------------------------->

## Request 3 - GET /posts/
### command
curl.exe -i https://jsonplaceholder.typicode.com/posts/1

## Request
GET /posts/1 HTTP/1.1
Host: jsonplaceholder.typicode.com
## response 

HTTP/1.1 200 OK
Date: Wed, 12 Aug 2026 13:20:42 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 292
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"124-yiKdLzqO5gfBrJFrcdJ8Yq0LGnU"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=vm67FVLNHsCgrFgubRa04ooDeMKdgwXS9H3i2IbjuoY%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1785194657"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=vm67FVLNHsCgrFgubRa04ooDeMKdgwXS9H3i2IbjuoY%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1785194657"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 999
x-ratelimit-reset: 1785194663
Age: 9941
Accept-Ranges: bytes
cf-cache-status: HIT
CF-RAY: a29fc76728cac617-BOM
alt-svc: h3=":443"; ma=86400
## response Body
{
  "userId": 1,
  "id": 1,
  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
  "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
}
<---------------------------------------------------------------------------------------------->
Annotation
Status: 200 OK — The requested post was successfully found and returned.
Content-Type: application/json; charset=utf-8 — The response body is JSON encoded using UTF-8.
<---------------------------------------------------------------------------------------------->

## Request 4 — GET /comments/1
### command 
 curl.exe -i https://jsonplaceholder.typicode.com/comments/1
## response 
HTTP/1.1 200 OK
Date: Wed, 12 Aug 2026 13:21:38 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 268
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"10c-KJ4I9RM/+33TKdV8CFsIvqsDSP0"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=VsWfxpzBW0%2ByMh49FEzleZfrYHCfvsOxoDAqMtG1oRM%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1786511854"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=VsWfxpzBW0%2ByMh49FEzleZfrYHCfvsOxoDAqMtG1oRM%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1786511854"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 999
x-ratelimit-reset: 1786511875
Accept-Ranges: bytes
cf-cache-status: REVALIDATED
CF-RAY: a29fc8c2581cdce3-BOM
alt-svc: h3=":443"; ma=86400
## Response Body
{
  "postId": 1,
  "id": 1,
  "name": "id labore ex et quam laborum",
  "email": "Eliseo@gardner.biz",
  "body": "laudantium enim quasi est quidem magnam voluptate ipsam eos\ntempora quo necessitatibus\ndolor quam autem quasi\nreiciendis et nam sapiente accusantium"
}
<-------------------------------------------------------------------------------------------->
Annotation
Status: 200 OK — The requested comment was successfully found and returned.
Content-Type: application/json; charset=utf-8 — The response body is JSON encoded using UTF-8.
<-------------------------------------------------------------------------------------------->

##Request 5 — GET /posts/9999 — Deliberate 404
### command 
curl.exe -i https://jsonplaceholder.typicode.com/posts/9999
## Response 
HTTP/1.1 404 Not Found
Date: Wed, 12 Aug 2026 13:22:13 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 2
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"2-vyGp6PvFo4RvsFtPoIWeCReyIC8"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=WwhypyQt45Q8TKii%2B9wODdY46f8vL28MJ%2B%2F4%2Bp25wZs%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1786530196"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=WwhypyQt45Q8TKii%2B9wODdY46f8vL28MJ%2B%2F4%2Bp25wZs%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1786530196"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 995
x-ratelimit-reset: 1786530235
Age: 10736
cf-cache-status: HIT
CF-RAY: a29fc99ffa92e5cc-BOM
alt-svc: h3=":443"; ma=86400
## Response Body
{}
-------------------------------------------------------------------------------------------->
Annotation
Status: 404 Not Found — The requested resource /posts/9999 does not exist.
Content-Type: application/json; charset=utf-8 — The response body is JSON encoded using UTF-8.
Body {} — The server returned an empty JSON object for the nonexistent post.
<-------------------------------------------------------------------------------------------->
