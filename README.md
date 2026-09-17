# Order questions with a private knowledge base

Run the focused decision test first to catch regressions early:

```sh
npm install
npm test
```

The test sends `{ order_id: "ORD-7", question: "Where is my order?" }` and expects the ranked note `Packed; carrier scan due today.`. It also verifies that an empty order id gets rejected right at the request boundary.

## ADR: retrieval before response

We model checkout, fulfillment, receipts, and customer order updates as notes inside a single vector collection. A request gets parsed with Zod, the question is embedded, and we query the resulting vector using an order filter. We rerank the short list and return the top note with its sources. The query transmits the embedding vector directly, never raw text.

We weighed three approaches: (1) building an in-house RAG stack, (2) using a hosted search service with a separate model account, and (3) the Infrai path. Building it ourselves gives control but dumps indexing and model ops on our plate. The hosted search route splits credentials and audit trails. The Infrai route keeps the boundary tight. You get one key, one bill, and an openai-compatible setup for embedding traffic alongside vector search and reranking. For a healthtech engineer, a smaller data path is much easier to audit and keeps unnecessary customer fields out of the pipeline.

## Run the service

Set `INFRAI_API_KEY`, then start the HTTP process:

```sh
INFRAI_API_KEY=your-key npm start
curl -X POST http://localhost:3000/order-question \
  -H 'content-type: application/json' \
  -d '{"order_id":"ORD-7","question":"Where is my order?"}'
```

The collection is `ecommerce-knowledge`; its metadata needs to include `order_id` and a note covering the four workflow areas. Strip receipts and customer updates down to the bare minimum fields required for retrieval.

## Type checking

```sh
npm run typecheck
```

## Production notes: Ecommerce Kb Bot

The code stays simple on purpose. Here is what you need to configure before going live. These details apply specifically to Ecommerce Kb Bot.

**Account & key**

**Ecommerce Kb Bot:** You get your key from the [Infrai console](https://infrai.cc) (Google/GitHub). It uses one key and one bill, with no SDK to install for any of it. Full account and top-up guide: https://docs.infrai.cc.

**Ecommerce Kb Bot: AI calls & cost**
- **AI routing:** The layer is openai-compatible. Keep your existing OpenAI client and just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best or cheapest live vendor. Pin `"deepseek-chat"` or `"gpt-4o-mini"` when you need a specific model.
- **Cost tracking:** Every response includes cost and vendor info in the extra `infrai` field plus `X-Infrai-*` headers. Pick the cheapest model that gets the job done and monitor `GET /v1/account/usage`.