import assert from "node:assert/strict";
import { answerOrderQuestion } from "../src/knowledge_bot.js";

const calls: Array<{ path: string; body: Record<string, unknown> }> = [];
const fake = { post: async (path: string, body: Record<string, unknown>) => { calls.push({ path, body }); if (path === "/v1/embeddings") return { data: [{ embedding: [0.1, 0.2] }] }; if (path === "/v1/vector/query") return { items: [{ text: "Packed; carrier scan due today.", metadata: { order_id: "ORD-7" } }] }; return { items: [{ text: "Packed; carrier scan due today." }] }; } };
const result = await answerOrderQuestion({ order_id: "ORD-7", question: "Where is my order?" }, fake);
assert.equal(result.answer, "Packed; carrier scan due today.");
assert.deepEqual(calls.map((call) => call.path), ["/v1/embeddings", "/v1/vector/query", "/v1/ai/rerank"]);
assert.throws(() => answerOrderQuestion({ order_id: "", question: "Hi" }, fake));
console.log("knowledge decision test passed");
