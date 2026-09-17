import { NextResponse } from "next/server";
import { listChats } from "@/lib/messages";

export async function GET() {
  try {
    const chats = await listChats();
    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Failed to fetch chats:", error);
    return NextResponse.json({ error: "Failed to fetch chats." }, { status: 500 });
  }
}
