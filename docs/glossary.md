# Glossary

**Latency**
The time between asking for something and getting the answer. In the store: the time from typing "duck" to seeing
results. You can feel it with Dev tools → Slow (2 s). Debouncing and caching cut how often the user has to wait for it.

**Idempotency**
Doing the same operation twice has the same effect as doing it once. In the store: `POST /api/orders` with the same
`Idempotency-Key` returns the first order instead of creating a second one, so a double click or a retry after a timeout
can't charge the shopper twice. (`GET` requests are idempotent by nature; `POST` is not unless we design it to be.)

**Horizontal scaling**
Handling more load by adding more machines rather than a bigger one (vertical scaling). In the store: during a
duck sale, run five copies of the order service behind a load balancer and add more email workers to drain the queue.
It works best when servers are stateless, which is why session state is in a token and orders are in a shared database.

**CDN (Content Delivery Network)**
Servers around the world that keep copies of static files close to users. In the store: the built JavaScript, CSS and
product SVGs are static, so GitHub Pages serves them from its CDN. A shopper in Lahore downloads them from a nearby
edge server, not from one origin far away. Hashed file names (`index-HhxZ.js`) let them be cached for a long time.

**Cache invalidation**
Deciding when a cached copy is no longer true and must be thrown away or refetched. In the store: product data is cached
for five minutes, but placing an order invalidates the `Product` tags for the items bought, so their stock is refetched
right away. Live stock messages also replace cached stock without refetching.

**Eventual consistency**
Different parts of a system may disagree for a short time, but they all reach the same answer if you wait. In the store:
after you buy the last Night-Owl Duck, another shopper's catalog may show "1 left" for a moment until the live stock
message or the next fetch arrives. That's acceptable because checkout re-checks stock on the server and answers 409.
The order status moving `queued → processing → confirmed` is the same idea.
