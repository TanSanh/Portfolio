import { Header } from "@/components/client/Header";
import { Hero } from "@/components/client/Hero";
import { Portfolio } from "@/components/client/Portfolio";
import { Services } from "@/components/client/Services";
import { Contact } from "@/components/client/Contact";
import { Footer } from "@/components/client/Footer";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Header />
      <Hero />
      <Portfolio />
      <Services />
      <Contact />
      <Footer />
    </main>
  );
}
