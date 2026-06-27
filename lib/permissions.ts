import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Não autenticada" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function requireAdmin() {
  const { session, error } = await requireAuth();
  if (error || !session) return { session: null, error: error ?? NextResponse.json({ error: "Não autenticada" }, { status: 401 }) };

  if (session.user.role !== "ADMIN") {
    return {
      session: null,
      error: NextResponse.json({ error: "Acesso restrito a administradoras" }, { status: 403 }),
    };
  }
  return { session, error: null };
}

export function isAdmin(role: string) {
  return role === "ADMIN";
}
