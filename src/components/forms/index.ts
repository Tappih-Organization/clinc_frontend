/**
 * Reusable Form Components
 * 
 * These components provide consistent form structure and styling
 * with full RTL (Right-to-Left) support for Arabic and English.
 * 
 * Components:
 * - FormCardSection: Card section with title and icon
 * - FormField: Form field with label, error, and description
 * - StatusToggleField: Status toggle with switch and descriptions
 * - FormDialog: Dialog wrapper for forms with RTL support
 * - ItemsDetails: Reusable component for managing lists of items (medications, inventory, etc.) with RTL support
 */

export { FormCardSection } from "./FormCardSection";
export { FormField } from "./FormField";
export { StatusToggleField } from "./StatusToggleField";
export { FormDialog } from "./FormDialog";
export { ItemsDetails } from "./ItemsDetails";
export type { ItemsDetailsProps, ItemField, FormItem } from "./ItemsDetails";
export { ItemsDetailsView } from "./ItemsDetailsView";
export type { ItemsDetailsViewProps } from "./ItemsDetailsView";
