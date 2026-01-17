# ViewDetails Component

A reusable, modern component for displaying detailed information in a modal dialog with full RTL (Right-to-Left) support for Arabic and English.

## Features

- ✅ Modern design using FormDialog, FormCardSection, and FormField components
- ✅ Full RTL support for Arabic and English
- ✅ Multiple field types: text, badge, date, currency, array, boolean, phone, email, branches, branchWarehouses
- ✅ Automatic section grouping
- ✅ Clean design without background colors on fields
- ✅ Responsive layout

## Usage

```tsx
import { ViewDetails } from "@/components/ViewDetails";
import { Package } from "lucide-react";

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const itemData = {
    name: "Item Name",
    price: 100,
    quantity: 50,
    createdAt: new Date(),
  };

  const fields = [
    { key: "name", label: "Name", section: "Basic Information" },
    { key: "price", label: "Price", type: "currency", section: "Basic Information" },
    { key: "quantity", label: "Quantity", section: "Stock & Pricing" },
    { key: "createdAt", label: "Created At", type: "date", section: "Additional Information" },
  ];

  return (
    <ViewDetails
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Item Details"
      description="View complete information"
      icon={Package}
      data={itemData}
      fields={fields}
      maxWidth="4xl"
    />
  );
};
```

## Props

### ViewDetailsProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | Yes | - | Controls the visibility of the modal |
| `onOpenChange` | `(open: boolean) => void` | Yes | - | Callback when modal open state changes |
| `title` | `string` | Yes | - | Modal title |
| `description` | `string` | No | - | Modal description |
| `icon` | `LucideIcon` | No | `Eye` | Icon to display in the header |
| `data` | `Record<string, any> \| null` | Yes | - | Data object containing field values |
| `fields` | `ViewDetailsField[]` | Yes | - | Array of field definitions |
| `maxWidth` | `"sm" \| "md" \| "lg" \| "xl" \| "2xl" \| "3xl" \| "4xl" \| "full"` | No | `"4xl"` | Maximum width of the modal |

### ViewDetailsField

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | Yes | Key to access the value in the data object |
| `label` | `string` | Yes | Label to display for the field |
| `type` | `FieldType` | No | Type of field (affects formatting) |
| `render` | `(value: any) => React.ReactNode` | No | Custom render function |
| `section` | `string` | No | Section name to group fields |

## Field Types

- **text**: Plain text (default)
- **badge**: Displayed as a badge
- **date**: Formatted using `formatDate` utility
- **currency**: Formatted using currency formatter
- **array**: Joined with commas
- **boolean**: Displayed as "Yes" or "No"
- **phone**: Monospace font with border
- **email**: Blue link style
- **branches**: Special formatting for branch lists
- **branchWarehouses**: Special formatting for branch-warehouse relationships

## RTL Support

The component automatically detects RTL mode and adjusts:
- Text alignment
- Icon positions
- Layout direction
- Field spacing

## Examples

### Basic Usage

```tsx
<ViewDetails
  open={open}
  onOpenChange={setOpen}
  title="Product Details"
  data={product}
  fields={[
    { key: "name", label: "Name" },
    { key: "price", label: "Price", type: "currency" },
  ]}
/>
```

### With Sections

```tsx
<ViewDetails
  open={open}
  onOpenChange={setOpen}
  title="User Details"
  data={user}
  fields={[
    { key: "name", label: "Name", section: "Basic Information" },
    { key: "email", label: "Email", type: "email", section: "Basic Information" },
    { key: "phone", label: "Phone", type: "phone", section: "Contact Information" },
    { key: "createdAt", label: "Created At", type: "date", section: "Additional Information" },
  ]}
/>
```

### Custom Render

```tsx
<ViewDetails
  open={open}
  onOpenChange={setOpen}
  title="Order Details"
  data={order}
  fields={[
    {
      key: "total",
      label: "Total",
      render: (value) => (
        <span className="text-2xl font-bold text-green-600">
          {formatAmount(value)}
        </span>
      ),
    },
  ]}
/>
```
