import { NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";

const registerSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [validatedData.email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Insert user
    const [result] = await db.query(
      "INSERT INTO users (email, password_hash, name, ui_mode) VALUES (?, ?, ?, ?)",
      [validatedData.email, passwordHash, validatedData.name, "regular"]
    );

    const insertResult = result as any;
    const userId = insertResult.insertId;

    // Generate JWT token
    const token = generateToken({
      userId,
      email: validatedData.email,
    });

    return NextResponse.json(
      {
        token,
        user: {
          id: userId,
          email: validatedData.email,
          name: validatedData.name,
          uiMode: "regular",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
