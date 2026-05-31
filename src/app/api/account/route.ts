import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// Xóa toàn bộ dữ liệu (giữ tài khoản)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action"); // "data" | "account"
  const { password } = await req.json();

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return NextResponse.json({ error: "Mật khẩu không đúng" }, { status: 400 });

  if (action === "data") {
    // Xóa dữ liệu, giữ tài khoản
    await db.$transaction([
      db.transfer.deleteMany({ where: { userId: session.user.id } }),
      db.transaction.deleteMany({ where: { userId: session.user.id } }),
      db.asset.deleteMany({ where: { userId: session.user.id } }),
      db.budget.deleteMany({ where: { userId: session.user.id } }),
      db.goal.deleteMany({ where: { userId: session.user.id } }),
      db.notification.deleteMany({ where: { userId: session.user.id } }),
      db.category.deleteMany({ where: { userId: session.user.id } }),
    ]);
    return NextResponse.json({ ok: true, message: "Đã xóa toàn bộ dữ liệu" });
  }

  if (action === "account") {
    // Xóa luôn tài khoản (cascade xóa hết)
    await db.user.delete({ where: { id: session.user.id } });
    return NextResponse.json({ ok: true, message: "Đã xóa tài khoản" });
  }

  return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
}
