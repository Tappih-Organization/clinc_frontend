import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Logo from "@/assets/logomini.svg";
import Logoar from "@/assets/logoar.svg";
import DarkLogo from "@/assets/darklogo.svg";
import DarkLogoAr from "@/assets/darklogoar.svg";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Home,
  Users,
  Calendar,
  UserPlus,
  DollarSign,
  Package,
  UserCheck,
  Receipt,
  Stethoscope,
  CalendarDays,
  BarChart3,
  Settings,
  X,
  Shield,
  CreditCard,
  FileText,
  Briefcase,
  TestTube2,
  Building,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Clock,
  Droplets,
  Folder,
  Activity,
  Building2,
  Brain,
  Zap,
  Sparkles,
  Target,
  FlaskConical,
  Wallet,
  BriefcaseMedical,
  Users2,
  FileBarChart,
  BarChart2,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  permission?: string;
  permissions?: string[]; // Multiple permissions (OR logic)
  requiresAnyPermission?: boolean; // If true, user needs any of the permissions; if false, user needs all permissions
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
  icon?: React.ComponentType<{ className?: string }>; // Icon for the section
  collapsible?: boolean; // Whether this section can be collapsed
  defaultCollapsed?: boolean; // Default collapsed state
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = useClinic();
  const { theme } = useTheme();
  const [isTestModulesOpen, setIsTestModulesOpen] = useState(false);
  const [isRTL, setIsRTL] = useState(false);
  // State to manage collapsed/expanded state for each section
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

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

  // Check if section is collapsed
  const isSectionCollapsed = (sectionTitle: string, defaultCollapsed?: boolean) => {
    if (collapsedSections[sectionTitle] !== undefined) {
      return collapsedSections[sectionTitle];
    }
    return defaultCollapsed ?? false;
  };

  // Toggle section collapse state
  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const canAccessItem = (item: NavigationItem) => {
    // Super Admin and Admin users have access to everything - bypass all permission checks
    if (user?.role === 'super_admin' || user?.role === 'admin') {
      return true;
    }

    // Dashboard should be accessible to all authenticated users
    if (item.href === "/dashboard") return true;

    // Check single permission
    if (item.permission) {
      return hasPermission(item.permission);
    }

    // Check multiple permissions
    if (item.permissions && item.permissions.length > 0) {
      if (item.requiresAnyPermission) {
        // User needs ANY of the permissions (OR logic)
        return item.permissions.some(permission => hasPermission(permission));
      } else {
        // User needs ALL of the permissions (AND logic)
        return item.permissions.every(permission => hasPermission(permission));
      }
    }

    // If no permissions are defined, allow access (fallback for legacy items)
    return true;
  };

  const isActiveLink = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  // Permission-based navigation configuration
  const navigationSections: NavigationSection[] = [
    {
      title: "", // No title for Overview section
      items: [
        {
          name: t("Dashboard"),
          href: "/dashboard",
          icon: Home,
          // Dashboard should be accessible to all authenticated users
        },
      ],
      collapsible: false, // Overview section should always be visible
    },
    {
      title: t("AI"),
      icon: Sparkles,
      items: [
        {
          name: t("Dental AI X-ray Analysis"),
          href: "/dashboard/xray-analysis",
          icon: Brain,
          badge: t("AI"),
          permission: "xray_analysis.view",
        },
        {
          name: t("AI Test Report Analysis"),
          href: "/dashboard/ai-test-analysis",
          icon: TestTube2,
          badge: t("AI"),
          permission: "test_reports.view",
        },
        {
          name: t("Compare Test Reports using AI"),
          href: "/dashboard/ai-test-comparison",
          icon: BarChart3,
          badge: t("AI"),
          permission: "test_reports.view",
        },
      ],
      collapsible: true,
      defaultCollapsed: false,
    },
    {
      title: t("CRM"),
      icon: Target,
      items: [
        {
          name: t("Leads"),
          href: "/dashboard/leads",
          icon: UserPlus,
          // Leads might not have a direct permission, could be part of patients management
          permissions: ["patients.create", "leads.view"],
          requiresAnyPermission: true,
        },
      ],
      collapsible: true,
      defaultCollapsed: false,
    },
    {
      title: t("Patient Management"),
      icon: Users2,
      items: [
        {
          name: t("Appointments"),
          href: "/dashboard/appointments",
          icon: Calendar,
          permission: "appointments.view",
        },
        {
          name: t("Patients"),
          href: "/dashboard/patients",
          icon: Users,
          permission: "patients.view",
        },
        {
          name: t("Prescriptions"),
          href: "/dashboard/prescriptions",
          icon: Stethoscope,
          permission: "prescriptions.view",
        },
        {
          name: t("Odontogram"),
          href: "/dashboard/odontograms",
          icon: Zap,
          badge: t("Dental"),
          permission: "odontogram.view",
        },
      ],
      collapsible: true,
      defaultCollapsed: false,
    },
    {
      title: t("Lab Management"),
      icon: FlaskConical,
      items: [
        {
          name: t("Test Reports"),
          href: "/dashboard/test-reports",
          icon: FileText,
          permission: "test_reports.view",
        },
      ],
      collapsible: true,
      defaultCollapsed: false,
    },
    {
      title: t("Financial Management"),
      icon: Wallet,
      items: [
        {
          name: t("Billing"),
          href: "/dashboard/billing",
          icon: DollarSign,
          permissions: ["invoices.view", "payments.view"],
          requiresAnyPermission: true,
        },
        {
          name: t("Invoices"),
          href: "/dashboard/invoices",
          icon: Receipt,
          permission: "invoices.view",
        },
        {
          name: t("Payments"),
          href: "/dashboard/payments",
          icon: CreditCard,
          permission: "payments.view",
        },
        {
          name: t("Expenses"),
          href: "/dashboard/expenses",
          icon: FileText,
          permission: "expenses.view",
        },
        {
          name: t("Financial Performance"),
          href: "/dashboard/performance",
          icon: BarChart3,
          permission: "analytics.reports",
        },
      ],
      collapsible: true,
      defaultCollapsed: false,
    },
    {
      title: t("Operations Management"),
      icon: BriefcaseMedical,
      items: [
        {
          name: t("Services"),
          href: "/dashboard/services",
          icon: Activity,
          permission: "services.view",
        },
        {
          name: t("Departments"),
          href: "/dashboard/departments",
          icon: Building2,
          permission: "departments.view",
        },
        {
          name: t("Lab Vendors"),
          href: "/dashboard/lab-vendors",
          icon: Building,
          permission: "lab_vendors.view",
        },
      ],
      collapsible: true,
      defaultCollapsed: false,
    },
    {
      title: t("Staff Management"),
      icon: UserCheck,
      items: [
        {
          name: t("Staff"),
          href: "/dashboard/staff",
          icon: UserCheck,
          permission: "users.view",
        },
        {
          name: t("Payroll"),
          href: "/dashboard/payroll",
          icon: Briefcase,
          permission: "payroll.view",
        },
        {
          name: t("Roles & Permissions"),
          href: "/dashboard/permissions",
          icon: Shield,
          permission: "permissions.view",
        },
      ],
      collapsible: true,
      defaultCollapsed: false,
    },
    {
      title: t("Analytics & Reports"),
      icon: BarChart2,
      items: [
        {
          name: t("Calendar Report"),
          href: "/dashboard/calendar",
          icon: CalendarDays,
          permission: "appointments.view",
        },
        {
          name: t("Advanced Reports"),
          href: "/dashboard/reports",
          icon: BarChart3,
          permissions: ["analytics.reports", "analytics.dashboard"],
          requiresAnyPermission: true,
        },
      ],
      collapsible: true,
      defaultCollapsed: false,
    },
    {
      title: t("Settings"),
      icon: Settings,
      items: [
        {
          name: t("Clinics"),
          href: "/dashboard/clinics",
          icon: Building2,
          permission: "clinics.view",
        },
        {
          name: t("Settings"),
          href: "/dashboard/settings",
          icon: Settings,
          permission: "settings.view",
        },
      ],
      collapsible: true,
      defaultCollapsed: false,
    },

  ];

  // Always use the main navigation sections - permissions will filter what's shown
  const sectionsToShow = navigationSections;

  // Auto-expand section if it contains active route
  useEffect(() => {
    sectionsToShow.forEach(section => {
      const hasActiveItem = section.items.some(item => {
        if (!canAccessItem(item)) return false;
        if (item.href === "/dashboard") {
          return location.pathname === "/dashboard";
        }
        return location.pathname.startsWith(item.href);
      });
      
      if (hasActiveItem && isSectionCollapsed(section.title, section.defaultCollapsed)) {
        setCollapsedSections(prev => ({
          ...prev,
          [section.title]: false
        }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-y-0 z-50 w-64 max-w-[16rem] bg-sidebar transform transition-transform duration-200 ease-in-out lg:translate-x-0 overflow-x-hidden overflow-y-auto dashboard-sidebar",
          // Position based on RTL/LTR
          isRTL ? "right-0 border-l border-sidebar-border" : "left-0 border-r border-sidebar-border",
          // Slide animation based on RTL/LTR
          isOpen 
            ? "translate-x-0" 
            : isRTL 
              ? "translate-x-full" 
              : "-translate-x-full",
        )}
      >
        <div className={cn(
          "flex items-center justify-between h-16 px-6 border-b border-sidebar-border",
          isRTL ? "flex-row-reverse" : ""
        )}>
         <Link to="/" className={cn(
           "flex items-center",
           isRTL ? "ml-auto" : ""
         )}>
  <img
    src={isRTL ? (theme === "dark" ? DarkLogoAr : Logoar) : (theme === "dark" ? DarkLogo : Logo)}
    alt="tappih Logo"
    className="h-10 w-auto"
  />
</Link>

          {/* <Link to="/dashboard" className={cn(
            "flex items-center",
            isRTL ? "space-x-reverse space-x-2 ml-auto" : "space-x-2"
          )}>
            <Heart className="h-8 w-8 text-sidebar-primary" />
            <span className="text-xl font-bold text-sidebar-foreground">ClinicPro</span>
          </Link> */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={cn(
              "lg:hidden",
              isRTL ? "order-first" : ""
            )}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-4 h-[calc(100vh-80px)]">
          <div className="space-y-2 pb-8">
            {/* User info */}
            <div className="px-3">
              <div className={cn(
                "flex items-center p-3 bg-sidebar-accent rounded-lg",
                isRTL ? "space-x-reverse space-x-3 flex-row-reverse" : "space-x-3"
              )}>
                <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-sidebar-primary-foreground">
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-sidebar-foreground truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className={cn(
                    "flex items-center",
                    isRTL ? "space-x-reverse space-x-2" : "space-x-2"
                  )}>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {user?.role ? t(user.role) : user?.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            {sectionsToShow.map((section, sectionIndex) => {
              const sectionHasAccessibleItems = section.items.some(canAccessItem);
              if (!sectionHasAccessibleItems) return null;

              const isCollapsed = section.collapsible !== false && isSectionCollapsed(section.title, section.defaultCollapsed);
              const accessibleItems = section.items.filter(canAccessItem);

              return (
                <div key={section.title} className="mb-1">
                  {/* Section Header with Collapse Toggle - Styled like Tabs */}
                  {section.title && section.collapsible !== false ? (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className={cn(
                        "w-full h-10 inline-flex items-center justify-between rounded-md px-3 py-1.5 mb-1 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80",
                        isRTL ? "flex-row-reverse" : ""
                      )}
                    >
                      <div className={cn(
                        "flex items-center gap-2",
                        isRTL ? "flex-row-reverse" : ""
                      )}>
                        {section.icon && (
                          <section.icon className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className={cn(
                          "whitespace-nowrap",
                          isRTL ? "text-right" : "text-left"
                        )}>
                          {section.title}
                        </span>
                      </div>
                      <div className={cn(
                        "flex items-center transition-transform duration-200",
                        isRTL ? "mr-auto" : "ml-auto",
                        isCollapsed ? "" : "rotate-180"
                      )}>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-colors",
                          isRTL ? "mr-1" : "ml-1"
                        )} />
                      </div>
                    </button>
                  ) : section.title ? (
                    <div className="w-full h-10 inline-flex items-center justify-center rounded-md bg-sidebar-accent px-3 py-1.5 mb-1 text-sm font-medium text-sidebar-accent-foreground">
                      <div className={cn(
                        "flex items-center gap-2",
                        isRTL ? "flex-row-reverse" : ""
                      )}>
                        {section.icon && (
                          <section.icon className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className={cn(
                          "whitespace-nowrap",
                          isRTL ? "text-right" : "text-left"
                        )}>
                          {section.title}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Section Items with Collapse Animation */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      isCollapsed ? "max-h-0 opacity-0" : "max-h-[1000px] opacity-100"
                    )}
                  >
                    <div className="space-y-1">
                      {accessibleItems.map((item) => {
                    const isActive = isActiveLink(item.href);

                    // Special handling for Test Reports with dropdown
                    if (
                      item.href === "/dashboard/test-reports"
                    ) {
                      return (
                        <div key={item.name}>
                          <button
                            onClick={() =>
                              setIsTestModulesOpen(!isTestModulesOpen)
                            }
                            className={cn(
                              "flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                              isRTL ? "flex-row-reverse" : "",
                              isActive ||
                                location.pathname.includes("/test-modules/")
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            )}
                          >
                            <item.icon className={cn(
                              "h-5 w-5 flex-shrink-0",
                              isRTL ? "ml-3" : "mr-3"
                            )} />
                            <span className={cn(
                              "flex-1",
                              isRTL ? "text-right" : "text-left"
                            )}>{item.name}</span>
                            {isTestModulesOpen ? (
                              <ChevronDown className={cn(
                                "h-4 w-4",
                                isRTL ? "mr-2" : "ml-2"
                              )} />
                            ) : (
                              isRTL ? (
                                <ChevronLeft className={cn(
                                  "h-4 w-4",
                                  "mr-2"
                                )} />
                              ) : (
                                <ChevronRight className={cn(
                                  "h-4 w-4",
                                  "ml-2"
                                )} />
                              )
                            )}
                          </button>

                          {/* Test Reports submenu */}
                          {isTestModulesOpen && (
                            <div 
                              className={cn(
                                "mt-1 space-y-1 overflow-visible",
                                isRTL ? "mr-6" : "ml-6"
                              )}
                              dir={isRTL ? 'rtl' : 'ltr'}
                              style={{ display: 'block', visibility: 'visible' }}
                            >
                              {(user?.role === 'super_admin' || user?.role === 'admin' || hasPermission("tests.view")) && (
                                <Link
                                  to="/dashboard/tests"
                                  onClick={onClose}
                                  className={cn(
                                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                    isRTL ? "flex-row-reverse" : "",
                                    location.pathname === "/dashboard/tests"
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                  )}
                                >
                                  <TestTube2 className={cn(
                                    "h-5 w-5 flex-shrink-0",
                                    isRTL ? "ml-3" : "mr-3"
                                  )} />
                                  <span className={cn(
                                    "flex-1",
                                    isRTL ? "text-right" : "text-left"
                                  )}>{t("Tests")}</span>
                                </Link>
                              )}

                              {(user?.role === 'super_admin' || user?.role === 'admin' || hasPermission("test_reports.view")) && (
                                <Link
                                  to="/dashboard/test-reports"
                                  onClick={onClose}
                                  className={cn(
                                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                    isRTL ? "flex-row-reverse" : "",
                                    location.pathname ===
                                      "/dashboard/test-reports"
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                  )}
                                >
                                  <FileText className={cn(
                                    "h-5 w-5 flex-shrink-0",
                                    isRTL ? "ml-3" : "mr-3"
                                  )} />
                                  <span className={cn(
                                    "flex-1",
                                    isRTL ? "text-right" : "text-left"
                                  )}>{t("Test Reports")}</span>
                                </Link>
                              )}

                              {(user?.role === 'super_admin' || user?.role === 'admin' || hasPermission("tests.view")) && (
                                <Link
                                  to="/dashboard/test-modules/methodology"
                                  onClick={onClose}
                                  className={cn(
                                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                    isRTL ? "flex-row-reverse" : "",
                                    location.pathname ===
                                      "/dashboard/test-modules/methodology"
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                  )}
                                >
                                  <Settings className={cn(
                                    "h-5 w-5 flex-shrink-0",
                                    isRTL ? "ml-3" : "mr-3"
                                  )} />
                                  <span className={cn(
                                    "flex-1",
                                    isRTL ? "text-right" : "text-left"
                                  )}>{t("Methodology")}</span>
                                </Link>
                              )}

                              {(user?.role === 'super_admin' || user?.role === 'admin' || hasPermission("tests.view")) && (
                                <Link
                                  to="/dashboard/test-modules/turnaround-time"
                                  onClick={onClose}
                                  className={cn(
                                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                    isRTL ? "flex-row-reverse" : "",
                                    location.pathname ===
                                      "/dashboard/test-modules/turnaround-time"
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                  )}
                                >
                                  <Clock className={cn(
                                    "h-5 w-5 flex-shrink-0",
                                    isRTL ? "ml-3" : "mr-3"
                                  )} />
                                  <span className={cn(
                                    "flex-1",
                                    isRTL ? "text-right" : "text-left"
                                  )}>{t("Turnaround Time")}</span>
                                </Link>
                              )}

                              {(user?.role === 'super_admin' || user?.role === 'admin' || hasPermission("tests.view")) && (
                                <Link
                                  to="/dashboard/test-modules/sample-type"
                                  onClick={onClose}
                                  className={cn(
                                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                    isRTL ? "flex-row-reverse" : "",
                                    location.pathname ===
                                      "/dashboard/test-modules/sample-type"
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                  )}
                                >
                                  <Droplets className={cn(
                                    "h-5 w-5 flex-shrink-0",
                                    isRTL ? "ml-3" : "mr-3"
                                  )} />
                                  <span className={cn(
                                    "flex-1",
                                    isRTL ? "text-right" : "text-left"
                                  )}>{t("Sample Type")}</span>
                                </Link>
                              )}

                              {(user?.role === 'super_admin' || user?.role === 'admin' || hasPermission("tests.view")) && (
                                <Link
                                  to="/dashboard/test-modules/category"
                                  onClick={onClose}
                                  className={cn(
                                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                    isRTL ? "flex-row-reverse" : "",
                                    location.pathname ===
                                      "/dashboard/test-modules/category"
                                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                  )}
                                >
                                  <Folder className={cn(
                                    "h-5 w-5 flex-shrink-0",
                                    isRTL ? "ml-3" : "mr-3"
                                  )} />
                                  <span className={cn(
                                    "flex-1",
                                    isRTL ? "text-right" : "text-left"
                                  )}>{t("Category")}</span>
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Regular navigation items
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                          isRTL ? "flex-row-reverse" : "",
                          isActive
                            ? isRTL
                              ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary"
                              : "bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-sidebar-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 flex-shrink-0",
                          isRTL ? "ml-3" : "mr-3"
                        )} />
                        <span className={cn(
                          "flex-1",
                          isRTL ? "text-right" : "text-left"
                        )}>{item.name}</span>
                        {item.badge && (
                          <Badge variant="secondary" className={cn(
                            "text-xs",
                            isRTL ? "mr-2" : "ml-2"
                          )}>
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                      );
                    })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default Sidebar;
