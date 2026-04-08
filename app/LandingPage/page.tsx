import Navbar from "@/components/LandingPage/Navbar";
import Hero from "@/components/LandingPage/Hero";
import WhatIs from "@/components/LandingPage/WhatIs";
import Features from "@/components/LandingPage/Features";
import HowItWorks from "@/components/LandingPage/HowItWorks";
import Stakeholders from "@/components/LandingPage/Stakeholders";
import Pricing from "@/components/LandingPage/Pricing";
import About from "@/components/LandingPage/About";
import Contact from "@/components/LandingPage/Contact";
import CTABanner from "@/components/LandingPage/CTABanner";
import Footer from "@/components/LandingPage/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <WhatIs />
      <Features />
      <HowItWorks />
      <Stakeholders />
      <Pricing />
      <About />
      <Contact />
      <CTABanner />
      <Footer />
    </main>
  );
}
