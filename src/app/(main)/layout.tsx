import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-white flex flex-col">
      <Navbar />
      <div className="h-14" /> {/* Spacer for fixed navbar */}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
