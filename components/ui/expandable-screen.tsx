"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/lib/use-mobile";

interface ExpandableScreenContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  layoutId: string;
  triggerRadius: string;
  contentRadius: string;
}

const ExpandableScreenContext = createContext<ExpandableScreenContextType | undefined>(undefined);

export function useExpandableScreen() {
  const context = useContext(ExpandableScreenContext);
  if (!context) {
    throw new Error("useExpandableScreen must be used within an ExpandableScreen provider");
  }
  return context;
}

interface ExpandableScreenProps {
  children: React.ReactNode;
  layoutId?: string;
  triggerRadius?: string;
  contentRadius?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ExpandableScreen({
  children,
  layoutId = "expandable-help-card",
  triggerRadius = "12px",
  contentRadius = "24px",
  isOpen: controlledIsOpen,
  onOpenChange,
}: ExpandableScreenProps) {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const setIsOpen = (open: boolean) => {
    if (!isControlled) {
      setUncontrolledIsOpen(open);
    }
    onOpenChange?.(open);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  return (
    <ExpandableScreenContext.Provider
      value={{ isOpen, setIsOpen, layoutId, triggerRadius, contentRadius }}
    >
      {children}
    </ExpandableScreenContext.Provider>
  );
}

export function ExpandableScreenTrigger({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { setIsOpen, layoutId, triggerRadius } = useExpandableScreen();

  return (
    <motion.div
      layoutId={layoutId}
      style={{ borderRadius: triggerRadius }}
      onClick={() => setIsOpen(true)}
      className={`cursor-pointer overflow-hidden transform-gpu ${className}`}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}

export function ExpandableScreenContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isOpen, setIsOpen, layoutId, contentRadius } = useExpandableScreen();
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile(768);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!mounted) return null;

  const contentJSX = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isMobile ? 0.25 : 0.15, ease: "easeOut" }}
            className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-sm will-change-[opacity]"
            onClick={() => setIsOpen(false)}
          />

          {/* Morphing Screen Content */}
          <div
            className={`fixed inset-0 z-[99999] flex ${
              isMobile
                ? "items-end justify-center p-0"
                : "items-center justify-center p-3 md:p-6"
            } pointer-events-none`}
          >
            <motion.div
              {...(!isMobile ? { layoutId } : {})}
              initial={isMobile ? { y: "100%", opacity: 0 } : undefined}
              animate={isMobile ? { y: 0, opacity: 1 } : undefined}
              exit={isMobile ? { y: "100%", opacity: 0 } : undefined}
              transition={
                isMobile
                  ? {
                      type: "spring",
                      damping: 32,
                      stiffness: 340,
                      mass: 0.8,
                    }
                  : {
                      type: "spring",
                      stiffness: 380,
                      damping: 32,
                      mass: 0.7,
                    }
              }
              style={
                isMobile
                  ? {
                      borderTopLeftRadius: "24px",
                      borderTopRightRadius: "24px",
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                    }
                  : { borderRadius: contentRadius }
              }
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className={`pointer-events-auto relative w-full ${
                isMobile
                  ? "max-w-full h-[90vh] max-h-[92vh]"
                  : "max-w-4xl h-[92vh] max-h-[96vh]"
              } overflow-hidden shadow-2xl flex flex-col transform-gpu will-change-transform ${className}`}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(contentJSX, document.body);
}
