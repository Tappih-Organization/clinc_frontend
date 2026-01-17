import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Search, Loader2, X, Warehouse } from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import Loading from "@/components/ui/Loading";

interface WarehouseItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: {
    id: string;
    name: string;
  } | null;
}

interface WarehouseItem {
  _id: string;
  name: string;
  category: string;
  sku: string;
  current_stock: number;
  minimum_stock: number;
  unit_price: number;
  supplier: string;
  expiry_date?: string;
  created_at: string;
}

const WarehouseItemsModal: React.FC<WarehouseItemsModalProps> = ({
  open,
  onOpenChange,
  warehouse,
}) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState<WarehouseItem[]>([]);

  // Load warehouse items
  useEffect(() => {
    const loadItems = async () => {
      if (!open || !warehouse) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiService.getWarehouseItems(warehouse.id, {
          limit: 10000, // Get all items for export
        });

        if (response.success && response.data) {
          setItems(response.data);
          setFilteredItems(response.data);
        }
      } catch (error: any) {
        console.error("Error loading warehouse items:", error);
        toast({
          title: t("Error"),
          description: t("Failed to load warehouse items"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [open, warehouse, t]);

  // Filter items based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower) ||
        item.supplier.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower)
      );
    });

    setFilteredItems(filtered);
  }, [searchTerm, items]);

  // Export to Excel (CSV format as fallback)
  const handleExportToExcel = () => {
    if (filteredItems.length === 0) {
      toast({
        title: t("Warning"),
        description: t("No items to export"),
        variant: "destructive",
      });
      return;
    }

    try {
      // Create CSV content
      const headers = [
        t("Item Name"),
        t("SKU"),
        t("Category"),
        t("Current Stock"),
        t("Minimum Stock"),
        t("Unit Price"),
        t("Total Value"),
        t("Supplier"),
        t("Expiry Date"),
      ];

      const rows = filteredItems.map((item) => {
        const totalValue = (item.current_stock || 0) * (item.unit_price || 0);
        const expiryDate = item.expiry_date
          ? new Date(item.expiry_date).toLocaleDateString()
          : "-";

        return [
          item.name,
          item.sku,
          item.category,
          item.current_stock?.toString() || "0",
          item.minimum_stock?.toString() || "0",
          item.unit_price?.toString() || "0",
          totalValue.toString(),
          item.supplier || "-",
          expiryDate,
        ];
      });

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      // Add BOM for UTF-8 encoding (for Excel compatibility)
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      // Create download link
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${warehouse?.name || "warehouse"}_items_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: t("Success"),
        description: t("Items exported successfully"),
      });
    } catch (error: any) {
      console.error("Error exporting items:", error);
      toast({
        title: t("Error"),
        description: t("Failed to export items"),
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "-";
    }
  };

  if (!warehouse) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Warehouse className="h-5 w-5" />
            <span>{t("Warehouse Items")}</span>
          </DialogTitle>
          <DialogDescription>
            {t("Items in warehouse")}: <strong>{warehouse.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Export Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("Search items...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
              />
            </div>
            <Button
              onClick={handleExportToExcel}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span>{t("Export to Excel")}</span>
            </Button>
          </div>

          {/* Items Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loading text={t("Loading items...")} size="lg" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Warehouse className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? t("No items found") : t("No items in warehouse")}
              </h3>
              {!searchTerm && (
                <p className="text-gray-500">{t("This warehouse has no items yet.")}</p>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Item Name")}</TableHead>
                    <TableHead>{t("SKU")}</TableHead>
                    <TableHead>{t("Category")}</TableHead>
                    <TableHead className="text-right">{t("Current Stock")}</TableHead>
                    <TableHead className="text-right">{t("Minimum Stock")}</TableHead>
                    <TableHead className="text-right">{t("Unit Price")}</TableHead>
                    <TableHead className="text-right">{t("Total Value")}</TableHead>
                    <TableHead>{t("Supplier")}</TableHead>
                    <TableHead>{t("Expiry Date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const totalValue =
                      (item.current_stock || 0) * (item.unit_price || 0);
                    const isLowStock =
                      (item.current_stock || 0) <= (item.minimum_stock || 0);

                    return (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {item.sku}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm capitalize">{item.category}</span>
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${isLowStock ? "text-red-600" : ""}`}
                        >
                          {item.current_stock || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.minimum_stock || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_price || 0)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(totalValue)}
                        </TableCell>
                        <TableCell>{item.supplier || "-"}</TableCell>
                        <TableCell>{formatDate(item.expiry_date || "")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Items Count */}
          {!isLoading && filteredItems.length > 0 && (
            <div className="text-sm text-muted-foreground text-left">
              {t("Showing")} {filteredItems.length} {t("of")} {items.length}{" "}
              {t("items")}
              {searchTerm && (
                <span className="ml-2">
                  ({t("filtered")})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex pt-4 border-t justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            <span>{t("Close")}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WarehouseItemsModal;