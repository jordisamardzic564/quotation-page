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
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-black transition-colors duration-300 hover:bg-gray-100 dark:border-[#333] dark:bg-[#111] dark:text-[#EDEDED] dark:hover:bg-[#222]",
        className
      )}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 transition-all duration-500 ease-in-out rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 transition-all duration-500 ease-in-out rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

