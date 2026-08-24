"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqAccordionItem {
  question: string;
  answer: string;
}

export function FaqAccordion({
  items,
  className,
}: {
  items: FaqAccordionItem[];
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.question}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <span>{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300",
                  isOpen && "rotate-180 text-primary",
                )}
              />
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="px-4 pb-4 text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
