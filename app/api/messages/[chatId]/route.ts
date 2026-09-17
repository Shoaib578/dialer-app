import { NextResponse } from "next/server";
import { listMessagesForChat } from "@/lib/messages";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/messages/[chatId]">
) {
  const { chatId } = await ctx.params;
  const id = Number(chatId);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid chat id." }, { status: 400 });
  }

  try {
    const messages = await listMessagesForChat(id);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages." }, { status: 500 });
  }
}
