import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transfer = await db.transfer.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!transfer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Reverse the asset value changes
  await db.$transaction([
    db.transfer.delete({ where: { id: params.id } }),
    db.asset.update({
      where: { id: transfer.fromAssetId },
      data: { currentValue: { increment: transfer.amount } },
    }),
    db.asset.update({
      where: { id: transfer.toAssetId },
      data: { currentValue: { decrement: transfer.amount } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
