import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const goals = await db.goal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, icon, targetAmount, savedAmount, deadline, color } = await req.json();
  const goal = await db.goal.create({
    data: {
      name,
      icon: icon || "🎯",
      targetAmount: parseFloat(targetAmount),
      savedAmount: parseFloat(savedAmount || 0),
      deadline: deadline ? new Date(deadline) : null,
      color: color || "#10b981",
      userId: session.user.id,
    },
  });
  return NextResponse.json(goal);
}
