import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
// Light mode now has dark purple background, so we need light/white logos
// Dark mode now has white background, so we need dark logos
import LightModeLogo from "@/assets/darklogo.svg"; // White logo for light mode (dark purple bg)
import LightModeLogoAr from "@/assets/darklogoar.svg"; // White logo AR for light mode
import DarkModeLogo from "@/assets/logomini.svg"; // Dark logo for dark mode (white bg)
import DarkModeLogoAr from "@/assets/logoar.svg"; // Dark logo AR for dark mode
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
  Table as TableIcon,
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
  Zap,
  Target,
  FlaskConical,
  Wallet,
  BriefcaseMedical,
  Users2,
  FileBarChart,
  BarChart2,
  Plus,
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
  const [isRTL, setIsRTL] = useState(false);
  const activeItemRef = React.useRef<HTMLAnchorElement>(null);

  // State to manage collapsed/expanded state for each section
  // Load from localStorage on mount
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('sidebarCollapsedSections');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save collapsed sections to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsedSections', JSON.stringify(collapsedSections));
    } catch {
      // Ignore localStorage errors
    }
  }, [collapsedSections]);

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
      title: t("Appointments"), // الحجوزات
      icon: Calendar,
      items: [
        {
          name: t("Appointments Calendar"), // التقويم
          href: "/dashboard/appointments-calendar",
          icon: Calendar,
          permission: "appointments.view",
        },
        {
          name: t("Appointments Table"), // جدول الحجوزات
          href: "/dashboard/appointments-table",
          icon: TableIcon,
          permission: "appointments.view",
        },
        {
          name: t("Add Appointment"), // إضافة حجز
          href: "/dashboard/add-appointment",
          icon: Plus,
          permission: "appointments.view",
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
    // {
    //   title: t("Lab Management"),
    //   icon: FlaskConical,
    //   items: [
    //     {
    //       name: t("Tests"),
    //       href: "/dashboard/tests",
    //       icon: TestTube2,
    //       permission: "tests.view",
    //     },
    //     {
    //       name: t("Test Reports"),
    //       href: "/dashboard/test-reports",
    //       icon: FileText,
    //       permission: "test_reports.view",
    //     },
    //     {
    //       name: t("Methodology"),
    //       href: "/dashboard/test-modules/methodology",
    //       icon: Settings,
    //       permission: "tests.view",
    //     },
    //     {
    //       name: t("Turnaround Time"),
    //       href: "/dashboard/test-modules/turnaround-time",
    //       icon: Clock,
    //       permission: "tests.view",
    //     },
    //     {
    //       name: t("Sample Type"),
    //       href: "/dashboard/test-modules/sample-type",
    //       icon: Droplets,
    //       permission: "tests.view",
    //     },
    //     {
    //       name: t("Category"),
    //       href: "/dashboard/test-modules/category",
    //       icon: Folder,
    //       permission: "tests.view",
    //     },
    //   ],
    //   collapsible: true,
    //   defaultCollapsed: false,
    // },
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
      title: t("Warehouse"),
      icon: Package,
      items: [
        {
          name: t("Inventory"),
          href: "/dashboard/inventory",
          icon: Package,
          permission: "inventory.view",
        },
        {
          name: t("Warehouses"),
          href: "/dashboard/warehouses",
          icon: Building2,
          permission: "inventory.view",
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

  // Scroll to active item after sections are expanded
  useEffect(() => {
    // Wait for section expansion animation to complete
    const timer = setTimeout(() => {
      if (activeItemRef.current) {
        activeItemRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }, 350); // Slightly longer than the collapse animation duration (300ms)

    return () => clearTimeout(timer);
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
              src={isRTL
                ? (theme === "dark" ? DarkModeLogoAr : LightModeLogoAr)
                : (theme === "dark" ? DarkModeLogo : LightModeLogo)
              }
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
          <div className="space-y-1 pb-8">
            {/* User info */}
            <div className="px-3 mb-4">
              <div className={cn(
                "flex items-center p-3 bg-sidebar-accent rounded-lg border border-sidebar-border/50",
                isRTL ? "space-x-reverse space-x-3 flex-row-reverse" : "space-x-3"
              )}>
                <div className="w-10 h-10 bg-sidebar-primary rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-sm font-bold text-sidebar-primary-foreground">
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-sidebar-foreground truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className={cn(
                    "flex items-center mt-1",
                    isRTL ? "space-x-reverse space-x-2" : "space-x-2"
                  )}>
                    <Badge variant="secondary" className="text-xs capitalize bg-sidebar-primary/10 text-sidebar-foreground border-sidebar-primary/20">
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
                <div key={section.title} className="mb-2">
                  {/* Section Header with Collapse Toggle */}
                  {section.title && section.collapsible !== false ? (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-lg px-3 py-2.5 mb-1 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group hover:bg-sidebar-accent/50",
                        "text-sidebar-foreground",
                        isRTL ? "flex-row-reverse" : ""
                      )}
                    >
                      <div className={cn(
                        "flex items-center gap-2",
                        isRTL ? "flex-row-reverse" : ""
                      )}>
                        {section.icon && (
                          <section.icon className="h-4 w-4 flex-shrink-0 opacity-80" />
                        )}
                        <span className={cn(
                          "whitespace-nowrap",
                          isRTL ? "text-right" : "text-left"
                        )}>
                          {section.title}
                        </span>
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-200 opacity-70",
                        isCollapsed ? (isRTL ? "rotate-90" : "-rotate-90") : ""
                      )} />
                    </button>
                  ) : section.title ? (
                    <div className="w-full flex items-center justify-center rounded-lg px-3 py-2.5 mb-1 text-sm font-semibold text-sidebar-foreground">
                      <div className={cn(
                        "flex items-center gap-2",
                        isRTL ? "flex-row-reverse" : ""
                      )}>
                        {section.icon && (
                          <section.icon className="h-4 w-4 flex-shrink-0 opacity-80" />
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
                    <div className="space-y-0.5 px-1">
                      {accessibleItems.map((item) => {
                        const isActive = isActiveLink(item.href);

                        // Regular navigation items
                        return (
                          <div
                            key={item.name}
                            className="flex items-center group/item"
                          >
                            <Link
                              to={item.href}
                              onClick={onClose}
                              ref={isActive ? activeItemRef : null}
                              className={cn(
                                "flex-1 flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative",
                                isRTL ? "flex-row-reverse" : "",
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                              )}
                            >
                              {isActive && (
                                <div className={cn(
                                  "absolute top-0 bottom-0 w-1 bg-sidebar-primary rounded-full",
                                  isRTL ? "right-0" : "left-0"
                                )} />
                              )}
                              <item.icon className={cn(
                                "h-4 w-4 flex-shrink-0",
                                isActive ? "opacity-100" : "opacity-70"
                              )} />
                              <span className="whitespace-nowrap">
                                {item.name}
                              </span>
                              {item.badge && (
                                <Badge variant="secondary" className="text-xs bg-sidebar-primary/10 text-sidebar-foreground border-sidebar-primary/20">
                                  {item.badge}
                                </Badge>
                              )}
                            </Link>
                          </div>
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
