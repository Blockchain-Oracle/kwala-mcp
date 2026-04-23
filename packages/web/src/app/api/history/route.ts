import { getRecentChats } from "@/lib/db/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "50");

    const chats = await getRecentChats(limit);

    return Response.json({
      chats: chats.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt.toISOString(),
      })),
      hasMore: false,
      nextCursor: null,
    });
  } catch (error) {
    console.error("[History API] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch history" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
