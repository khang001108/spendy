import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const backup = await req.json();
    if (!backup.transactions || !backup.categories) {
      return NextResponse.json({ error: "File backup không hợp lệ" }, { status: 400 });
    }

    // Restore categories first
    let categoryCount = 0;
    for (const cat of backup.categories || []) {
      await db.category.upsert({
        where: { name_userId: { name: cat.name, userId: session.user.id } },
        update: {},
        create: {
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: cat.type,
          userId: session.user.id,
        },
      });
      categoryCount++;
    }

    // Restore assets
    let assetCount = 0;
    for (const asset of backup.assets || []) {
      await db.asset.create({
        data: {
          name: asset.name,
          type: asset.type,
          subtype: asset.subtype,
          purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : null,
          purchasePrice: asset.purchasePrice || 0,
          currentValue: asset.currentValue || 0,
          note: asset.note || "",
          userId: session.user.id,
        },
      }).catch(() => {}); // Skip duplicates
      assetCount++;
    }

    return NextResponse.json({
      ok: true,
      message: `Đã khôi phục: ${categoryCount} danh mục, ${assetCount} tài sản`,
    });
  } catch (err) {
    return NextResponse.json({ error: "Lỗi khi khôi phục dữ liệu" }, { status: 500 });
  }
}
