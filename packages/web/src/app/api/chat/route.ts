import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  stepCountIs,
  type UIMessage,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { createMCPClient } from "@ai-sdk/mcp";
import { getSystemPrompt } from "@/lib/ai/system-prompt";
import { WALLET_ADDRESS_HEADER } from "@/lib/wallet/constants";
import {
  saveMessages,
  createChat,
  getChatById,
  updateChatTitle,
  extractChatTitle,
} from "@/lib/db/queries";

export const maxDuration = 60;

// MCP client — fresh per request, closed after response
async function getMCPClient() {
  const url = process.env.MCP_HTTP_URL ?? "http://localhost:3001/mcp";
  return createMCPClient({
    transport: { type: "http", url },
  });
}

function generateUUID(): string {
  return crypto.randomUUID();
}

export async function POST(request: Request) {
  try {
    const {
      messages,
      id: chatId,
    }: {
      messages: UIMessage[];
      id: string;
    } = await request.json();

    // Read connected wallet address from request header
    const walletAddress =
      request.headers.get(WALLET_ADDRESS_HEADER) || undefined;

    // Create chat if it doesn't exist
    const existingChat = await getChatById(chatId);
    if (!existingChat) {
      const firstUserMessage = messages.find((m) => m.role === "user");
      const firstPart = firstUserMessage?.parts?.[0];
      const messageText =
        firstPart && "text" in firstPart ? firstPart.text : "New Chat";
      const title = extractChatTitle(messageText);

      await createChat({
        id: chatId,
        title,
        createdAt: new Date(),
      });
    }

    // Save user message
    const userMessage = messages[messages.length - 1];
    if (userMessage?.role === "user") {
      await saveMessages({
        chatId,
        messages: [
          {
            id: userMessage.id,
            role: "user",
            parts: userMessage.parts,
          },
        ],
      });
    }

    // Get MCP tools from the kwala MCP server
    const mcpClient = await getMCPClient();
    const mcpTools = await mcpClient.tools();

    // System prompt (includes wallet address when connected)
    const systemPrompt = getSystemPrompt({ walletAddress });

    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(messages);

    // Stream response
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        // Support both Anthropic and OpenAI — set OPENAI_API_KEY or ANTHROPIC_API_KEY
        const model = process.env.OPENAI_API_KEY
          ? openai(process.env.OPENAI_MODEL ?? "gpt-4o")
          : anthropic(process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514");

        const result = streamText({
          model,
          system: systemPrompt,
          messages: modelMessages,
          tools: mcpTools,
          toolChoice: "auto",
          stopWhen: stepCountIs(10),
        });

        result.consumeStream();
        writer.merge(result.toUIMessageStream());
      },
      generateId: generateUUID,
      onFinish: async ({ messages: responseMessages }) => {
        await mcpClient.close();

        const assistantMessages = responseMessages.filter(
          (m) => m.role === "assistant"
        );

        if (assistantMessages.length > 0) {
          await saveMessages({
            chatId,
            messages: assistantMessages.map((msg) => ({
              id: msg.id,
              role: msg.role,
              parts: msg.parts,
            })),
          });

          if (!existingChat) {
            const firstUserMessage = messages.find((m) => m.role === "user");
            const firstPart = firstUserMessage?.parts?.[0];
            const messageText =
              firstPart && "text" in firstPart ? firstPart.text : "";
            if (messageText) {
              await updateChatTitle(chatId, extractChatTitle(messageText));
            }
          }
        }
      },
      onError: (error) => {
        mcpClient.close().catch(() => {});
        console.error("[Chat API] Stream error:", error);
        return "An error occurred while processing your request.";
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE is handled by /api/chat/[id]/route.ts
