import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const form = await req.formData();
  const file = form.get("foto") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
  }

  // Remove foto anterior se existir
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { foto: true },
  });
  if (user?.foto) {
    try { await del(user.foto); } catch { /* ignora se não encontrar */ }
  }

  const blob = await put(`moradoras/${params.id}/foto`, file, {
    access: "public",
    contentType: file.type || "image/jpeg",
  });

  await prisma.user.update({
    where: { id: params.id },
    data: { foto: blob.url },
  });

  return NextResponse.json({ url: blob.url });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { foto: true },
  });
  if (user?.foto) {
    try { await del(user.foto); } catch { /* ignora */ }
  }

  await prisma.user.update({
    where: { id: params.id },
    data: { foto: null },
  });

  return NextResponse.json({ ok: true });
}
