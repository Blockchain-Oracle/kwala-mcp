import { getMessagesByChatId } from "@/lib/db/queries";
import { deleteMessagesByChatId, deleteChat } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messages = await getMessagesByChatId(id);

    // Convert stored messages to UIMessage format
    const uiMessages = messages.map((m) => ({
      id: m.id,
      role: m.role,
      parts: JSON.parse(m.parts),
    }));

    return Response.json(uiMessages);
  } catch (error) {
    console.error("[Chat Messages API] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch messages" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteMessagesByChatId(id);
    await deleteChat(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("[Chat Delete API] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete chat" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
