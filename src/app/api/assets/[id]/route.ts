import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const asset = await db.asset.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: {
      name: data.name,
      type: data.type,
      subtype: data.subtype || null,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      purchasePrice: parseFloat(data.purchasePrice || "0"),
      currentValue: parseFloat(data.currentValue || "0"),
      note: data.note || "",
      image: data.image || null,
    },
  });

  return NextResponse.json(asset);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.asset.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
