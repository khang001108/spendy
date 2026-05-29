import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const where: any = { userId: session.user.id };
  if (type) where.type = type;

  const cats = await db.category.findMany({ where, orderBy: { name: "asc" } });
  return NextResponse.json(cats);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, icon, color, type } = await req.json();
  const cat = await db.category.create({
    data: { name, icon: icon || "📦", color: color || "#6b7280", type, userId: session.user.id },
  });
  return NextResponse.json(cat);
}
