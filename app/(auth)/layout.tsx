import FloralBg from "@/components/ui/floral/FloralBg";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at top, #FAE4DE 0%, #F7EDE8 60%, #EFE0D8 100%)",
      }}
    >
      <FloralBg />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
