PS C:\Users\hp5cd> cd cs543



//First request
PS C:\Users\hp5cd\cs543> curl.exe -i https://jsonplaceholder.typicode.com/users/1
HTTP/1.1 200 OK
Date: Sun, 16 Aug 2026 09:33:39 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 509
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"1fd-+2Y3G3w049iSZtw5t1mzSnunngE"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=2zdKTr9VSfmctvojKLSbD4JyFeW06hb2VUxynVKj1R4%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1786754565"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=2zdKTr9VSfmctvojKLSbD4JyFeW06hb2VUxynVKj1R4%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1786754565"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 999
x-ratelimit-reset: 1786754590
Age: 2858
Accept-Ranges: bytes
cf-cache-status: HIT
CF-RAY: a2bf7054d883d4bc-BOM
alt-svc: h3=":443"; ma=86400

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

//Explaination for first request
Status Code:
200 OK
Meaning:
Request successful.
Content-Type:
application/json
Meaning:
Server returned JSON data.






//Second request
PS C:\Users\hp5cd\cs543> curl.exe -i https://jsonplaceholder.typicode.com/users/2
HTTP/1.1 200 OK
Date: Sun, 16 Aug 2026 09:35:22 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 509
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"1fd-XTG63SYhaP/Uo6/vgmARnL3rpBk"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=z9GIac45CJ67HGWNia17l%2Blytj3uxzPrFKduQqLCzMk%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1786786623"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=z9GIac45CJ67HGWNia17l%2Blytj3uxzPrFKduQqLCzMk%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1786786623"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 912
x-ratelimit-reset: 1786786663
Age: 17673
Accept-Ranges: bytes
cf-cache-status: HIT
CF-RAY: a2bf72d43d213d6c-BOM
alt-svc: h3=":443"; ma=86400

{
  "id": 2,
  "name": "Ervin Howell",
  "username": "Antonette",
  "email": "Shanna@melissa.tv",
  "address": {
    "street": "Victor Plains",
    "suite": "Suite 879",
    "city": "Wisokyburgh",
    "zipcode": "90566-7771",
    "geo": {
      "lat": "-43.9509",
      "lng": "-34.4618"
    }
  },
  "phone": "010-692-6593 x09125",
  "website": "anastasia.net",
  "company": {
    "name": "Deckow-Crist",
    "catchPhrase": "Proactive didactic contingency",
    "bs": "synergize scalable supply-chains"
  }
}
PS C:\Users\hp5cd\cs543> curl.exe -i https://jsonplaceholder.typicode.com/posts/1
HTTP/1.1 200 OK
Date: Sun, 16 Aug 2026 09:36:23 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 292
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"124-yiKdLzqO5gfBrJFrcdJ8Yq0LGnU"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=wHOimZOPbHhs1%2F1SIPq1hvn9o4G1USYXx6VKUbL%2BIDI%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1785194658"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=wHOimZOPbHhs1%2F1SIPq1hvn9o4G1USYXx6VKUbL%2BIDI%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1785194658"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 999
x-ratelimit-reset: 1785194663
Age: 25585
Accept-Ranges: bytes
cf-cache-status: HIT
CF-RAY: a2bf7451b8362e70-BOM
alt-svc: h3=":443"; ma=86400

{
  "userId": 1,
  "id": 1,
  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
  "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
}

//Explaination for second request
200 OK = Resource found successfully.
application/json = JSON response.






//Third request
PS C:\Users\hp5cd\cs543> curl.exe -i https://jsonplaceholder.typicode.com/comments/1
HTTP/1.1 200 OK
Date: Sun, 16 Aug 2026 09:37:20 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 268
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"10c-KJ4I9RM/+33TKdV8CFsIvqsDSP0"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=UYtIK9z5A8nB0fIcy%2F%2Bud%2FT91RTj2VkpOLXSnn5KiFw%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1786867664"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=UYtIK9z5A8nB0fIcy%2F%2Bud%2FT91RTj2VkpOLXSnn5KiFw%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1786867664"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 999
x-ratelimit-reset: 1786867722
Age: 5375
Accept-Ranges: bytes
cf-cache-status: HIT
CF-RAY: a2bf75b4089a2ddf-BOM
alt-svc: h3=":443"; ma=86400

{
  "postId": 1,
  "id": 1,
  "name": "id labore ex et quam laborum",
  "email": "Eliseo@gardner.biz",
  "body": "laudantium enim quasi est quidem magnam voluptate ipsam eos\ntempora quo necessitatibus\ndolor quam autem quasi\nreiciendis et nam sapiente accusantium"
}





//Fourth request
PS C:\Users\hp5cd\cs543> curl.exe -i https://jsonplaceholder.typicode.com/albums/1
HTTP/1.1 200 OK
Date: Sun, 16 Aug 2026 09:37:59 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 64
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"40-74G1+b66MteeTYAz6G+NybtDGFA"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=f8weDUDZjLeMjOQp%2FE6wmwCnoeHSeVctLVxa6z9m45o%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1785412055"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=f8weDUDZjLeMjOQp%2FE6wmwCnoeHSeVctLVxa6z9m45o%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1785412055"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 999
x-ratelimit-reset: 1785412056
Age: 24340
Accept-Ranges: bytes
cf-cache-status: HIT
CF-RAY: a2bf76a93ed1afda-BOM
alt-svc: h3=":443"; ma=86400

{
  "userId": 1,
  "id": 1,
  "title": "quidem molestiae enim"
}





//Fifth request
PS C:\Users\hp5cd\cs543> curl.exe -i https://jsonplaceholder.typicode.com/posts/9999
HTTP/1.1 404 Not Found
Date: Sun, 16 Aug 2026 09:39:17 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 2
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"2-vyGp6PvFo4RvsFtPoIWeCReyIC8"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=gGwszFOivAA8B%2B52oifa9KVx6gR4zONJ0e7KXJa24ig%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1786873157"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=gGwszFOivAA8B%2B52oifa9KVx6gR4zONJ0e7KXJa24ig%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1786873157"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 999
x-ratelimit-reset: 1786873182
cf-cache-status: EXPIRED
CF-RAY: a2bf788d8f96a9ef-BOM
alt-svc: h3=":443"; ma=86400
{}

//Explaination for fifth request
404 Not Found
Meaning:
The requested resource does not exist on the server.

