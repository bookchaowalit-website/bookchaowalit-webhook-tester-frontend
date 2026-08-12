import { NextRequest, NextResponse } from "next/server";
import { getRequests, clearRequests } from "@/lib/webhook-store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ requests: getRequests(id) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  clearRequests(id);
  return NextResponse.json({ cleared: true });
}
