import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ResumePilotClient } from "@/components/ResumePilotClient";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ResumePilotClient />
      </main>
      <Footer />
    </div>
  );
}
