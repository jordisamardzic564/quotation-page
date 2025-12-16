'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  ShieldCheck, 
  Disc, 
  Lock,
  ArrowRight,
  Loader2
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

const CONCAVE_LEVELS = {
  PERFORMANCE: 1,
  MEDIUM: 2,
  DEEP: 3,
  SUPER_DEEP: 4,
};

const getConcaveLevel = (et: number | null) => {
  if (et === null) return 0;
  if (et >= 41 && et <= 80) return CONCAVE_LEVELS.PERFORMANCE;
  if (et >= 31 && et <= 40) return CONCAVE_LEVELS.MEDIUM;
  if (et >= 21 && et <= 30) return CONCAVE_LEVELS.DEEP;
  if (et >= 0 && et <= 20) return CONCAVE_LEVELS.SUPER_DEEP;
  return 0;
};

const getConcaveName = (level: number) => {
  switch (level) {
    case CONCAVE_LEVELS.PERFORMANCE: return "Performance";
    case CONCAVE_LEVELS.MEDIUM: return "Medium";
    case CONCAVE_LEVELS.DEEP: return "Deep";
    case CONCAVE_LEVELS.SUPER_DEEP: return "Super Deep";
    default: return null;
  }
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

// Detectie of een product een velg is
const isWheelProduct = (product: Product) => {
  // 1. Check op size property
  if (product.size && product.size.trim().length > 0) return true;
  
  const name = product.product_naam.toLowerCase();
  
  // 2. Check op "inch"
  if (name.includes('inch')) return true;

  // 3. Check op "J x" patroon of "ET" waarde
  if (/[\d\.]+[Jj]?\s*[xX]\s*\d+/.test(product.product_naam)) return true;
  if (/ET\s*-?\d+/i.test(product.product_naam)) return true;
  
  return false;
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

type EnrichedProduct = Product & {
  isWheel: boolean;
  concaveProfile?: string | null;
  parsed: { title: string; description: string; code: string };
};

export default function QuotationView({ data }: QuotationViewProps) {
  // === DATA PREPARATION ===
  // We verwerken de productenlijst één keer om te bepalen wat velgen zijn en wat niet.
  // We behouden de originele volgorde van Odoo voor de weergave in de tabel.
  const { enrichedProducts, wheelProducts } = useMemo(() => {
    // 1. Identificeer velgen en parse data
    const tempProducts = data.producten.map(p => ({
      ...p,
      isWheel: isWheelProduct(p),
      parsed: parseProduct(p)
    }));

    // 2. Isoleer de velgen voor concave berekening
    const wheels = tempProducts.filter(p => p.isWheel);

    // 3. Bereken concave levels voor de velgen
    const levels = wheels.map((wheel) => {
      const et = extractEtValue(wheel, wheel.parsed);
      return getConcaveLevel(et);
    });

    // Concave Logica: index 0 = Voor, index 1 = Achter (indien precies 2 velgen)
    // Als achteras een geldige ET heeft (level > 0)
    // En vooras is dieper dan achteras (hoger level)
    // Dan vooras downgraden naar achteras level
    if (levels.length === 2) {
      const frontLevel = levels[0];
      const rearLevel = levels[1];
      if (rearLevel > 0 && frontLevel > rearLevel) {
        levels[0] = rearLevel;
      }
    }

    const concaveNames = levels.map(getConcaveName);

    // 4. Voeg concave profielen toe aan de originele productenlijst (alleen bij de velgen)
    let wheelIndex = 0;
    const finalProducts: EnrichedProduct[] = tempProducts.map(p => {
      if (p.isWheel) {
        const profile = concaveNames[wheelIndex];
        wheelIndex++;
        return { ...p, concaveProfile: profile };
      }
      return p;
    });

    // 5. Sorteer: Velgen altijd eerst, daarna de rest. Behoud originele volgorde binnen groepen.
    const sortedProducts = [
      ...finalProducts.filter(p => p.isWheel),
      ...finalProducts.filter(p => !p.isWheel)
    ];

    return { 
      enrichedProducts: sortedProducts, 
      wheelProducts: wheels // Voor de Hero sectie
    };
  }, [data.producten]);

  // === TRACKING LOGIC ===
  const trackEvent = (eventName: string, metadata: Record<string, any> = {}) => {
    try {
      fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerte_id: data.name,
          event: eventName,
          timestamp: new Date().toISOString(),
          klant_naam: data.klant_naam,
          voertuig: data.voertuig,
          totaal_bedrag: data.totaal_excl,
          extra: {
            url: typeof window !== 'undefined' ? window.location.href : '',
            referrer: typeof document !== 'undefined' ? document.referrer : '',
            ...metadata
          }
        }),
      }).catch(err => console.error('Tracking error:', err));
    } catch (e) {
      // Negeer fouten
    }
  };

  useEffect(() => {
    if (!data) return;
    trackEvent('pagina_bezocht');

    const startTime = Date.now();
    const sendExitSignal = () => {
       if ((window as any).hasSentExit) return;
       const durationSeconds = Math.round((Date.now() - startTime) / 1000);
       if (durationSeconds < 5) return;

       const blob = new Blob([JSON.stringify({
          offerte_id: data.name,
          event: 'pagina_verlaten',
          timestamp: new Date().toISOString(),
          klant_naam: data.klant_naam,
          voertuig: data.voertuig,
          totaal_bedrag: data.totaal_excl,
          extra: { 
            url: window.location.href,
            duur_seconden: durationSeconds 
          }
       })], { type: 'application/json' });
       
       const success = navigator.sendBeacon('/api/track-event', blob);
       if (success) {
           (window as any).hasSentExit = true;
       }
    };

    const handlePageHide = () => sendExitSignal();
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') sendExitSignal();
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [data]);

  // === COUNTDOWN LOGIC ===
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!data.geldig_tot) return;
      const validUntil = new Date(data.geldig_tot).getTime();
      const now = new Date().getTime();
      const difference = validUntil - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft("OFFER EXPIRED");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const formattedTime = `${String(days).padStart(2, '0')} Days ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setTimeLeft(formattedTime);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [data.geldig_tot]);

  const mainProduct = wheelProducts[0] || enrichedProducts[0]; // Fallback naar eerste product als er geen wielen zijn
  
  // === LANGUAGE DETECTION ===
  const [language, setLanguage] = useState<'en' | 'nl'>('en');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.language.startsWith('nl')) {
      setLanguage('nl');
    }
  }, []);

  const isFullPayment = data.payment_mode === 'full';
  const [isLoading, setIsLoading] = useState(false);

  const t = {
    paymentTitle: language === 'nl' 
      ? (isFullPayment ? 'Rond uw bestelling af' : 'Productie Slot Reserveren')
      : (isFullPayment ? 'Complete Your Order' : 'Production Slot'),
    
    paymentDesc: language === 'nl'
      ? (isFullPayment 
          ? `Uw configuratie is goedgekeurd. Voldoe de volledige betaling van ${formatCurrency(data.aanbetaling, data.valuta)} om de productie te starten.`
          : `Uw configuratie staat klaar. Vanwege de grote vraag naar ${mainProduct.size || 'forged'} ruwe forgings vragen wij een aanbetaling van ${formatCurrency(data.aanbetaling, data.valuta)} om uw plek in de freesrij te reserveren.`)
      : (isFullPayment 
          ? `Your configuration is approved. Please complete the full payment of ${formatCurrency(data.aanbetaling, data.valuta)} to proceed directly to production.`
          : `Your configuration is ready. Due to high demand for the ${mainProduct.size || 'forged'} raw forgings, we require a deposit of ${formatCurrency(data.aanbetaling, data.valuta)} to secure your allocation in the milling queue.`),
    
    totalExcl: language === 'nl' ? "Totaal Excl. BTW" : "Total Excl. VAT",
    totalIncl: language === 'nl' ? "Totaal Incl. BTW" : "Total Incl. VAT",
    totalDue: language === 'nl' 
      ? (isFullPayment ? "Totaal te voldoen (Incl. BTW)" : "30% Aanbetaling (Incl. BTW)")
      : (isFullPayment ? "Total Due (Incl. VAT)" : "30% Deposit (Incl. VAT)"),
    
    balanceDue: language === 'nl' ? "Restbedrag te voldoen voor levering" : "Balance due before shipping",
    
    buttonText: language === 'nl'
      ? (isFullPayment ? "Betaling Voldoen" : "Productieplaats Veiligstellen")
      : (isFullPayment ? "Complete Payment" : "Secure Allocation"),
      
    verifiedBy: language === 'nl' ? "Geverifieerd door" : "Verified by",
    terms: language === 'nl' 
      ? "Door verder te gaan accepteert u onze technische voorwaarden."
      : "By proceeding you accept our engineering terms & conditions."
  };

  const handlePayment = async () => {
    trackEvent('click_op_knop', { 
      knop_type: isFullPayment ? 'complete_payment' : 'secure_allocation' 
    });

    setIsLoading(true);
    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerte_id: data.offerte_id,
          uuid: data.uuid,
          locale: language === 'nl' ? 'nl_NL' : 'en_US'
        }),
      });

      const result = await response.json();
      
      if (result.url) {
        window.location.href = result.url;
      } else {
        alert('Kon geen betaallink genereren.');
      }
    } catch (error) {
      console.error(error);
      alert('Er ging iets mis.');
    } finally {
      setIsLoading(false);
    }
  };

  // Intro State
  const [showIntro, setShowIntro] = useState(true);
  const displayId = data.name;
  const introLine1 = `Quotation ${displayId} personally curated for`;
  const introLine2 = data.klant_naam;

  useEffect(() => {
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
                    <div className="w-2 h-2 bg-[#D4F846] mx-auto rounded-full animate-pulse" />
                </div>
                
                <TextAnimate 
                  animation="blurIn" 
                  by="character" 
                  duration={2} 
                  className="text-xl md:text-3xl text-[#EDEDED] font-light uppercase tracking-wide leading-tight mb-2 block"
                  style={{ fontFamily: 'Ppmonumentextended, sans-serif' }}
                >
                  {introLine1}
                </TextAnimate>

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
             <div className="relative w-40 h-10">
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
                <div className="text-sm font-mono text-[#D4F846]">{data.name}</div>
             </div>
             <a
               href={isExpired ? undefined : "#payment"}
               role="button"
               aria-disabled={isExpired}
               className={cn(
                 "text-xs font-bold uppercase tracking-widest py-3 px-6 skew-x-[-10deg] inline-block transition-colors",
                 isExpired 
                  ? "bg-[#333] text-[#666] cursor-not-allowed" 
                  : "bg-[#D4F846] text-black hover:bg-white"
               )}
               onClick={(e) => isExpired && e.preventDefault()}
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
                    <div className="absolute inset-0 border border-[#222] rounded-full opacity-20 scale-110" />
                    <div className="absolute inset-0 border border-dashed border-[#333] rounded-full opacity-20 scale-125 animate-spin-slow duration-[60s]" />
                    
                    {mainProduct.afbeelding ? (
                        <Image 
                            src={mainProduct.afbeelding} 
                            alt={mainProduct.parsed.title}
                            fill
                            className="object-contain drop-shadow-2xl z-10 rounded-2xl"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#111] rounded-2xl">
                            <Disc className="w-24 h-24 text-[#333]" />
                        </div>
                    )}
                </div>
                
                 {/* Technical Overlay Label for Wheels */}
                 <div className="absolute bottom-4 left-4 bg-[#161616]/90 backdrop-blur-md border border-[#333] p-4 max-w-xs z-20 rounded-sm">
                    <div className="text-[10px] text-[#666] uppercase font-mono mb-1">Spec.</div>
                    {wheelProducts.map((wheel, i) => {
                      const parsed = parseProduct(wheel);
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
                <div id="quote-status-bar" className={cn("flex items-center gap-2 mb-6 transition-colors duration-300", isExpired ? "expired-status" : "")}>
                    <div className={cn("w-2 h-2 transition-colors duration-300", isExpired ? "bg-red-600" : "bg-[#D4F846] animate-pulse")} />
                    <span className={cn(
                        "font-mono text-xs uppercase tracking-widest transition-colors duration-300",
                        isExpired ? "text-red-600 font-bold" : "text-[#D4F846]"
                    )}>
                        {timeLeft || "CALCULATING..."}
                    </span>
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


        {/* Configuration List - Single List Preserving Order */}
        <section className="mb-32">
            <div className="flex items-end justify-between mb-8 border-b border-[#333] pb-4">
                <h2 className="uppercase tracking-wide" style={{ fontFamily: 'Ppmonumentextended, sans-serif', fontWeight: 400, fontSize: '34px', color: '#fff', marginTop: 0, marginBottom: 0 }}>Build Configuration</h2>
                <span className="font-mono text-[#666] text-xs">REF: {data.name}</span>
            </div>

            <div className="flex flex-col">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 py-4 text-[10px] font-mono text-[#666] uppercase tracking-wider border-b border-[#333]">
                    <div className="col-span-2">SKU / Type</div>
                    <div className="col-span-6">Component / Specification</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Value</div>
                </div>

                {/* All Products in Original Order */}
                {enrichedProducts.map((product) => {
                  if (product.isWheel) {
                    // === WHEEL / MAIN PRODUCT STYLING ===
                    return (
                      <motion.div
                        key={product.product_id}
                        variants={itemVariants}
                        className="group grid grid-cols-1 md:grid-cols-12 gap-4 py-8 border-b border-[#333] hover:border-[#D4F846] transition-colors relative"
                      >
                        <div className="absolute inset-0 bg-[#D4F846] opacity-0 group-hover:opacity-[0.02] transition-opacity pointer-events-none" />

                        <div className="col-span-12 md:col-span-2 font-mono text-[#D4F846] text-xs">
                          {product.parsed.code || "WHEEL-SET"}
                        </div>
                        <div className="col-span-12 md:col-span-6">
                          <h3
                            className="text-xl font-bold uppercase mb-2"
                            style={{ fontFamily: "Ppmonumentextended, sans-serif" }}
                          >
                            {product.parsed.title}
                          </h3>
                          <p className="text-[#888] text-sm leading-relaxed">
                            {product.parsed.description}
                          </p>
                          {product.concaveProfile && (
                            <div className="flex gap-4 mt-4">
                              <span className="text-xs font-mono bg-[#0f0f0f] px-3 py-1 border border-[#333] text-[#D4F846] uppercase tracking-wider">
                                {product.concaveProfile} Concave
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="col-span-6 md:col-span-2 text-right font-mono text-[#EDEDED] flex items-start justify-end">
                          {product.quantity}
                        </div>
                        <div className="col-span-6 md:col-span-2 text-right font-mono text-[#EDEDED] text-lg">
                          {formatCurrency(product.prijs_per_stuk, data.valuta)}
                        </div>
                      </motion.div>
                    );
                  } else {
                    // === ACCESSORY / STANDARD PRODUCT STYLING ===
                    const isIncluded = product.prijs_per_stuk === 0;
                    return (
                        <motion.div 
                            key={product.product_id}
                            variants={itemVariants}
                            className="group grid grid-cols-1 md:grid-cols-12 gap-4 py-6 border-b border-[#333] hover:border-[#D4F846] transition-colors items-center relative"
                        >
                            <div className="col-span-12 md:col-span-2 font-mono text-[#666] text-xs group-hover:text-[#D4F846] transition-colors">
                                {product.parsed.code || 'ENG-OPT'}
                            </div>
                            <div className="col-span-12 md:col-span-6">
                                <h4
                                  className="font-bold text-sm uppercase mb-1"
                                  style={{ fontFamily: 'Ppmonumentextended, sans-serif' }}
                                >
                                  {product.parsed.title}
                                </h4>
                                <p className="text-[#666] text-xs font-mono">{product.parsed.description}</p>
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
                    );
                  }
                })}
            </div>
        </section>


        {/* Conversion / Payment Section */}
        <section id="payment" className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-t border-[#333] pt-12 mb-32">
            
            <div className="lg:col-span-6">
                <h3 className="uppercase mb-6" style={{ fontFamily: 'Ppmonumentextended, sans-serif', fontWeight: 400, fontSize: '34px', color: '#fff', marginTop: 0, marginBottom: 0 }}>
                    {t.paymentTitle}
                </h3>
                <p className="text-[#888] max-w-lg mb-8">
                    {t.paymentDesc}
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
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[#666] font-mono uppercase text-sm">{t.totalExcl}</span>
                            <span className="text-xl font-mono text-[#EDEDED] decoration-slice decoration-1 underline decoration-[#333] underline-offset-4">
                                {formatCurrency(data.totaal_excl, data.valuta)}
                            </span>
                        </div>

                        {data.has_tax && (
                          <div className="flex justify-between items-end mb-8 border-b border-[#333] pb-4">
                              <span className="text-[#444] font-mono uppercase text-xs">{t.totalIncl}</span>
                              <span className="text-sm font-mono text-[#888]">
                                  {formatCurrency(data.totaal_incl ?? 0, data.valuta)}
                              </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-end mb-12">
                            <div className="flex flex-col">
                                <span className="text-[#D4F846] font-mono uppercase text-sm font-bold">
                                    {t.totalDue}
                                </span>
                                {!isFullPayment && (
                                    <span className="text-[10px] text-[#666] font-mono mt-1">
                                        {t.balanceDue}
                                    </span>
                                )}
                            </div>
                            <span className="text-5xl md:text-6xl font-extended text-[#D4F846] tracking-tighter">
                                {formatCurrency(data.aanbetaling, data.valuta)}
                            </span>
                        </div>

                        <button 
                            onClick={handlePayment}
                            disabled={isLoading || isExpired}
                            className={cn(
                                "w-full font-bold uppercase font-extended tracking-widest py-6 transition-all transform flex items-center justify-center gap-4 group relative z-20",
                                isExpired 
                                    ? "bg-[#222] text-[#666] cursor-not-allowed border border-[#333]" 
                                    : "bg-[#D4F846] text-black hover:bg-white active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:cursor-wait"
                            )}
                        >
                            {isExpired ? 'OFFER EXPIRED' : (isLoading ? 'Processing...' : t.buttonText)}
                            {!isLoading && !isExpired && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
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
                                <div className="text-[10px] text-[#444] font-mono uppercase tracking-widest mb-1">{t.verifiedBy}</div>
                                <div className="text-xs text-[#888] font-bold uppercase" style={{ fontFamily: 'Ppmonumentextended, sans-serif' }}>Vincent Pedroli</div>
                                <div className="text-[9px] text-[#D4F846] font-mono">Fitment Specialist</div>
                            </div>
                        </div>

                        <p className="text-center mt-6 text-[#444] text-[10px] font-mono uppercase">
                            {t.terms}
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
