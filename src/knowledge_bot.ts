import { z } from "zod";
import { InfraiClient } from "./infrai_client.js";

export const Question = z.object({ order_id: z.string().min(1), question: z.string().min(3) });
export type QuestionInput = z.infer<typeof Question>;
type Hit = { text: string; score?: number; metadata?: Record<string, unknown> };
type PostClient = { post: (path: string, body: Record<string, unknown>) => Promise<unknown> };

export function answerOrderQuestion(input: unknown, client: PostClient = new InfraiClient()): Promise<{ answer: string; sources: Hit[] }> {
  const request = Question.parse(input);
  const post = client.post.bind(client) as <T>(path: string, body: Record<string, unknown>) => Promise<T>;
  return (async () => {
    const embedding = await post<{ data: Array<{ embedding: number[] }> }>("/v1/embeddings", { input: request.question, model: "auto" });
    const vector = embedding.data[0]?.embedding;
    if (!vector) throw new Error("Embedding response was empty");
    const result = await post<{ items: Hit[] }>("/v1/vector/query", { collection: "ecommerce-knowledge", embedding: vector, top_k: 8, filter: { order_id: request.order_id }, include_metadata: true });
    const candidates = result.items.map((hit) => hit.text);
    const ranked = candidates.length ? await post<{ items: Array<{ text: string }> }>("/v1/ai/rerank", { query: request.question, candidates, top_k: 3, model: "auto", vendor: "auto" }) : { items: [] };
    const answer = ranked.items[0]?.text ?? "No verified order note matched this question.";
    return { answer, sources: result.items.slice(0, 3) };
  })();
}
