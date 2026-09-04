"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus } from "lucide-react";

// Collapsible wrapper around a group of category cards. The group title sits
// as a badge centered on the container's top edge, and the small circular
// button on the top-left corner folds the whole grid away. The cards
// themselves are passed as children so their own design stays untouched.
export default function CategoryGroupSection({
  title,
  defaultOpen = true,
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="relative bg-gray-100 rounded-2xl px-2 sm:px-4 pt-12 pb-4 sm:pb-5">
      {/* Group title badge — centered and overlapping the top border */}
      <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-400 to-amber-500 text-white font-bold text-sm sm:text-base px-6 py-2 rounded-2xl shadow-md whitespace-nowrap">
        {title}
      </span>

      {/* Expand / collapse toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={isOpen ? `طي فئات ${title}` : `عرض فئات ${title}`}
        className="absolute top-3 left-3 sm:top-4 sm:left-4 w-8 h-8 rounded-full border border-slate-300 bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-white hover:border-slate-400 transition cursor-pointer"
      >
        {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      </button>

      {/* Cards grid — folds away smoothly instead of snapping shut. The inner
          padding keeps a selected card's amber glow from being clipped by the
          overflow-hidden the height animation needs. */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="cards"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 p-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
