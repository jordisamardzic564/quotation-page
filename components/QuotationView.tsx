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
  Loader2,
  ChevronDown
} from 'lucide-react';
import { Quotation, Product } from '@/types/quotation';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TextAnimate } from '@/components/magicui/text-animate';
import { MagicCard } from '@/components/magicui/magic-card';
import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface QuotationViewProps {
  data: Quotation;
  mode?: 'quotation' | 'order';
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
  // Let op: Lagere ET waarde = dieper concave = hoger level getal
  if (et >= 41 && et <= 100) return CONCAVE_LEVELS.PERFORMANCE; // Ondiep
  if (et >= 31 && et <= 40) return CONCAVE_LEVELS.MEDIUM;
  if (et >= 21 && et <= 30) return CONCAVE_LEVELS.DEEP;
  if (et <= 20) return CONCAVE_LEVELS.SUPER_DEEP; // Diepst
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

export default function QuotationView({ data, mode = 'quotation' }: QuotationViewProps) {
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

    // Helper om width uit te lezen (bijv "9.00J")
    const getWidth = (product: Product) => {
      const match = product.size?.match(/([\d\.]+)[Jj]/);
      return match ? parseFloat(match[1]) : 0;
    };

    // Concave Logica:
    // We moeten zeker weten wat voor en achter is.
    // Normaal is index 0 = Voor, index 1 = Achter.
    // Maar check voor zekerheid op breedte: smalste is voor.
    let frontIndex = 0;
    let rearIndex = 1;

    if (levels.length === 2) {
      const width0 = getWidth(wheels[0]);
      const width1 = getWidth(wheels[1]);

      if (width0 > 0 && width1 > 0) {
        if (width1 < width0) {
          // Index 1 is smaller -> Front
          frontIndex = 1;
          rearIndex = 0;
        }
      }

      const frontLevel = levels[frontIndex];
      const rearLevel = levels[rearIndex];
      
      // REGEL: Vooras (front) mag NOOIT dieper zijn dan achteras (rear).
      // Hogere level = dieper.
      // Dus: Front level cappen op Rear level.
      if (rearLevel > 0 && frontLevel > rearLevel) {
        levels[frontIndex] = rearLevel;
      }
    }

    const concaveNames = levels.map(getConcaveName);

    // 4. Voeg concave profielen toe aan de originele productenlijst (alleen bij de velgen)
    let wheelIndex = 0;
    const finalProducts: EnrichedProduct[] = tempProducts.map(p => {
      if (p.isWheel) {
        const profile = concaveNames[wheelIndex];
        wheelIndex++;
        // Extra check om undefined/null op te vangen
        return { ...p, concaveProfile: profile || null };
      }
      return { ...p, concaveProfile: null };
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
    if (mode === 'order') return; // Geen countdown nodig bij orders

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
  
  const isFullPayment = data.payment_mode === 'full';
  const [isLoading, setIsLoading] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // === ROADMAP LOGIC ===
  const getProductionProgress = () => {
    if (!data.x_studio_production_start_date) return null;
    
    const start = new Date(data.x_studio_production_start_date).getTime();
    if (Number.isNaN(start)) return null;

    const now = new Date().getTime();
    // Verschil in milliseconden -> dagen
    const daysPassed = (now - start) / (1000 * 60 * 60 * 24);
    
    return daysPassed;
  };

  const daysInProduction = getProductionProgress();

  const roadmapSteps = [
    { 
        title: "Configuration Locked", 
        desc: "Specs are frozen and sent to engineering. We begin the custom 3D modeling of your wheels, precision-calculated for your car's exact technical specifications. (Immediately after payment)",
        active: mode === 'quotation',
        completed: mode === 'order'
    },
    { 
        title: "Engineering Validation", 
        desc: "FEA Analysis & Load Rating verification. Every design is digitally stress-tested to ensure it exceeds structural requirements for your specific vehicle. (Week 1)",
        // Active als order confirmed is, maar productie datum nog niet bekend/gevuld
        active: mode === 'order' && daysInProduction === null,
        // Completed zodra we een startdatum hebben
        completed: daysInProduction !== null
    },
    { 
        title: "Milling & Production", 
        desc: "The aerospace-grade 6061-T6 forging process begins. Your wheels are CNC-machined from solid blocks of aluminum to bring the design to life. (Weeks 2-4)",
        // Active: we zijn gestart, maar nog geen 14 dagen verder
        active: daysInProduction !== null && daysInProduction < 14,
        // Completed: we zijn 14 dagen of langer onderweg
        completed: daysInProduction !== null && daysInProduction >= 14
    },
    { 
        title: "Coating & Quality Control", 
        desc: "After hand-finishing and coating, each wheel undergoes a laser-inspected roundness test and a micrometer check to guarantee 100% perfection. (Weeks 4-5)",
        // Active: tussen dag 14 en 17
        active: daysInProduction !== null && daysInProduction >= 14 && daysInProduction < 17,
        // Completed: na dag 17
        completed: daysInProduction !== null && daysInProduction >= 17
    },
    { 
        title: "Global Shipping", 
        desc: "Insured door-to-door delivery. Your custom wheel set is securely packed and shipped. You will receive a tracking link the moment they are dispatched.",
        // Active: na dag 17 (laatste stap)
        active: daysInProduction !== null && daysInProduction >= 17,
        completed: false
    },
  ];

  // We keep the UI strictly English for now (no automatic locale-based switching).
  const t = {
    paymentTitle: isFullPayment ? 'Complete Your Order' : 'Production Slot',

    paymentDesc: isFullPayment
      ? `Your configuration is approved. Please complete the full payment of ${formatCurrency(
          data.aanbetaling,
          data.valuta
        )} to proceed directly to production.`
      : `Your configuration is ready. Due to high demand for the ${
          mainProduct.size || 'forged'
        } raw forgings, we require a deposit of ${formatCurrency(
          data.aanbetaling,
          data.valuta
        )} to secure your allocation in the milling queue.`,

    totalExcl: "Total Excl. VAT",
    totalIncl: "Total Incl. VAT",
    totalDue: isFullPayment 
      ? (data.has_tax ? "Total Due (Incl. VAT)" : "Total Due (excl. VAT)")
      : (data.has_tax ? "30% Deposit (Incl. VAT)" : "30% Deposit (excl. VAT)"),

    balanceDue: "Balance due before shipping",

    buttonText: isFullPayment ? "Complete Payment" : "Secure Allocation",

    verifiedBy: "Verified by",
    terms: "By proceeding you accept our engineering terms & conditions.",
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
          locale: 'en_US'
        }),
      });

      const result = await response.json();
      
      if (result.url) {
        window.location.href = result.url;
      } else {
        alert('Could not generate payment link.');
      }
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  // Intro State
  const [showIntro, setShowIntro] = useState(true);
  const displayId = data.name;
  const introLine1 = mode === 'order'
    ? `Sales Order ${displayId} for`
    : `Quotation ${displayId} personally curated for`;
  const introLine2 = data.klant_naam;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#111] text-black dark:text-[#EDEDED] font-sans selection:bg-[#D4F846] selection:text-black overflow-x-hidden transition-colors duration-300 relative">
      
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 z-0 bg-grid-pattern opacity-[0.15] pointer-events-none" />
      
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
            <div className="max-w-4xl text-center flex flex-col items-center px-4 w-full">
                <div className="mb-8">
                    <div className="w-2 h-2 bg-[#D4F846] mx-auto rounded-full animate-pulse" />
                </div>
                
                <TextAnimate 
                  animation="blurIn" 
                  by="character" 
                  duration={2} 
                  className="text-xs md:text-3xl text-[#EDEDED] font-light uppercase tracking-wide leading-tight mb-4 block max-w-full"
                  style={{ fontFamily: 'Ppmonumentextended, sans-serif' }}
                >
                  {introLine1}
                </TextAnimate>

                <TextAnimate 
                  animation="blurIn" 
                  by="character" 
                  duration={1}
                  delay={2}
                  className="text-xl md:text-5xl text-[#EDEDED] font-bold uppercase tracking-wide leading-tight block text-[#D4F846] max-w-full"
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
      <nav className="fixed top-0 w-full z-40 bg-white/90 dark:bg-[#161616]/90 backdrop-blur-sm border-b border-gray-200 dark:border-[#333] transition-colors duration-300">
        <div className="max-w-[1280px] mx-auto px-4 md:px-12 lg:px-24 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="relative w-40 h-10">
               <Image
                 src="/logo.png"
                 alt="KORBACH"
                 fill
                 className="object-contain object-left dark:invert-0 invert"
               />
             </div>
             <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-gray-500 dark:text-[#666] border-l border-gray-200 dark:border-[#333] pl-4">
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
                 "text-[10px] md:text-xs font-bold uppercase tracking-widest py-2 px-4 md:py-3 md:px-6 skew-x-[-10deg] inline-block transition-colors",
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
                    <div className="absolute inset-0 border border-gray-200 dark:border-[#222] rounded-full opacity-20 scale-110" />
                    <div className="absolute inset-0 border border-dashed border-gray-300 dark:border-[#333] rounded-full opacity-20 scale-125 animate-spin-slow duration-[60s]" />
                    
                    {mainProduct.afbeelding ? (
                        <Image 
                            src={mainProduct.afbeelding} 
                            alt={mainProduct.parsed.title}
                            fill
                            className="object-contain drop-shadow-2xl z-10 rounded-2xl"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-[#111] rounded-2xl">
                            <Disc className="w-24 h-24 text-gray-300 dark:text-[#333]" />
                        </div>
                    )}
                </div>
                
                 {/* Technical Overlay Label for Wheels */}
                 <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-[#161616]/90 backdrop-blur-md border border-gray-200 dark:border-[#333] p-4 max-w-xs z-20 rounded-sm">
                    <div className="text-[10px] text-gray-500 dark:text-[#666] uppercase font-mono mb-1">Spec.</div>
                    {wheelProducts.map((wheel, i) => {
                      const parsed = parseProduct(wheel);
                      const etMatch =
                        parsed.description.match(/ET\s*-?\d+/i) ||
                        parsed.title.match(/ET\s*-?\d+/i);
                      const etDisplay = etMatch
                        ? `| ${etMatch[0].toUpperCase().replace(/\s+/, "")}`
                        : "";

                      return (
                        <div key={i} className="text-xs font-mono text-black dark:text-[#EDEDED]">
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
                    <div className={cn("w-2 h-2 transition-colors duration-300", 
                        mode === 'order' ? "bg-[#D4F846]" : (isExpired ? "bg-red-600" : "bg-[#D4F846] animate-pulse")
                    )} />
                    <span className={cn(
                        "font-mono text-xs uppercase tracking-widest transition-colors duration-300",
                        isExpired && mode !== 'order' ? "text-red-600 font-bold" : "text-[#D4F846]"
                    )}>
                        {mode === 'order' 
                            ? `Order Date: ${data.order_datum 
                                ? new Date(data.order_datum.replace(' ', 'T')).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
                                : new Date(data.geldig_tot).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                            : (timeLeft || "CALCULATING...")
                        }
                    </span>
                </div>
                
                <h1
                  className="text-5xl md:text-7xl lg:text-8xl tracking-tight mb-8 text-black dark:text-white"
                  style={{
                    fontFamily: 'Ppmonumentextended, sans-serif',
                    fontWeight: 400,
                    fontSize: '48px',
                    marginTop: 0,
                    marginBottom: '16px',
                  }}
                >
                    {mode === 'order' ? 'Order' : 'Prepared'}<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-black to-gray-500 dark:from-white dark:to-[#333]">
                        {mode === 'order' ? 'Confirmed' : 'For'}
                    </span><br/>
                    {mode !== 'order' && data.klant_naam.split(' ')[0]}
                </h1>

                <div className="border-l-2 border-[#D4F846] pl-6 mb-12">
                    <p className="text-xl md:text-2xl text-black dark:text-[#EDEDED] font-light uppercase tracking-wide mb-2">
                        {data.voertuig}
                    </p>
                    <p className="text-gray-500 dark:text-[#666] text-sm max-w-md leading-relaxed">
                        Precision engineered fitment. Optimized for weight reduction and structural integrity. 
                        Verified by Korbach Engineering Division.
                    </p>
                </div>

                 {/* Engineering Status - Authority */}
                 <div className="grid grid-cols-2 gap-4 max-w-md">
                     <div className="flex items-center gap-3 border border-gray-200 dark:border-[#333] p-3 bg-gray-50 dark:bg-[#111]">
                         <Check className="w-4 h-4 text-[#D4F846]" />
                         <span className="text-xs font-mono text-gray-400 dark:text-[#AAA] uppercase">FEA Analysis</span>
                     </div>
                     <div className="flex items-center gap-3 border border-gray-200 dark:border-[#333] p-3 bg-gray-50 dark:bg-[#111]">
                         <Check className="w-4 h-4 text-[#D4F846]" />
                         <span className="text-xs font-mono text-gray-400 dark:text-[#AAA] uppercase">Fitment Verified</span>
                     </div>
                     <div className="flex items-center gap-3 border border-gray-200 dark:border-[#333] p-3 bg-gray-50 dark:bg-[#111]">
                         <Check className="w-4 h-4 text-[#D4F846]" />
                         <span className="text-xs font-mono text-gray-400 dark:text-[#AAA] uppercase">Load Rating OK</span>
                     </div>
                     <div className="flex items-center gap-3 border border-gray-200 dark:border-[#333] p-3 bg-gray-50 dark:bg-[#111]">
                         <Check className="w-4 h-4 text-[#D4F846]" />
                         <span className="text-xs font-mono text-gray-400 dark:text-[#AAA] uppercase">JWL/VIA Standard</span>
                     </div>
                 </div>
            </motion.div>
        </section>


        {/* Configuration List - Single List Preserving Order */}
        <section className="mb-32">
            <div className="flex items-end justify-between mb-8 border-b border-gray-200 dark:border-[#333] pb-4">
                <h2 className="uppercase tracking-wide text-black dark:text-white" style={{ fontFamily: 'Ppmonumentextended, sans-serif', fontWeight: 400, fontSize: '34px', marginTop: 0, marginBottom: 0 }}>Build Configuration</h2>
                <span className="font-mono text-gray-500 dark:text-[#666] text-xs">REF: {data.name}</span>
            </div>

            <div className="flex flex-col">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 py-4 text-[10px] font-mono text-gray-500 dark:text-[#666] uppercase tracking-wider border-b border-gray-200 dark:border-[#333]">
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
                        className="group grid grid-cols-1 md:grid-cols-12 gap-4 py-8 border-b border-gray-200 dark:border-[#333] hover:border-[#D4F846] transition-colors relative"
                      >
                        <div className="absolute inset-0 bg-[#D4F846] opacity-0 group-hover:opacity-[0.02] transition-opacity pointer-events-none" />

                        <div className="col-span-12 md:col-span-2 font-mono text-[#D4F846] text-xs">
                          {product.parsed.code || "WHEEL-SET"}
                        </div>
                        <div className="col-span-12 md:col-span-6">
                          <h3
                            className="text-xl font-bold uppercase mb-2 text-black dark:text-white"
                            style={{ fontFamily: "Ppmonumentextended, sans-serif" }}
                          >
                            {product.parsed.title}
                          </h3>
                          <p className="text-gray-600 dark:text-[#888] text-sm leading-relaxed">
                            {product.parsed.description}
                          </p>
                          {product.concaveProfile && (
                            <div className="flex gap-4 mt-4">
                              <span className="text-xs font-mono bg-gray-50 dark:bg-[#0f0f0f] px-3 py-1 border border-gray-200 dark:border-[#333] text-[#D4F846] uppercase tracking-wider">
                                {product.concaveProfile} Concave
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="col-span-6 md:col-span-2 text-right font-mono text-black dark:text-[#EDEDED] flex items-start justify-end">
                          {product.quantity}
                        </div>
                        <div className="col-span-6 md:col-span-2 text-right font-mono text-black dark:text-[#EDEDED] text-lg">
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
                            className="group grid grid-cols-1 md:grid-cols-12 gap-4 py-6 border-b border-gray-200 dark:border-[#333] hover:border-[#D4F846] transition-colors items-center relative"
                        >
                            <div className="col-span-12 md:col-span-2 font-mono text-gray-500 dark:text-[#666] text-xs group-hover:text-[#D4F846] transition-colors">
                                {product.parsed.code || 'ENG-OPT'}
                            </div>
                            <div className="col-span-12 md:col-span-6">
                                <h4
                                  className="font-bold text-sm uppercase mb-1 text-black dark:text-white"
                                  style={{ fontFamily: 'Ppmonumentextended, sans-serif' }}
                                >
                                  {product.parsed.title}
                                </h4>
                                <p className="text-gray-500 dark:text-[#666] text-xs font-mono">{product.parsed.description}</p>
                            </div>
                            <div className="col-span-6 md:col-span-2 text-right font-mono text-black dark:text-[#EDEDED] text-sm">
                                {product.quantity}
                            </div>
                            <div className="col-span-6 md:col-span-2 text-right font-mono">
                                {isIncluded ? (
                                    <span className="text-[#D4F846] text-xs uppercase tracking-wider border border-[#D4F846]/30 bg-[#D4F846]/10 px-2 py-1">
                                        Included
                                    </span>
                                ) : (
                                    <span className="text-black dark:text-[#EDEDED]">{formatCurrency(product.prijs_per_stuk, data.valuta)}</span>
                                )}
                            </div>
                        </motion.div>
                    );
                  }
                })}
            </div>
        </section>


        {/* Conversion / Payment Section */}
        <section id="payment" className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-t border-gray-200 dark:border-[#333] pt-12 mb-32">
            
            <div className="lg:col-span-6 space-y-12">
                {/* 1. Header & Roadmap */}
                <div>
                    {/* Main Header replaces "Production Slot" */}
                    <h3 className="uppercase mb-16 text-black dark:text-white" style={{ fontFamily: 'Ppmonumentextended, sans-serif', fontWeight: 400, fontSize: '34px', marginTop: 0, marginBottom: 0 }}>
                        Production Roadmap
                    </h3>

                    <div className="relative border-l border-gray-200 dark:border-[#333] ml-2 pl-8 space-y-8">
                        {roadmapSteps.map((step, i) => (
                            <div key={i} className="relative">
                                <div className={cn(
                                    "absolute -left-[37px] w-4 h-4 rounded-full border-2 transition-colors duration-300 flex items-center justify-center",
                                    step.completed
                                        ? "bg-[#D4F846] border-[#D4F846]"
                                        : step.active 
                                            ? "bg-[#D4F846] border-[#D4F846] shadow-[0_0_10px_rgba(212,248,70,0.5)]" 
                                            : "bg-gray-50 dark:bg-[#111] border-gray-300 dark:border-[#333]"
                                )}>
                                    {step.completed && <Check className="w-3 h-3 text-black" />}
                                </div>
                                <h5 className={cn("text-xs font-bold uppercase mb-1", (step.active || step.completed) ? "text-[#D4F846]" : "text-gray-600 dark:text-[#888]")}>{step.title}</h5>
                                <p className="text-xs text-gray-500 dark:text-[#666] font-mono leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. FAQ (Accordion) */}
                <div className="border-t border-gray-200 dark:border-[#333] pt-8">
                    <h4 className="text-sm font-bold uppercase text-black dark:text-[#EDEDED] mb-4">Frequently Asked Questions</h4>
                    <div className="space-y-2">
                        {[
                            {
                                question: "Can I change my specs after deposit?",
                                answer: "Minor adjustments (finish/caps) are possible until the Engineering Sign-off. Structural changes require a re-quote."
                            },
                            {
                                question: "What about shipping costs?",
                                answer: "Standard shipping is included. Expedited air freight can be arranged upon request before final balance payment."
                            }
                        ].map((item, i) => (
                            <div key={i} className="border-b border-gray-200 dark:border-[#333] last:border-0">
                                <button
                                    onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                                    className="w-full flex justify-between items-center py-4 text-left group"
                                >
                                    <span className="text-xs text-black dark:text-[#EDEDED] font-bold group-hover:text-[#D4F846] transition-colors">
                                        {item.question}
                                    </span>
                                    <ChevronDown 
                                        className={cn(
                                            "w-4 h-4 text-gray-500 dark:text-[#666] transition-transform duration-300",
                                            openFaqIndex === i ? "rotate-180 text-[#D4F846]" : ""
                                        )} 
                                    />
                                </button>
                                <AnimatePresence>
                                    {openFaqIndex === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <p className="text-[10px] text-gray-500 dark:text-[#666] leading-relaxed pb-4 font-mono">
                                                {item.answer}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <MagicCard 
                className="lg:col-span-6 bg-white dark:bg-[#333] relative"
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
                            <span className="text-gray-500 dark:text-[#666] font-mono uppercase text-sm">{t.totalExcl}</span>
                            <span className="text-xl font-mono text-black dark:text-[#EDEDED] decoration-slice decoration-1 underline decoration-gray-300 dark:decoration-[#333] underline-offset-4">
                                {formatCurrency(data.totaal_excl, data.valuta)}
                            </span>
                        </div>

                        {data.has_tax && (
                          <div className="flex justify-between items-end mb-8 border-b border-gray-200 dark:border-[#333] pb-4">
                              <span className="text-gray-400 dark:text-[#444] font-mono uppercase text-xs">{t.totalIncl}</span>
                              <span className="text-sm font-mono text-gray-600 dark:text-[#888]">
                                  {formatCurrency(data.totaal_incl ?? 0, data.valuta)}
                              </span>
                          </div>
                        )}
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
                            <div className="flex flex-col">
                                <span className="text-[#D4F846] font-mono uppercase text-sm font-bold max-w-[200px] md:max-w-none leading-snug">
                                    {mode === 'order' ? 'Amount Paid' : t.totalDue}
                                </span>
                                {!isFullPayment && mode !== 'order' && (
                                    <span className="text-[10px] text-gray-500 dark:text-[#666] font-mono mt-1">
                                        {t.balanceDue}
                                    </span>
                                )}
                            </div>
                            <span className="text-4xl md:text-6xl font-extended text-[#D4F846] tracking-tighter">
                                {formatCurrency(data.aanbetaling, data.valuta)}
                            </span>
                        </div>

                        {mode === 'order' ? (
                             <div className="w-full font-bold uppercase font-extended tracking-widest py-6 bg-[#D4F846]/10 border border-[#D4F846]/20 text-[#D4F846] flex items-center justify-center gap-4 cursor-default">
                                <ShieldCheck className="w-5 h-5" />
                                Payment Received
                            </div>
                        ) : (
                            <button 
                                onClick={handlePayment}
                                disabled={isLoading || isExpired}
                                className={cn(
                                    "w-full font-bold uppercase font-extended tracking-widest py-6 transition-all transform flex items-center justify-center gap-4 group relative z-20",
                                    isExpired 
                                        ? "bg-gray-200 dark:bg-[#222] text-gray-500 dark:text-[#666] cursor-not-allowed border border-gray-300 dark:border-[#333]" 
                                        : "bg-[#D4F846] text-black hover:bg-white active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:cursor-wait"
                                )}
                            >
                                {isExpired ? 'OFFER EXPIRED' : (isLoading ? 'Processing...' : t.buttonText)}
                                {!isLoading && !isExpired && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                            </button>
                        )}
                        
                        {/* Trust & Conversion Elements */}
                        <div className="mt-8 flex flex-col items-center gap-4">
                            {/* Payment badges (Text-only) */}
                            <div className="flex flex-wrap justify-center gap-2 opacity-60">
                                {["iDEAL", "Bancontact", "Visa", "Mastercard", "PayPal", "Bank transfer"].map((label) => (
                                    <span key={label} className="text-[10px] font-mono border border-gray-300 dark:border-[#444] px-1.5 py-0.5 rounded text-gray-600 dark:text-[#888]">
                                        {label}
                                    </span>
                                ))}
                            </div>

                            <a
                              href="#"
                              onClick={(e) => e.preventDefault()}
                              className="text-[10px] font-mono text-gray-500 dark:text-[#666] underline underline-offset-4 hover:text-[#D4F846] transition-colors"
                            >
                              and 10+ other secure payment methods
                            </a>
                            
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-[#666]">
                                <div className="w-1.5 h-1.5 bg-[#D4F846] rounded-full" />
                                <span>Fully refundable until Design Sign-off</span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#333] w-full flex flex-col items-center">
                                <div className="text-[10px] text-gray-400 dark:text-[#444] font-mono uppercase tracking-widest mb-3">{t.verifiedBy}</div>
                                
                                {/* Vincent Avatar */}
                                <div className="relative w-12 h-12 mb-3">
                                    <Image 
                                        src="/vincent-pedroli.jpg" 
                                        alt="Vincent Pedroli"
                                        fill
                                        className="rounded-full object-cover border-2 border-[#D4F846]"
                                    />
                                </div>

                                <div className="text-xs text-gray-600 dark:text-[#888] font-bold uppercase" style={{ fontFamily: 'Ppmonumentextended, sans-serif' }}>Vincent Pedroli</div>
                                <div className="text-[9px] text-[#D4F846] font-mono">Fitment Specialist</div>
                            </div>
                        </div>

                        <p className="text-center mt-6 text-gray-400 dark:text-[#444] text-[10px] font-mono uppercase">
                            {t.terms}
                        </p>
                    </div>
                </div>
            </MagicCard>

        </section>

      </motion.div>

       {/* Footer Anchor */}
       <footer className="bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-[#222] py-16 transition-colors duration-300">
            <div className="max-w-[1280px] mx-auto px-4 md:px-12 lg:px-24 flex flex-col md:flex-row justify-between items-center gap-6">
                
                <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center gap-6">
                         {/* Logo */}
                         <div className="relative w-32 h-8 opacity-90">
                           <Image src="/logo.png" alt="KORBACH" fill className="object-contain object-left dark:invert-0 invert" />
                         </div>
                         
                         <div className="h-4 w-px bg-gray-300 dark:bg-[#333]" />
                         
                         {/* Status Indicator */}
                         <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative">
                                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
                            </div>
                            <span className="text-[10px] text-gray-500 dark:text-[#666] font-mono uppercase tracking-wide">All systems operational</span>
                         </div>
                    </div>
                    
                    <div className="text-gray-500 dark:text-[#333] font-mono text-[10px] uppercase tracking-wider">
                        © {new Date().getFullYear()} Korbach Forged. All rights reserved.
                    </div>
                </div>

                {/* Right side: Theme Toggler */}
                <div>
                   <AnimatedThemeToggler />
                </div>
            </div>
       </footer>

    </div>
  );
}
