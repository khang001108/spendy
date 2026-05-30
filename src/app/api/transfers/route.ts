import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transfers = await db.transfer.findMany({
    where: { userId: session.user.id },
    include: { fromAsset: true, toAsset: true },
    orderBy: { date: "desc" },
    take: 50,
  });

  return NextResponse.json(transfers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, fromAssetId, toAssetId, note, date } = await req.json();
  if (!amount || !fromAssetId || !toAssetId)
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  if (fromAssetId === toAssetId)
    return NextResponse.json({ error: "Không thể chuyển cùng tài sản" }, { status: 400 });

  const parsedAmount = parseFloat(amount);

  // Run in transaction: create transfer + update asset values
  const [transfer] = await db.$transaction([
    db.transfer.create({
      data: {
        amount: parsedAmount,
        note: note || "",
        date: date ? new Date(date) : new Date(),
        fromAssetId,
        toAssetId,
        userId: session.user.id,
      },
      include: { fromAsset: true, toAsset: true },
    }),
    db.asset.update({
      where: { id: fromAssetId },
      data: { currentValue: { decrement: parsedAmount } },
    }),
    db.asset.update({
      where: { id: toAssetId },
      data: { currentValue: { increment: parsedAmount } },
    }),
  ]);

  return NextResponse.json(transfer);
}
