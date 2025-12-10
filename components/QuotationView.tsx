'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  ShieldCheck, 
  Truck, 
  Wrench, 
  Nut, 
  Disc, 
  Lock,
  Star,
  ChevronRight,
  Info,
  Crosshair,
  ArrowRight
} from 'lucide-react';
import { Quotation, Product } from '@/types/quotation';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TextAnimate } from '@/components/magicui/text-animate';
import { MagicCard } from '@/components/magicui/magic-card';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface QuotationViewProps {
  data: Quotation;
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const extractEtValue = (product: Product, parsed: { title: string; description: string }) => {
  const candidates = [
    product.product_naam,
    product.size,
    product.model,
    parsed.title,
    parsed.description,
  ];

  for (const text of candidates) {
    if (!text) continue;
    const match = text.match(/ET\s*(-?\d+)/i);
    if (match) {
      const value = Number(match[1]);
      if (!Number.isNaN(value)) return value;
    }
  }
  return null;
};

const getConcaveBadge = (et: number | null) => {
  if (et === null) return null;
  if (et >= 41 && et <= 80) return "Performance";
  if (et >= 31 && et <= 40) return "Medium";
  if (et >= 21 && et <= 30) return "Deep";
  if (et >= 0 && et <= 20) return "Super Deep";
  return null;
};

const parseProduct = (product: Product) => {
  const parts = product.product_naam.split('\n');
  let title = parts[0];
  const description = parts.slice(1).join('\n') || product.color; 
  
  const codeMatch = title.match(/^\[(.*?)\]\s*(.*)/);
  let code = '';
  if (codeMatch) {
    code = codeMatch[1];
    title = codeMatch[2];
  }

  return { title, description, code };
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  }
};

const Separator = () => (
  <div className="h-px w-full bg-[#333] my-0" />
);

export default function QuotationView({ data }: QuotationViewProps) {
  const { wheelProducts, accessoryProducts } = useMemo(() => {
    const wheels: Product[] = [];
    const others: Product[] = [];

    data.producten.forEach((p, i) => {
      // Logic:
      // 1. First item is always a main wheel product.
      // 2. Second item is a main wheel product if it has a size OR looks like a wheel in the name.
      const isWheelLike = (prod: Product) => {
        if (prod.size && prod.size.trim().length > 0) return true;
        // Check for patterns like "8.5J x 20", "20x8.5", "ET25"
        return (
          /[\d\.]+[Jj]?\s*[xX]\s*\d+/.test(prod.product_naam) ||
          /ET\s*-?\d+/i.test(prod.product_naam)
        );
      };

      if (i === 0) {
        wheels.push(p);
      } else if (i === 1 && isWheelLike(p)) {
        wheels.push(p);
      } else {
        others.push(p);
      }
    });

    return { wheelProducts: wheels, accessoryProducts: others };
  }, [data.producten]);

  const mainProduct = wheelProducts[0];
  const parsedMainProduct = parseProduct(mainProduct);

  // Intro State
  const [showIntro, setShowIntro] = useState(true);

  // Intro tekst bepalen
  // Gebruik de officiele code (name) indien beschikbaar, anders fallback naar geformatteerd ID
  const displayId = data.name || (typeof data.offerte_id === 'number' 
    ? `S${data.offerte_id.toString().padStart(5, '0')}`
    : data.offerte_id);

  const introLine1 = `Quotation ${displayId} personally curated for`;
  const introLine2 = data.klant_naam;

  useEffect(() => {
    // Totale duur: Line 1 (2s) + Line 2 (1s) + Wait (1s) = 4s
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-[#EDEDED] font-sans selection:bg-[#D4F846] selection:text-black overflow-x-hidden">
      
      {/* INTRO OVERLAY */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-[#111] flex items-center justify-center px-4"
          >
            <div className="max-w-4xl text-center flex flex-col items-center">
                <div className="mb-8">
                    {/* Klein logo of icoon boven de tekst */}
                    <div className="w-2 h-2 bg-[#D4F846] mx-auto rounded-full animate-pulse" />
                </div>
                
                {/* Text Animate Component - Line 1 */}
                <TextAnimate 
                  animation="blurIn" 
                  by="character" 
                  duration={2} 
                  className="text-xl md:text-3xl text-[#EDEDED] font-light uppercase tracking-wide leading-tight mb-2 block"
                  style={{ fontFamily: 'Ppmonumentextended, sans-serif' }}
                >
                  {introLine1}
                </TextAnimate>

                {/* Text Animate Component - Line 2 (Name) */}
                <TextAnimate 
                  animation="blurIn" 
                  by="character" 
                  duration={1}
                  delay={2}
                  className="text-2xl md:text-5xl text-[#EDEDED] font-bold uppercase tracking-wide leading-tight block text-[#D4F846]"
                  style={{ fontFamily: 'Ppmonumentextended, sans-serif' }}
                >
                  {introLine2}
                </TextAnimate>
                
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3, duration: 0.5 }}
                    className="mt-8 text-[#666] font-mono text-xs uppercase tracking-widest"
                >
                    Initializing Secure Environment...
                </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Crosshairs Fixed */}
      <div className="fixed top-8 left-8 w-4 h-4 border-l border-t border-[#333] z-50 opacity-50" />
      <div className="fixed top-8 right-8 w-4 h-4 border-r border-t border-[#333] z-50 opacity-50" />
      <div className="fixed bottom-8 left-8 w-4 h-4 border-l border-b border-[#333] z-50 opacity-50" />
      <div className="fixed bottom-8 right-8 w-4 h-4 border-r border-b border-[#333] z-50 opacity-50" />

      {/* Header / Nav Anchor */}
      <nav className="fixed top-0 w-full z-40 bg-[#161616]/90 backdrop-blur-sm border-b border-[#333]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-12 lg:px-24 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {/* Logo */}
             <div className="relative w-40 h-10">
               {/* Place your logo file as 'logo.png' in the public folder */}
               <Image
                 src="/logo.png"
                 alt="KORBACH"
                 fill
                 className="object-contain object-left"
               />
             </div>
             <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-[#666] border-l border-[#333] pl-4">
                <span>EST 2020</span>
                <span>DUTCH ENGINEERING</span>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:block text-right">
                <div className="text-[10px] text-[#666] uppercase font-mono tracking-wider">Configuration ID</div>
                <div className="text-sm font-mono text-[#D4F846]">{data.name || data.offerte_id}</div>
             </div>
             <a
               href="#payment"
               role="button"
               className="bg-[#D4F846] text-black hover:bg-white transition-colors text-xs font-bold uppercase tracking-widest py-3 px-6 skew-x-[-10deg] inline-block"
             >
                <span className="skew-x-[10deg] inline-block">Secure Build</span>
             </a>
          </div>
        </div>
      </nav>

      <motion.div 
        className="pt-32 pb-32 max-w-[1280px] mx-auto px-4 md:px-12 lg:px-24"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >

        {/* Hero Section: Split Screen */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 mb-32 items-center">
            
            {/* Left: The Visual */}
            <motion.div variants={itemVariants} className="relative order-2 lg:order-1">
                <div className="relative w-full aspect-square max-w-2xl mx-auto p-8">
                    {/* Decorative Ring */}
                    <div className="absolute inset-0 border border-[#222] rounded-full opacity-20 scale-110" />
                    <div className="absolute inset-0 border border-dashed border-[#333] rounded-full opacity-20 scale-125 animate-spin-slow duration-[60s]" />
                    
                    {mainProduct.afbeelding ? (
                        <Image 
                            src={mainProduct.afbeelding} 
                            alt={parsedMainProduct.title}
                            fill
                            className="object-contain drop-shadow-2xl z-10"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#111]">
                            <Disc className="w-24 h-24 text-[#333]" />
                        </div>
                    )}
                </div>
                
                 {/* Technical Overlay Label */}
                 <div className="absolute bottom-4 left-4 bg-[#161616]/90 backdrop-blur-md border border-[#333] p-4 max-w-xs z-20 rounded-sm">
                    <div className="text-[10px] text-[#666] uppercase font-mono mb-1">Spec.</div>
                    {wheelProducts.map((wheel, i) => {
                      const parsed = parseProduct(wheel);
                      // Try to extract ET value from description or title if not in size
                      // Assuming size is like "10.5J x 23" and doesn't contain ET
                      // If size already contains ET, we might duplicate it, so careful.
                      // Regex to find ET value: ET20, ET 20, et20
                      const etMatch =
                        parsed.description.match(/ET\s*-?\d+/i) ||
                        parsed.title.match(/ET\s*-?\d+/i);
                      const etDisplay = etMatch
                        ? `| ${etMatch[0].toUpperCase().replace(/\s+/, "")}`
                        : "";

                      return (
                        <div key={i} className="text-xs font-mono text-[#EDEDED]">
                          {wheel.size} {etDisplay}
                        </div>
                      );
                    })}
                    <div className="text-xs font-mono text-[#D4F846] mt-1">FORGED ALUMINUM 6061-T6</div>
                 </div>
             </motion.div>

            {/* Right: The Typography */}
            <motion.div variants={itemVariants} className="order-1 lg:order-2">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 bg-[#D4F846]" />
                    <span className="font-mono text-xs text-[#D4F846] uppercase tracking-widest">Awaiting Approval</span>
                </div>
                
                <h1
                  className="text-5xl md:text-7xl lg:text-8xl tracking-tight mb-8 text-white"
                  style={{
                    fontFamily: 'Ppmonumentextended, sans-serif',
                    fontWeight: 400,
                    fontSize: '48px',
                    marginTop: 0,
                    marginBottom: '16px',
                  }}
                >
                    Prepared<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-[#333]">For</span><br/>
                    {data.klant_naam.split(' ')[0]}
                </h1>

                <div className="border-l-2 border-[#D4F846] pl-6 mb-12">
                    <p className="text-xl md:text-2xl text-[#EDEDED] font-light uppercase tracking-wide mb-2">
                        {data.voertuig}
                    </p>
                    <p className="text-[#666] text-sm max-w-md leading-relaxed">
                        Precision engineered fitment. Optimized for weight reduction and structural integrity. 
                        Verified by Korbach Engineering Division.
                    </p>
                </div>

                 {/* Engineering Status - Authority */}
                 <div className="grid grid-cols-2 gap-4 max-w-md">
                     <div className="flex items-center gap-3 border border-[#333] p-3 bg-[#111]">
                         <Check className="w-4 h-4 text-[#D4F846]" />
                         <span className="text-xs font-mono text-[#AAA] uppercase">FEA Analysis</span>
                     </div>
                     <div className="flex items-center gap-3 border border-[#333] p-3 bg-[#111]">
                         <Check className="w-4 h-4 text-[#D4F846]" />
                         <span className="text-xs font-mono text-[#AAA] uppercase">Fitment Verified</span>
                     </div>
                     <div className="flex items-center gap-3 border border-[#333] p-3 bg-[#111]">
                         <Check className="w-4 h-4 text-[#D4F846]" />
                         <span className="text-xs font-mono text-[#AAA] uppercase">Load Rating OK</span>
                     </div>
                     <div className="flex items-center gap-3 border border-[#333] p-3 bg-[#111]">
                         <Check className="w-4 h-4 text-[#D4F846]" />
                         <span className="text-xs font-mono text-[#AAA] uppercase">JWL/VIA Standard</span>
                     </div>
                 </div>
            </motion.div>
        </section>


        {/* Configuration List - Horizontal Tech Rows */}
        <section className="mb-32">
            <div className="flex items-end justify-between mb-8 border-b border-[#333] pb-4">
                <h2 className="uppercase tracking-wide" style={{ fontFamily: 'Ppmonumentextended, sans-serif', fontWeight: 400, fontSize: '34px', color: '#fff', marginTop: 0, marginBottom: 0 }}>Build Configuration</h2>
                <span className="font-mono text-[#666] text-xs">REF: {data.name || data.offerte_id}</span>
            </div>

            <div className="flex flex-col">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 py-4 text-[10px] font-mono text-[#666] uppercase tracking-wider border-b border-[#333]">
                    <div className="col-span-2">SKU / Type</div>
                    <div className="col-span-6">Component / Specification</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Value</div>
                </div>

                {/* Main Product Rows (Wheels) */}
                {wheelProducts.map((wheel) => {
                  const parsed = parseProduct(wheel);
                  const etValue = extractEtValue(wheel, parsed);
                  const concaveProfile = getConcaveBadge(etValue);
                  return (
                    <motion.div
                      key={wheel.product_id}
                      variants={itemVariants}
                      className="group grid grid-cols-1 md:grid-cols-12 gap-4 py-8 border-b border-[#333] hover:border-[#D4F846] transition-colors relative"
                    >
                      {/* Hover Glow */}
                      <div className="absolute inset-0 bg-[#D4F846] opacity-0 group-hover:opacity-[0.02] transition-opacity pointer-events-none" />

                      <div className="col-span-12 md:col-span-2 font-mono text-[#D4F846] text-xs">
                        {parsed.code || "WHEEL-SET"}
                      </div>
                      <div className="col-span-12 md:col-span-6">
                        <h3
                          className="text-xl font-bold uppercase mb-2"
                          style={{
                            fontFamily: "Ppmonumentextended, sans-serif",
                          }}
                        >
                          {parsed.title}
                        </h3>
                        <p className="text-[#888] text-sm leading-relaxed">
                          {parsed.description}
                        </p>
                        {concaveProfile && (
                          <div className="flex gap-4 mt-4">
                            <span className="text-xs font-mono bg-[#0f0f0f] px-3 py-1 border border-[#333] text-[#D4F846] uppercase tracking-wider">
                              {concaveProfile} Concave
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="col-span-6 md:col-span-2 text-right font-mono text-[#EDEDED] flex items-start justify-end">
                        {wheel.quantity}
                      </div>
                      <div className="col-span-6 md:col-span-2 text-right font-mono text-[#EDEDED] text-lg">
                        {formatCurrency(wheel.prijs_per_stuk, data.valuta)}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Other Products Rows */}
                {accessoryProducts.map((product) => {
                    const parsed = parseProduct(product);
                    const isIncluded = product.prijs_per_stuk === 0;

                    return (
                        <motion.div 
                            key={product.product_id}
                            variants={itemVariants}
                            className="group grid grid-cols-1 md:grid-cols-12 gap-4 py-6 border-b border-[#333] hover:border-[#D4F846] transition-colors items-center relative"
                        >
                            <div className="col-span-12 md:col-span-2 font-mono text-[#666] text-xs group-hover:text-[#D4F846] transition-colors">
                                {parsed.code || 'ENG-OPT'}
                            </div>
                            <div className="col-span-12 md:col-span-6">
                                <h4
                                  className="font-bold text-sm uppercase mb-1"
                                  style={{ fontFamily: 'Ppmonumentextended, sans-serif' }}
                                >
                                  {parsed.title}
                                </h4>
                                <p className="text-[#666] text-xs font-mono">{parsed.description}</p>
                            </div>
                            <div className="col-span-6 md:col-span-2 text-right font-mono text-[#EDEDED] text-sm">
                                {product.quantity}
                            </div>
                            <div className="col-span-6 md:col-span-2 text-right font-mono">
                                {isIncluded ? (
                                    <span className="text-[#D4F846] text-xs uppercase tracking-wider border border-[#D4F846]/30 bg-[#D4F846]/10 px-2 py-1">
                                        Included
                                    </span>
                                ) : (
                                    <span className="text-[#EDEDED]">{formatCurrency(product.prijs_per_stuk, data.valuta)}</span>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </section>


        {/* Conversion / Payment Section - NU EERST */}
        <section id="payment" className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-t border-[#333] pt-12 mb-32">
            
            <div className="lg:col-span-6">
                <h3 className="uppercase mb-6" style={{ fontFamily: 'Ppmonumentextended, sans-serif', fontWeight: 400, fontSize: '34px', color: '#fff', marginTop: 0, marginBottom: 0 }}>Production Slot</h3>
                <p className="text-[#888] max-w-lg mb-8">
                    Your configuration is ready for production scheduling. 
                    Due to high demand for the {mainProduct.size} raw forgings, we require a deposit to secure your allocation in the milling queue.
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-[#666]">
                    <div className="flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        <span>256-BIT ENCRYPTED</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" />
                        <span>BUYER PROTECTION</span>
                    </div>
                </div>
            </div>

            <MagicCard 
                className="lg:col-span-6 bg-[#333] relative overflow-hidden"
                gradientColor="transparent"
                gradientFrom="#D4F846"
                gradientTo="#D4F846"
                gradientOpacity={0}
                gradientSize={300}
            >
                <div className="p-8 lg:p-12 h-full">
                    {/* Background Grid inside card */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-[#666] font-mono uppercase text-sm">Total Value (Excl. VAT)</span>
                            <span className="text-2xl font-mono text-[#EDEDED] decoration-slice decoration-1 underline decoration-[#333] underline-offset-4">
                                {formatCurrency(data.totaal_excl, data.valuta)}
                            </span>
                        </div>
                        
                        <div className="flex justify-between items-end mb-12">
                            <span className="text-[#D4F846] font-mono uppercase text-sm font-bold">Deposit Required</span>
                            <span className="text-5xl md:text-6xl font-extended text-[#D4F846] tracking-tighter">
                                {formatCurrency(data.aanbetaling, data.valuta)}
                            </span>
                        </div>

                        <button className="w-full bg-[#D4F846] text-black font-bold uppercase font-extended tracking-widest py-6 hover:bg-white transition-all transform active:scale-[0.99] flex items-center justify-center gap-4 group cursor-pointer relative z-20">
                            Secure Allocation 
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        
                        {/* Trust & Conversion Elements */}
                        <div className="mt-8 flex flex-col items-center gap-4">
                            <div className="flex gap-3 opacity-30 grayscale">
                                <span className="text-[10px] font-mono border border-[#444] px-1 rounded">VISA</span>
                                <span className="text-[10px] font-mono border border-[#444] px-1 rounded">MC</span>
                                <span className="text-[10px] font-mono border border-[#444] px-1 rounded">AMEX</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-[10px] text-[#666]">
                                <div className="w-1.5 h-1.5 bg-[#D4F846] rounded-full" />
                                <span>Fully refundable until Design Sign-off</span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[#333] w-full text-center">
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1">Verified by</div>
                                <div className="text-xs text-[#888] font-bold uppercase" style={{ fontFamily: 'Ppmonumentextended, sans-serif' }}>Vincent Pedroli</div>
                                <div className="text-[9px] text-[#D4F846] font-mono">Fitment Specialist</div>
                            </div>
                        </div>

                        <p className="text-center mt-6 text-[#444] text-[10px] font-mono uppercase">
                            By proceeding you accept our engineering terms & conditions.
                        </p>
                    </div>
                </div>
            </MagicCard>

        </section>

      </motion.div>

       {/* Footer Anchor - Copy of Main Site Footer */}
       <footer className="bg-black border-t border-[#222] py-12">
            <div className="max-w-[1280px] mx-auto px-4 md:px-12 lg:px-24 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-[#333] font-extended uppercase tracking-widest text-sm">
                    Korbach Forged ///
                </div>
                <div className="text-[#333] font-mono text-[10px]">
                    © {new Date().getFullYear()} KORBACH GMBH. ALL RIGHTS RESERVED.
                </div>
            </div>
       </footer>

    </div>
  );
}
