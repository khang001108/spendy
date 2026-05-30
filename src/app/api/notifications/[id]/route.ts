import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (params.id === "all") {
    await db.notification.updateMany({
      where: { userId: session.user.id },
      data: { read: true },
    });
  } else {
    await db.notification.updateMany({
      where: { id: params.id, userId: session.user.id },
      data: { read: true },
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.notification.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
