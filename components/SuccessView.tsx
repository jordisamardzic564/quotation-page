'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  Check, 
  Download, 
  ArrowRight, 
  Home,
  Printer
} from 'lucide-react';
import { Quotation } from '@/types/quotation';
import { MagicCard } from '@/components/magicui/magic-card';

interface SuccessViewProps {
  data: Quotation;
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function SuccessView({ data }: SuccessViewProps) {
  // Bepaal de betaalde som (aanbetaling of totaal)
  // Als payment_mode 'full' is of aanbetaling >= totaal, dan is alles betaald.
  // Anders is de aanbetaling betaald.
  const isFullPayment = data.payment_mode === 'full' || (data.aanbetaling >= data.totaal_excl);
  const paidAmount = isFullPayment ? data.totaal_excl : data.aanbetaling;
  const paymentLabel = isFullPayment ? "Total Paid" : "Deposit Paid";
  
  // Gebruik altijd het name veld (S-nummer).
  // Fallback naar een placeholder als 'name' leeg is, zodat de layout niet breekt.
  const displayId = data.name || "—";

  // Debug logging om te controleren of 'name' goed doorkomt
  React.useEffect(() => {
    console.log("SuccessView Data:", data);
    if (!data.name) {
      console.warn("Warning: 'name' field is empty in quotation data!", data);
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#161616] text-black dark:text-[#EDEDED] font-sans selection:bg-[#D4F846] selection:text-black overflow-x-hidden flex flex-col transition-colors duration-300">
      
      {/* Decorative Crosshairs Fixed */}
      <div className="fixed top-8 left-8 w-4 h-4 border-l border-t border-gray-300 dark:border-[#333] z-50 opacity-50" />
      <div className="fixed top-8 right-8 w-4 h-4 border-r border-t border-gray-300 dark:border-[#333] z-50 opacity-50" />
      <div className="fixed bottom-8 left-8 w-4 h-4 border-l border-b border-gray-300 dark:border-[#333] z-50 opacity-50" />
      <div className="fixed bottom-8 right-8 w-4 h-4 border-r border-b border-gray-300 dark:border-[#333] z-50 opacity-50" />

      {/* Navbar (Simplified) */}
      <nav className="w-full z-40 bg-white/90 dark:bg-[#161616]/90 backdrop-blur-sm border-b border-gray-200 dark:border-[#333] transition-colors duration-300">
        <div className="max-w-[1280px] mx-auto px-4 md:px-12 lg:px-24 h-20 flex items-center justify-between">
          <div className="relative w-40 h-10">
             <Image
               src="/logo.png"
               alt="KORBACH"
               fill
               className="object-contain object-left dark:invert-0 invert"
             />
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-gray-500 dark:text-[#666] border-l border-gray-200 dark:border-[#333] pl-4">
             <span>SECURE TRANSMISSION</span>
             <span className="text-[#D4F846]">/// ESTABLISHED</span>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Visual & Status */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="order-2 lg:order-1"
            >
                <div className="mb-8 relative">
                    {/* Animated Checkmark Circle */}
                    <div className="w-24 h-24 rounded-full border border-[#D4F846] flex items-center justify-center relative mb-6">
                        <div className="absolute inset-0 bg-[#D4F846] opacity-10 rounded-full animate-pulse" />
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 10 }}
                        >
                            <Check className="w-10 h-10 text-[#D4F846]" strokeWidth={3} />
                        </motion.div>
                    </div>

                    <h1 className="text-4xl md:text-5xl tracking-tight mb-4 text-black dark:text-white" style={{ fontFamily: 'Ppmonumentextended, sans-serif' }}>
                        Production<br/>
                        <span className="text-[#D4F846]">Slot Secured</span>
                    </h1>
                    
                    <p className="text-gray-600 dark:text-[#888] text-sm md:text-base leading-relaxed font-mono max-w-md">
                        Thank you, {data.klant_naam.split(' ')[0]}. Your payment has been successfully processed. 
                        Your build configuration is now locked in our engineering queue.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button className="flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 dark:bg-[#111] border border-gray-300 dark:border-[#333] text-black dark:text-[#EDEDED] hover:border-[#D4F846] hover:text-[#D4F846] transition-all group w-full sm:w-auto">
                        <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Download Invoice</span>
                    </button>
                    
                    <a href="/" className="flex items-center justify-center gap-3 px-6 py-4 bg-[#D4F846] text-black hover:bg-white transition-colors w-full sm:w-auto">
                        <span className="text-xs font-bold uppercase tracking-widest">Return Home</span>
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </motion.div>

            {/* Right Column: Receipt Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="order-1 lg:order-2 w-full"
            >
                <MagicCard 
                    className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222]"
                    gradientColor="#222"
                    gradientOpacity={0.5}
                >
                    <div className="p-8 relative">
                        {/* Receipt Header */}
                        <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200 dark:border-[#222]">
                            <div>
                                <div className="text-[10px] text-gray-500 dark:text-[#666] uppercase font-mono tracking-widest mb-1">Receipt for</div>
                                <div className="text-sm font-bold text-black dark:text-[#EDEDED]">{data.klant_naam}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-gray-500 dark:text-[#666] uppercase font-mono tracking-widest mb-1">Date</div>
                                <div className="text-sm font-mono text-black dark:text-[#EDEDED]">{new Date().toLocaleDateString('en-US')}</div>
                            </div>
                        </div>

                        {/* Receipt Details */}
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600 dark:text-[#888] font-mono uppercase">Configuration ID</span>
                                <span className="text-xs text-black dark:text-[#EDEDED] font-mono">{displayId}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600 dark:text-[#888] font-mono uppercase">Vehicle</span>
                                <span className="text-xs text-black dark:text-[#EDEDED] font-mono">{data.voertuig}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600 dark:text-[#888] font-mono uppercase">Payment Status</span>
                                <span className="text-xs text-[#D4F846] font-mono uppercase flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-[#D4F846] rounded-full animate-pulse"></span>
                                    Verified
                                </span>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="bg-gray-50 dark:bg-[#161616] p-6 rounded border border-gray-200 dark:border-[#222]">
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-gray-500 dark:text-[#666] font-mono uppercase mb-1">{paymentLabel}</span>
                                <span className="text-2xl text-[#D4F846]" style={{ fontFamily: 'Ppmonumentextended, sans-serif' }}>
                                    {formatCurrency(paidAmount, data.valuta)}
                                </span>
                            </div>
                            {!isFullPayment && (
                                <div className="mt-2 text-[10px] text-gray-400 dark:text-[#444] font-mono text-right">
                                    Remaining Balance: {formatCurrency(data.totaal_excl - paidAmount, data.valuta)}
                                </div>
                            )}
                        </div>
                        
                        {/* Decorative Barcode */}
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-[#222] flex justify-between items-end opacity-40">
                            {/* Barcode image needs invert for light mode */}
                            <div className="h-8 w-48 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMzAiPjxyZWN0IHdpZHRoPSIyIiBoZWlnaHQ9IjMwIiB4PSIwIiBmaWxsPSIjZmZmIi8+PHJlY3Qgd2lkdGg9IjIiIGhlaWdodD0iMzAiIHg9IjQiIGZpbGw9IiNmZmYiLz48cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIzMCIgeD0iOCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjMwIiB4PSIxNCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] bg-repeat-x dark:filter-none invert" />
                            <span className="font-mono text-[10px] text-gray-500 dark:text-[#666]">AUTH: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                        </div>
                    </div>
                </MagicCard>
            </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 dark:border-[#222] bg-gray-50 dark:bg-[#111] transition-colors duration-300">
         <div className="max-w-[1280px] mx-auto px-4 md:px-12 text-center text-[10px] text-gray-400 dark:text-[#444] font-mono uppercase tracking-widest">
            Korbach Forged /// Engineering Division
         </div>
      </footer>
    </div>
  );
}

