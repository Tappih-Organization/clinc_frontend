import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { parseApiError } from "@/utils/errorHandler";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { useIsRTL } from "@/hooks/useIsRTL";
import { cn } from "@/lib/utils";

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemName: string;
  onConfirm: () => Promise<void>;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      toast({
        title: t("Deleted successfully"),
        description: `${itemName} ${t("has been permanently deleted.")}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("Error"),
        description: parseApiError(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn("w-[95vw] max-w-md mx-auto p-0", isRTL && "text-right")}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="p-4 sm:p-6">
          <DialogHeader 
            className={cn(
              "mb-4",
              isRTL ? "text-right" : "text-center sm:text-left"
            )}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <DialogTitle 
              className={cn(
                "flex items-center text-lg sm:text-xl text-red-600",
                isRTL ? "flex-row-reverse justify-center sm:justify-start" : "justify-center sm:justify-start"
              )}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <AlertTriangle 
                className={cn(
                  "h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0",
                  isRTL ? "ml-2" : "mr-2"
                )} 
              />
              <span className="truncate">{title}</span>
            </DialogTitle>
            <DialogDescription 
              className={cn(
                "text-sm text-muted-foreground mt-2",
                isRTL && "text-right"
              )}
              dir={isRTL ? "rtl" : "ltr"}
            >
              {description}
            </DialogDescription>
          </DialogHeader>

          <div 
            className={cn(
              "bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6",
              isRTL && "text-right"
            )}
            dir={isRTL ? "rtl" : "ltr"}
            style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
          >
            <div className={cn("flex items-start", isRTL && "flex-row-reverse")}>
              <AlertTriangle 
                className={cn(
                  "h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5",
                  isRTL ? "ml-2 sm:ml-3" : "mr-2 sm:mr-3"
                )} 
              />
              <div className="flex-1 min-w-0">
                <p 
                  className={cn(
                    "font-medium text-red-800 text-sm sm:text-base",
                    isRTL && "text-right"
                  )}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  {t("You are about to delete:")}{" "}
                  <strong className="break-words">{itemName}</strong>
                </p>
                <p 
                  className={cn(
                    "text-xs sm:text-sm text-red-600 mt-1",
                    isRTL && "text-right"
                  )}
                  dir={isRTL ? "rtl" : "ltr"}
                  style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}
                >
                  {t("This action cannot be undone.")}
                </p>
              </div>
            </div>
          </div>

          <div 
            className={cn(
              "flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3",
              isRTL && "flex-row-reverse"
            )}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className={cn(
                "w-full sm:w-auto h-9 sm:h-10",
                isRTL && "flex-row-reverse"
              )}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <X className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {t("Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(
                "w-full sm:w-auto h-9 sm:h-10",
                isRTL && "flex-row-reverse"
              )}
              dir={isRTL ? "rtl" : "ltr"}
            >
              {isLoading ? (
                <div className={cn(
                  "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin",
                  isRTL ? "ml-2" : "mr-2"
                )} />
              ) : (
                <Trash2 className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              )}
              {t("Delete Permanently")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmModal;
