import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "E-mail", type: "email" },
        password: { label: "Senha",  type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Bloqueia login se inativa
        if (!user || !user.ativo) return null;

        const senhaValida = await bcrypt.compare(credentials.password, user.senha);
        if (!senhaValida) return null;

        return {
          id:   user.id,
          name: user.nome,
          email: user.email,
          role: user.role as string,
        } as { id: string; name: string; email: string; role: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // --- Primeiro login: popula o token ---
      if (user) {
        token.id   = user.id;
        token.role = (user as unknown as { role: string }).role;
        token.ativo = true;
        return token;
      }

      // --- Requisições subsequentes: re-verifica ativo no banco ---
      // (cache simples: só re-checa se passaram mais de 60 segundos)
      const agora = Date.now();
      const ultimaVerificacao = (token.ultimaVerificacao as number) ?? 0;

      if (agora - ultimaVerificacao > 60_000) {
        const dbUser = await prisma.user.findUnique({
          where:  { id: token.id as string },
          select: { ativo: true, role: true },
        });
        token.ativo = dbUser?.ativo ?? false;
        // Atualiza o role caso mude também
        if (dbUser?.role) token.role = dbUser.role;
        token.ultimaVerificacao = agora;
      }

      return token;
    },

    async session({ session, token }) {
      // Se a moradora foi desativada, retorna sessão sem usuário
      // → middleware (withAuth) redireciona para /login
      if (!token.ativo) {
        return { ...session, user: undefined } as unknown as typeof session;
      }

      if (token && session.user) {
        session.user.id   = token.id   as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
