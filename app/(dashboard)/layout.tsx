import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SessionProvider from "@/components/SessionProvider";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import FloralBg from "@/components/ui/floral/FloralBg";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col relative">
        {/* Flores grandes invadindo o fundo */}
        <FloralBg />

        <Navbar />
        <div className="flex flex-1 relative z-10">
          <Sidebar role={session.user.role} />
          <main className="flex-1 p-4 pb-24 md:pb-4 max-w-4xl">
            {children}
          </main>
        </div>
        <BottomNav role={session.user.role} />
      </div>
    </SessionProvider>
  );
}
