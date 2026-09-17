import { createServer } from "node:http";
import { answerOrderQuestion } from "./knowledge_bot.js";

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/order-question") { res.writeHead(404).end(); return; }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const result = await answerOrderQuestion(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    res.writeHead(message.includes("required") ? 500 : 400, { "content-type": "application/json" }).end(JSON.stringify({ error: message }));
  }
});
server.listen(Number(process.env.PORT ?? 3000), () => console.log("order-question listening"));
