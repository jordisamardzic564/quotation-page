"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AnimatedThemeToggler({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("w-8 h-8 opacity-0", className)} />
    );
  }

  return (
    <button
      className={cn(
        "relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#333] bg-[#111] text-[#EDEDED] transition-colors hover:bg-[#222] dark:border-[#333] dark:bg-[#111] dark:text-[#EDEDED] light:border-gray-200 light:bg-white light:text-black",
        className
      )}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-black dark:text-white" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-black dark:text-white" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

