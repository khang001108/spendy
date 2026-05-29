import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { seedUserCategories } from "@/lib/seed";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password)
      return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });

    const exists = await db.user.findUnique({ where: { email } });
    if (exists)
      return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.user.create({ data: { name, email, password: hashed } });
    await seedUserCategories(user.id);

    return NextResponse.json({ ok: true, id: user.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
