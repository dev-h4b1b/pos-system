export type Category = string;

export type ProductType = "sale" | "rental";

export interface RentalUnit {
  id: string;
  label: string;     // e.g., "Laptop 1"
  serialNo?: string; // e.g., "SN-2024-001" — optional
  status: "available" | "rented";
}

export type SelectedUnit = Pick<RentalUnit, "id" | "label" | "serialNo">;

export interface Product {
  id: string;
  name: string;
  price: number; // unit sale price OR per-day rental rate
  category: Category;
  emoji: string;
  stock: number;
  type: ProductType;
  units?: RentalUnit[]; // individual tracked units for rental products
}

export interface CartItem {
  product: Product;
  quantity: number;
  rentalDays?: number;       // only when product.type === "rental"
  selectedUnits?: SelectedUnit[]; // for rental products with tracked units
}

export type RentalSession = "morning" | "afternoon" | "evening";

export interface RentalInfo {
  studentName: string;
  studentId: string;
  phone: string;
  email: string;
  roomNo: string;
  session: RentalSession;
  returnDate: string; // ISO
}

export interface Order {
  id: string;
  orderNumber: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "qr";
  cashTendered?: number;
  change?: number;
  createdAt: string;
  receiptImage?: string; // base64, QR payments only
  // rental fields
  studentName?: string;
  studentId?: string;
  phone?: string;
  email?: string;
  roomNo?: string;
  session?: RentalSession;
  returnDate?: string;
  rentalStatus?: "active" | "returned" | "overdue";
}
