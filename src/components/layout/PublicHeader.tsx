import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Logo from "@/assets/logo.svg";
import Logoar from "@/assets/logoar.svg";
import DarkLogo from "@/assets/darklogo.svg";
import DarkLogoAr from "@/assets/darklogoar.svg";
import { useTheme } from "@/contexts/ThemeContext";
interface PublicHeaderProps {
  showBackToHome?: boolean;
  showActions?: boolean;
  variant?: "default" | "auth";
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ 
  showBackToHome = false, 
  showActions = true,
  variant = "default"
}) => {
  const { i18n } = useTranslation();
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

  // Check if we're on a subdomain
  const isSubdomain = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    // Special handling for localhost development
    if (parts.includes('localhost')) {
      // For localhost, any prefix is considered a subdomain (e.g., tenant.localhost)
      return parts.length > 1 && parts[0] !== 'localhost';
    }
    
    // For production domains, consider it a subdomain if there are more than 2 parts (e.g., subdomain.example.com)
    return parts.length > 2 && !hostname.startsWith('www.');
  };

  // Get main domain URL (remove subdomain)
  const getMainDomainUrl = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';
    
    // Special handling for localhost development
    if (parts.includes('localhost')) {
      return `${protocol}//localhost${port}`;
    }
    
    // For production domains
    if (parts.length > 2) {
      // Remove the first part (subdomain) and reconstruct the URL
      const mainDomain = parts.slice(1).join('.');
      return `${protocol}//${mainDomain}${port}`;
    }
    return window.location.origin;
  };

  const handleOrganizationsClick = () => {
    window.location.href = getMainDomainUrl();
  };
  return (
    <nav className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "flex items-center h-16",
          isRTL ? "flex-row-reverse justify-between" : "justify-between"
        )}>
          {/* Logo */}
          {/* <Link to="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl text-foreground">ClinicPro</span>
          </Link> */}

<Link to="/" className={cn(
  "flex items-center",
  isRTL ? "order-2" : "order-1"
)}>
  <img
    src={isRTL ? (theme === "dark" ? DarkLogoAr : Logoar) : (theme === "dark" ? DarkLogo : Logo)}
    alt="ClinicPro Logo"
    className="h-10 w-auto"
  />
</Link>


          {/* Navigation Actions */}
          <div className={cn(
            "flex items-center",
            isRTL ? "space-x-reverse space-x-4 order-1" : "space-x-4 order-2"
          )}>
            {showBackToHome && (
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            )}
            
            {/* Organizations link - only show on subdomain */}
            {isSubdomain() && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOrganizationsClick}
                className="flex items-center"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Organizations
              </Button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />
            
            {showActions && variant === "default" && (
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
            )}
            
            {showActions && variant === "auth" && (
              <Link to="/admin">
                <Button size="sm"> Admin Login</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicHeader;

