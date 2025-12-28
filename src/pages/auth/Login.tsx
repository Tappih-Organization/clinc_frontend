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
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { clinicCookies, iframeUtils } from "@/utils/cookies";
import PublicHeader from "@/components/layout/PublicHeader";
import TenantSelector from "@/components/tenant/TenantSelector";
import { useTranslation } from "react-i18next";

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
        navigate("/dashboard");
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
        navigate("/dashboard");
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
    <div className="w-full bg-background min-h-screen">
      <PublicHeader variant="auth" />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-7xl mx-auto">
        {/* iframe Access Notice */}
        {iframeUtils.isInIframe() && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800 dark:text-blue-300 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <span>{t("Having trouble accessing the login?")}</span>
                <a 
                  href="https://clinic-management-system-kappa.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline transition-colors"
                >
                  {t("Try the direct link to our original domain →")}
                </a>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Debug Information for iframe contexts */}
        {iframeUtils.isInIframe() && process.env.NODE_ENV === 'development' && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-800">
              <details className="cursor-pointer">
                <summary className="font-medium mb-2">🔧 {t("Debug Information (Dev Mode)")}</summary>
                <pre className="text-xs bg-amber-100 p-2 rounded mt-2 overflow-x-auto">
                  {JSON.stringify(clinicCookies.getStorageDiagnostics(), null, 2)}
                </pre>
              </details>
            </AlertDescription>
          </Alert>
        )}

        {/* Logo */}


     
         
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className=" mb-8 justify-center w-full max-w-3xl mx-auto"
          >
            {/* Left Column: Login Form + Role-Based Access Control */}
            <div className="space-y-6">
            {/* Login Form */}
            <Card className="shadow-xl border-0 h-fit">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl lg:text-2xl font-bold">{t("Welcome back")}</CardTitle>
                <CardDescription>
                  {t("Sign in to your Tappih account to continue")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800 font-medium">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <form 
                  onSubmit={handleSubmit} 
                  className="space-y-4 jsutify-center"
                  noValidate
                  autoComplete="off"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("Email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("Enter your email")}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        // Clear error when user starts typing
                        if (error) setError("");
                      }}
                      required
                      disabled={isLoading}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t("Password")}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("Enter your password")}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          // Clear error when user starts typing
                          if (error) setError("");
                        }}
                        required
                        disabled={isLoading}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                    >
                      {t("Forgot password?")}
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={isLoading || authLoading || !email.trim() || !password.trim()}
                  >
                    {(isLoading || authLoading) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("Signing in...")}
                      </>
                    ) : (
                      t("Sign In")
                    )}
                  </Button>
                </form>

         
              </CardContent>
            </Card>

       
          </div>

                    
    
          </motion.div>
 
      </div>
      </div>
      
      {/* Version Footer */}
      <div className="w-full flex justify-center pb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("Version")} 0.2 — {t("Beta")}
        </p>
      </div>
    </div>
  );
};

export default MainLogin;
