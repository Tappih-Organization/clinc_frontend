import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useDemoUsers } from "@/hooks/useDemoUsers";
import { useTenants } from "@/hooks/useTenants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Stethoscope,
  Users,
  Calculator,
  UserCheck,
  RefreshCw,
  Building2,
  Mail,
  Lock,
  Lightbulb,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  Activity,
  Sparkles,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { clinicCookies, iframeUtils } from "@/utils/cookies";
import PublicHeader from "@/components/layout/PublicHeader";
import TenantSelector from "@/components/tenant/TenantSelector";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import Logo from "@/assets/logo.svg";
import Logoar from "@/assets/logoar.svg";
import DarkLogo from "@/assets/darklogo.svg";
import DarkLogoAr from "@/assets/darklogoar.svg";

const MainLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, loading: authLoading } = useAuth();
  const { 
    tenants, 
    currentTenant, 
    loading: tenantsLoading, 
    error: tenantsError, 
    refetch: refetchTenants,
    isMultiTenant,
    currentSubdomain 
  } = useTenants();
  
  const { demoAccounts, loading: demoLoading, error: demoError, refetch: refetchDemoUsers } = useDemoUsers(
    currentTenant ? { tenantId: currentTenant.id } : undefined
  );
  
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const { theme } = useTheme();



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent any default form behavior
    if (e.target) {
      e.stopPropagation();
    }
    
    // Validate inputs before attempting login
    if (!email.trim() || !password.trim()) {
      setError(t("Please enter both email and password."));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const success = await login(email, password);
      
      if (success) {
        toast({
          title: t("Login successful"),
          description: t("Welcome back to Tappih!"),
        });
        // Always redirect to clinic selection page after login
        // Users must select a clinic before accessing the dashboard
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath && redirectPath !== '/dashboard' && !redirectPath.startsWith('/dashboard')) {
          // If there's a specific stored path (not dashboard), save it for after clinic selection
          sessionStorage.setItem('redirectAfterClinicSelection', redirectPath);
          sessionStorage.removeItem('redirectAfterLogin');
        } else {
          sessionStorage.removeItem('redirectAfterLogin');
        }
        // Always go to clinic selection first
        navigate("/select-clinic", { replace: true });
      } else {
        // When login returns false, it means invalid credentials
        setError(t("Invalid email or password. Please check your credentials and try again."));
      }
    } catch (err: any) {
      console.error("Login error:", err);
      // Handle different types of errors
      if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err?.message) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError(t("An error occurred during login. Please try again."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsLoading(true);
    setError("");

    try {
      const success = await login(demoEmail, demoPassword);
      
      if (success) {
        toast({
          title: t("Demo login successful"),
          description: t("Welcome to Tappih demo!"),
        });
        // Check if there's a stored redirect path
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(redirectPath, { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        setError(t("Demo login failed. Invalid credentials for demo account."));
      }
    } catch (err: any) {
      console.error("Demo login error:", err);
      // Handle different types of errors
      if (err?.response?.data?.message) {
        setError(`Demo login failed: ${err.response.data.message}`);
      } else if (err?.message) {
        setError(`Demo login failed: ${err.message}`);
      } else if (typeof err === 'string') {
        setError(`Demo login failed: ${err}`);
      } else {
        setError(t("Demo login failed. Please try again."));
      }
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className={cn("w-full min-h-screen flex", isRTL && "flex-row-reverse")}>
      {/* Left Column - Login Form */}
      <div className="w-full lg:w-1/2 bg-white dark:bg-background flex flex-col">
        {/* Header with Logo */}
        <div className="p-6 lg:p-8">
          <div className={cn("flex items-center gap-3 mb-8", isRTL && "flex-row-reverse")}>
            <img
              src={isRTL ? (theme === "dark" ? DarkLogoAr : Logoar) : (theme === "dark" ? DarkLogo : Logo)}
              alt="Tappih Logo"
              className="h-10 w-auto"
            />
          </div>
        </div>

        {/* Login Form */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <h1 className={cn("text-3xl font-bold text-foreground mb-2", isRTL ? "font-arabic" : "")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>{t("Log in")}</h1>
            <p className={cn("text-muted-foreground mb-8", isRTL ? "font-arabic" : "")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>
              {t("Sign in to your Tappih account to continue")}
            </p>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate autoComplete="off">
              {/* Email Input */}
              <div className="space-y-2">
                <div className="relative">
                  <Mail className={cn("absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("Your email")}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    required
                    disabled={isLoading}
                    className={cn("h-12", isRTL ? "pr-10 text-right font-arabic" : "pl-10")}
                    style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="relative">
                  <Lock className={cn("absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("Password")}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    required
                    disabled={isLoading}
                    className={cn("h-12", isRTL ? "pr-10 pl-10 text-right font-arabic" : "pl-10 pr-10")}
                    style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn("absolute top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", isRTL ? "left-3" : "right-3")}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className={cn("w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg hover:shadow-xl transition-all", isRTL && "font-arabic")}
                style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}
                disabled={isLoading || authLoading || !email.trim() || !password.trim()}
              >
                {(isLoading || authLoading) ? (
                  <>
                    <Loader2 className={cn("w-5 h-5 animate-spin", isRTL ? "ml-2" : "mr-2")} />
                    {t("Signing in...")}
                  </>
                ) : (
                  t("Log In")
                )}
              </Button>
            </form>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="p-6 lg:p-8 text-center">
          <p className={cn("text-xs text-muted-foreground", isRTL && "font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>
            {t("Version")} 0.2 — {t("Beta")}
          </p>
        </div>
      </div>

      {/* Right Column - Promotional Content */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(to bottom right, #191523, #8a63d6)'
      }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10"
        >
          {/* Main Headline */}
          <h2 className={cn("text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight", isRTL && "font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>
            {t("All-in-one, AI-powered healthcare management platform.")}
          </h2>

          {/* Feature Card */}
          <div className="relative mt-12">
            {/* Lightbulb Icon */}
            <div className={cn("absolute -top-4 z-20", isRTL ? "-right-4" : "-left-4")}>
              <div className="h-12 w-12 rounded-full bg-white shadow-xl flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-yellow-500" />
              </div>
            </div>

            {/* Card */}
            <Card className="bg-white shadow-2xl border-0 p-4 relative z-10">
              <CardHeader className="pb-0">
                <CardTitle className={cn("text-xl font-bold text-foreground", isRTL && "font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>
                  {t("Why tappih?")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <p className={cn("text-sm text-muted-foreground leading-relaxed mb-3", isRTL && "font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>
                  {t("Tappih brings all your healthcare operations into one cloud-based platform, powered by intelligent technology for seamless management. Smarter control, full visibility, and scalability designed to grow with your healthcare business.")}
                </p>
                <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", isRTL && "flex-row-reverse")}>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className={cn(isRTL && "font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>{t("More than 220 clinics.")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Tags */}
          <div className={cn("flex flex-wrap gap-3 mt-8", isRTL && "flex-row-reverse")}>
            <Badge className={cn("bg-blue-500 text-white hover:bg-blue-600 px-4 py-2", isRTL && "font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>
              <Calendar className={cn("h-3 w-3", isRTL ? "ml-1" : "mr-1")} />
              {t("Appointments")}
            </Badge>
            <Badge className={cn("bg-orange-500 text-white hover:bg-orange-600 px-4 py-2", isRTL && "font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>
              <UserCheck className={cn("h-3 w-3", isRTL ? "ml-1" : "mr-1")} />
              {t("CRM")}
            </Badge>
            <Badge className={cn("bg-green-500 text-white hover:bg-green-600 px-4 py-2", isRTL && "font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>
              <Users className={cn("h-3 w-3", isRTL ? "ml-1" : "mr-1")} />
              {t("Patients")}
            </Badge>
            <Badge className={cn("bg-red-500 text-white hover:bg-red-600 px-4 py-2", isRTL && "font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>
              <DollarSign className={cn("h-3 w-3", isRTL ? "ml-1" : "mr-1")} />
              {t("Financial")}
            </Badge>
            <Badge className={cn("bg-purple-500 text-white hover:bg-purple-600 px-4 py-2", isRTL && "font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>
              <Activity className={cn("h-3 w-3", isRTL ? "ml-1" : "mr-1")} />
              {t("Odontograms")}
            </Badge>
            <Badge className={cn("bg-indigo-500 text-white hover:bg-indigo-600 px-4 py-2", isRTL && "font-arabic")} style={isRTL ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : {}}>
              <Sparkles className={cn("h-3 w-3", isRTL ? "ml-1" : "mr-1")} />
              {t("AI Assistant")}
            </Badge>
          </div>
        </motion.div>
      </div>

      {/* iframe Access Notice - Mobile */}
      {iframeUtils.isInIframe() && (
        <div className="fixed bottom-4 left-4 right-4 lg:hidden z-50">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800 text-center text-xs">
              <div className="flex flex-col items-center gap-1">
                <span>{t("Having trouble accessing the login?")}</span>
                <a 
                  href="https://clinic-management-system-kappa.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  {t("Try the direct link →")}
                </a>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default MainLogin;
