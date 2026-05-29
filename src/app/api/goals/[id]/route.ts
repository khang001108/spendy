import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const goal = await db.goal.update({
    where: { id: params.id },
    data: {
      name: body.name,
      icon: body.icon,
      targetAmount: body.targetAmount !== undefined ? parseFloat(body.targetAmount) : undefined,
      savedAmount: body.savedAmount !== undefined ? parseFloat(body.savedAmount) : undefined,
      deadline: body.deadline ? new Date(body.deadline) : null,
      color: body.color,
      status: body.status,
    },
  });
  return NextResponse.json(goal);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await db.goal.delete({ where: { id: params.id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
