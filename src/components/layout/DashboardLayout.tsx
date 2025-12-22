import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const DashboardLayout = () => {
  const { i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isRTL, setIsRTL] = useState(false);

  // Check if current language is RTL (Arabic, Hebrew, etc.)
  useEffect(() => {
    const checkDirection = () => {
      const dir = document.documentElement.getAttribute("dir") || "ltr";
      setIsRTL(dir === "rtl");
    };

    // Check on mount
    checkDirection();

    // Listen for language changes
    i18n.on("languageChanged", checkDirection);

    // Listen for direction changes in document
    const observer = new MutationObserver(checkDirection);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir"],
    });

    return () => {
      i18n.off("languageChanged", checkDirection);
      observer.disconnect();
    };
  }, [i18n]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      // Auto-close sidebar on mobile when screen size changes
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);
  const openSidebar = () => setSidebarOpen(true);

  return (
    <div className="min-h-screen bg-background flex overflow-hidden dashboard-layout">
      {/* Desktop Sidebar - Fixed positioning, doesn't take space */}
      <div className="hidden lg:block lg:w-0 lg:flex-none lg:overflow-visible">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>

      {/* Mobile Sidebar */}
      {isMobile && (
        <>
          <div
            className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
              sidebarOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <div
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={closeSidebar}
            />
            <div
              className={cn(
                "absolute top-0 h-full w-80 max-w-[85vw] transform transition-transform duration-300 ease-in-out",
                isRTL ? "right-0" : "left-0",
                sidebarOpen 
                  ? "translate-x-0" 
                  : isRTL 
                    ? "translate-x-full" 
                    : "-translate-x-full"
              )}
            >
              <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
            </div>
          </div>
        </>
      )}

      {/* Main content area */}
      <div className={cn(
        "flex flex-col min-w-0 dashboard-main",
        isRTL 
          ? "flex-1 lg:mr-64" 
          : "flex-1 lg:ml-64"
      )}>
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-background border-b border-border shadow-sm">
          <TopBar onMenuClick={openSidebar} />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 min-h-full max-w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-full overflow-hidden"
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
