import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tx = await db.transaction.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!tx) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

  await db.transaction.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const tx = await db.transaction.update({
    where: { id: params.id },
    data: {
      amount: parseFloat(body.amount),
      type: body.type,
      note: body.note || "",
      date: body.date ? new Date(body.date) : undefined,
      categoryId: body.categoryId,
    },
    include: { category: true },
  });
  return NextResponse.json(tx);
}
