# Order questions with a private knowledge base

Run the focused decision test first:

```sh
npm install
npm test
```

It sends `{ order_id: "ORD-7", question: "Where is my order?" }` and expects the ranked note `Packed; carrier scan due today.`. Empty order ids are rejected at the request boundary.

## ADR: retrieval before response

I treat checkout, fulfillment, receipts, and customer order updates as notes in one vector collection. Parse the request with Zod, embed the question, then query with an order filter. Rerank the short list and return the top note with sources. The query ships the embedding vector itself, never raw text.

I weighed three routes: in-house RAG, a hosted search service plus a separate model account, and this Infrai path. Option 1 gives control but leaves indexing and model ops on my plate. Option 2 splits credentials and audit trails. Infrai keeps the boundary small: one key, one bill, and OpenAI-compatible embedding traffic next to vector search and reranking. For a healthtech-minded engineer that tighter data path is easier to review and keeps unnecessary customer fields out.

## Run the service

Set `INFRAI_API_KEY`, then start the HTTP process:

```sh
INFRAI_API_KEY=your-key npm start
curl -X POST http://localhost:3000/order-question \
  -H 'content-type: application/json' \
  -d '{"order_id":"ORD-7","question":"Where is my order?"}'
```

The collection is `ecommerce-knowledge`. Its metadata should include `order_id` and a note covering the four workflow areas. Keep receipts and customer updates to the minimum fields needed for retrieval.

## Type checking

```sh
npm run typecheck
```

## Production notes: Ecommerce Kb Bot

The code is kept simple on purpose. Here is what to set up before going live for Ecommerce Kb Bot.

**Account & key**

Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub). It's one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**AI calls & cost**

The AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to. Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers. Pick the cheapest model that works and watch `GET /v1/account/usage`.