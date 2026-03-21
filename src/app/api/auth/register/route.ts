import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, password, role } = await request.json();

    if (!name || !phone || !password || !role) {
      return NextResponse.json(
        { error: { code: "MISSING_FIELDS", message: "Name, phone, password, and role are required" } },
        { status: 400 }
      );
    }

    if (!["tenant", "landlord"].includes(role)) {
      return NextResponse.json(
        { error: { code: "INVALID_ROLE", message: "Role must be tenant or landlord" } },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const [existing] = await getDb()
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: { code: "PHONE_EXISTS", message: "An account with this phone number already exists" } },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await getDb()
      .insert(users)
      .values({
        name,
        phone,
        email: email || null,
        passwordHash,
        role,
      })
      .returning({
        id: users.id,
        name: users.name,
        phone: users.phone,
        role: users.role,
      });

    return NextResponse.json({ data: newUser, error: null }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: { code: "REGISTER_ERROR", message: "Failed to create account" } },
      { status: 500 }
    );
  }
}
