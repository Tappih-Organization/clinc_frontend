// Import i18n instance from the project's i18n configuration
import i18n from "@/i18n";

/**
 * Get the current language (for month name translation only)
 */
export const getCurrentLanguage = (): string => {
  return i18n.language || "en";
};

/**
 * Get locale string for date formatting (e.g., "en-US", "ar-SA")
 */
export const getLocale = (): string => {
  const lang = getCurrentLanguage();
  if (lang.startsWith("ar")) {
    return "ar-SA";
  }
  return "en-US";
};

/**
 * Translate month names to Arabic if needed
 * Always use English numbers, only translate month names
 */
export const translateMonthNames = (dateString: string): string => {
  const currentLanguage = getCurrentLanguage();
  
  // Only translate if language is Arabic
  if (currentLanguage !== "ar" && !currentLanguage.startsWith("ar-")) {
    return dateString;
  }

  // Month name mappings (full and abbreviated)
  const monthMap: Record<string, string> = {
    "January": "يناير",
    "February": "فبراير",
    "March": "مارس",
    "April": "أبريل",
    "May": "مايو",
    "June": "يونيو",
    "July": "يوليو",
    "August": "أغسطس",
    "September": "سبتمبر",
    "October": "أكتوبر",
    "November": "نوفمبر",
    "December": "ديسمبر",
    "Jan": "يناير",
    "Feb": "فبراير",
    "Mar": "مارس",
    "Apr": "أبريل",
    "May": "مايو",
    "Jun": "يونيو",
    "Jul": "يوليو",
    "Aug": "أغسطس",
    "Sep": "سبتمبر",
    "Oct": "أكتوبر",
    "Nov": "نوفمبر",
    "Dec": "ديسمبر",
  };

  // Replace month names with Arabic translations
  let translatedString = dateString;
  Object.keys(monthMap).forEach((englishMonth) => {
    const arabicMonth = monthMap[englishMonth];
    // Use regex with word boundaries to match whole words only
    const regex = new RegExp(`\\b${englishMonth}\\b`, "gi");
    translatedString = translatedString.replace(regex, arabicMonth);
  });

  return translatedString;
};

/**
 * Format date - Always use English numbers, translate month names only in Arabic
 */
export const formatDate = (
  dateString: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateString) return "-";
  
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return "-";
    }
    
    // Always use "en-US" locale to get English numbers
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    
    const formattedDate = date.toLocaleDateString("en-US", { ...defaultOptions, ...options });
    
    // Translate month names only (numbers stay in English)
    return translateMonthNames(formattedDate);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
};

/**
 * Format date with short month name - Always use English numbers, translate month names only in Arabic
 */
export const formatDateShort = (
  dateString: string | Date | null | undefined
): string => {
  return formatDate(dateString, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Format date with weekday - Always use English numbers, translate month names only in Arabic
 */
export const formatDateWithWeekday = (
  dateString: string | Date | null | undefined
): string => {
  return formatDate(dateString, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Format date short with weekday - Always use English numbers, translate month names only in Arabic
 */
export const formatDateShortWithWeekday = (
  dateString: string | Date | null | undefined
): string => {
  return formatDate(dateString, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format time - Always use English numbers (no translation needed for time)
 */
export const formatTime = (
  dateString: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateString) return "-";
  
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return "-";
    }
    
    // Always use "en-US" locale to get English numbers
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    
    return date.toLocaleTimeString("en-US", { ...defaultOptions, ...options });
  } catch (error) {
    console.error("Error formatting time:", error);
    return "-";
  }
};

/**
 * Format date and time together - Always use English numbers, translate month names only in Arabic
 */
export const formatDateTime = (
  dateString: string | Date | null | undefined
): string => {
  if (!dateString) return "-";
  
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return "-";
    }
    
    // Always use "en-US" locale to get English numbers
    const formattedDateTime = date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    
    // Translate month names only (numbers stay in English)
    return translateMonthNames(formattedDateTime);
  } catch (error) {
    console.error("Error formatting date time:", error);
    return "-";
  }
};

/**
 * Format month and year for calendar headers - Always use English numbers, translate month names only in Arabic
 */
export const formatMonthYear = (
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  try {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      month: "long",
      year: "numeric",
    };
    
    // Always use "en-US" locale to get English numbers
    const formatted = date.toLocaleDateString("en-US", { ...defaultOptions, ...options });
    
    // Translate month names only (numbers stay in English)
    return translateMonthNames(formatted);
  } catch (error) {
    console.error("Error formatting month year:", error);
    return "-";
  }
};

