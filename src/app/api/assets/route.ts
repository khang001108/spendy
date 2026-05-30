import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assets = await db.asset.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type, subtype, purchaseDate, purchasePrice, currentValue, note, image } = await req.json();
  if (!name || !type) return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });

  const asset = await db.asset.create({
    data: {
      name,
      type,
      subtype: subtype || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      purchasePrice: parseFloat(purchasePrice || "0"),
      currentValue: parseFloat(currentValue || "0"),
      note: note || "",
      image: image || null,
      userId: session.user.id,
    },
  });

  return NextResponse.json(asset);
}
