import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  stepCountIs,
  type UIMessage,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { getSystemPrompt } from "@/lib/ai/system-prompt";
import {
  saveMessages,
  createChat,
  getChatById,
  updateChatTitle,
  extractChatTitle,
  deleteMessagesByChatId,
  deleteChat,
} from "@/lib/db/queries";

export const maxDuration = 60;

// MCP client singleton (lazy init)
let mcpClientPromise: ReturnType<typeof createMCPClient> | null = null;

function getMCPClient() {
  if (!mcpClientPromise) {
    const url = process.env.MCP_HTTP_URL ?? "http://localhost:3001/mcp";
    mcpClientPromise = createMCPClient({ transportType: "sse", url });
  }
  return mcpClientPromise;
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

    // System prompt
    const systemPrompt = getSystemPrompt();

    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(messages);

    // Stream response
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        const result = streamText({
          model: anthropic("claude-sonnet-4-20250514"),
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
        // Save assistant messages
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

          // Update title if first response
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("id");

    if (!chatId) {
      return new Response(
        JSON.stringify({ error: "Chat ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await deleteMessagesByChatId(chatId);
    await deleteChat(chatId);

    return Response.json({ success: true });
  } catch (error) {
    console.error("[Chat API] Delete error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete chat" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
