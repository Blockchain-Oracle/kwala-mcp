import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import HowItWorks from "@/components/landing/HowItWorks";
import ToolsPreview from "@/components/landing/ToolsPreview";
import Footer from "@/components/landing/Footer";
 
export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Hero />
        <Stats />
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <div id="tools">
          <ToolsPreview />
        </div>
      </main>
      <Footer />
    </>
  );
}
