import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword)
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  if (newPassword.length < 6)
    return NextResponse.json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự" }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 12);
  await db.user.update({ where: { id: session.user.id }, data: { password: hashed } });

  return NextResponse.json({ ok: true });
}
