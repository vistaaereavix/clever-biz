import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export const chatOpenAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messages: ChatMessage[]; model?: string }) => {
    if (!input || !Array.isArray(input.messages)) throw new Error("messages inválido");
    return input;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY não configurada");

    const systemMsg: ChatMessage = {
      role: "system",
      content:
        "Você é um assistente de IA integrado a um sistema ERP brasileiro (clientes, fornecedores, produtos, serviços, orçamentos e notas fiscais). Responda em português do Brasil, de forma clara e objetiva, usando markdown quando ajudar na leitura.",
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: data.model || "gpt-4o-mini",
        messages: [systemMsg, ...data.messages],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI ${res.status}: ${err.slice(0, 300)}`);
    }
    const json = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    return { content: json.choices?.[0]?.message?.content ?? "" };
  });