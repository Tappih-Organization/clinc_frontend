import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import { useTranslation } from "react-i18next";
// Light mode now has dark purple background, so we need light/white logos
// Dark mode now has white background, so we need dark logos
import LightModeLogo from "@/assets/_clinc tappih الايقونه وايت.svg"; // Tappih white logo for light mode (dark purple bg)
import LightModeLogoAr from "@/assets/_clinc tappih الايقونه وايت.svg"; // Tappih white logo AR for light mode
import DarkModeLogo from "@/assets/_clinc tappih - الايقونه في حاله الدارك.svg"; // Tappih dark logo for dark mode (white bg)
import DarkModeLogoAr from "@/assets/_clinc tappih - الايقونه في حاله الدارك.svg"; // Tappih dark logo AR for dark mode
import { useTheme } from "@/contexts/ThemeContext";

const NotFound = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [isRTL, setIsRTL] = React.useState(false);

  // Check if current language is RTL (Arabic, Hebrew, etc.)
  React.useEffect(() => {
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
  return (
    <div className="w-full bg-background min-h-screen">
      <PublicHeader />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-md mx-auto"
      >
        {/* Logo */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center">
            <img
              src={isRTL
                ? (theme === "dark" ? DarkModeLogoAr : LightModeLogoAr)
                : (theme === "dark" ? DarkModeLogo : LightModeLogo)
              }
              alt="tappih Logo"
              className="h-16 w-auto"
            />
          </Link>
        </div>

        {/* 404 Display */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t("Page Not Found")}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t("The page you're looking for doesn't exist or has been moved.")}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                {t("Go Home")}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Go Back")}
            </Button>
          </div>
        </motion.div>

        {/* Additional Help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 text-sm text-muted-foreground"
        >
          <p>
            {t("Need help?")}{" "}
            <Link to="/#contact" className="text-primary hover:underline">
              {t("Contact our support team")}
            </Link>
          </p>
        </motion.div>
      </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
