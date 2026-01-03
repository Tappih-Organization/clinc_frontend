import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

// Import the icons
import DarkIcon from "@/assets/_clinc tappih - الايقونه في حاله الدارك.svg";
import LightIcon from "@/assets/_clinc tappih الايقونه وايت.svg";

interface LoadingProps {
  /**
   * Size of the loading icon
   * @default "default"
   */
  size?: "sm" | "default" | "lg" | "xl";
  
  /**
   * Show text below the icon
   * @default true
   */
  showText?: boolean;
  
  /**
   * Custom text to display
   * @default "Loading..."
   */
  text?: string;
  
  /**
   * Full screen loading
   * @default false
   */
  fullScreen?: boolean;
  
  /**
   * Custom className
   */
  className?: string;
  
  /**
   * Inline loading (for small spaces)
   * @default false
   */
  inline?: boolean;
}

const sizeMap = {
  sm: "w-4 h-4",
  default: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
};

const Loading: React.FC<LoadingProps> = ({
  size = "default",
  showText = true,
  text = "Loading...",
  fullScreen = false,
  className,
  inline = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const Icon = isDark ? DarkIcon : LightIcon;

  const containerClasses = cn(
    inline ? "inline-flex items-center justify-center" : "flex flex-col items-center justify-center",
    fullScreen && "min-h-screen w-full",
    !fullScreen && !inline && "py-8",
    className
  );

  const iconClasses = cn(
    "loading-icon",
    sizeMap[size]
  );

  return (
    <div className={containerClasses}>
      <div className={iconClasses}>
        <img 
          src={Icon} 
          alt="Loading" 
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <p className={cn(
          "mt-4 text-sm font-medium",
          isDark ? "text-muted-foreground" : "text-muted-foreground"
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

export default Loading;

