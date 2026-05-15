import { createContext, useCallback, useContext, useState } from "react";
import { products as initialProducts } from "../data/products";
import type { CartItem, Product } from "../types";

const STORAGE_KEY = "pos_products_v2";
const CATEGORIES_KEY = "pos_categories";

const DEFAULT_CATEGORIES = ["earphones", "chargers", "cables", "accessories", "laptops", "webcams", "displays", "peripherals"];

function loadCategories(): string[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : DEFAULT_CATEGORIES;
  }
  catch { return DEFAULT_CATEGORIES; }
}

function saveCategories(cats: string[]) {
  try { localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats)); }
  catch { /* quota */ }
}

function load(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialProducts;
    const saved = JSON.parse(raw) as Product[];
    // Merge saved stock levels onto latest product list (preserves new products added to data file)
    return initialProducts.map(p => {
      const found = saved.find(s => s.id === p.id);
      return found ? { ...p, stock: found.stock } : p;
    }).concat(saved.filter(s => !initialProducts.find(p => p.id === s.id)));
  }
  catch { return initialProducts; }
}

function persist(products: Product[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); }
  catch { /* quota */ }
}

interface ProductsContextValue {
  products: Product[];
  categories: string[];
  addProduct: (data: Omit<Product, "id">) => void;
  updateProduct: (id: string, data: Omit<Product, "id">) => void;
  deleteProduct: (id: string) => void;
  deductStock: (items: CartItem[]) => void;
  addStock: (items: CartItem[]) => void;
  restockProduct: (id: string, qty: number) => void;
  addCategory: (name: string) => void;
  removeCategory: (name: string) => void;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(load);
  const [categories, setCategories] = useState<string[]>(loadCategories);

  const addCategory = useCallback((name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return;
    setCategories((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      saveCategories(next);
      return next;
    });
  }, []);

  const removeCategory = useCallback((name: string) => {
    setCategories((prev) => {
      const next = prev.filter(c => c !== name);
      saveCategories(next);
      return next;
    });
  }, []);

  const apply = useCallback((updater: (prev: Product[]) => Product[]) => {
    setProducts((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, []);

  const addProduct = useCallback((data: Omit<Product, "id">) => {
    apply(prev => [...prev, { ...data, id: `p_${Date.now()}` }]);
  }, [apply]);

  const updateProduct = useCallback((id: string, data: Omit<Product, "id">) => {
    apply(prev => prev.map(p => p.id === id ? { ...data, id } : p));
  }, [apply]);

  const deleteProduct = useCallback((id: string) => {
    apply(prev => prev.filter(p => p.id !== id));
  }, [apply]);

  const deductStock = useCallback((items: CartItem[]) => {
    apply(prev => prev.map((p) => {
      const cartItem = items.find(i => i.product.id === p.id);
      if (!cartItem) return p;
      if (p.units && cartItem.selectedUnits && cartItem.selectedUnits.length > 0) {
        const rentedIds = new Set(cartItem.selectedUnits.map(u => u.id));
        const units = p.units.map(u => rentedIds.has(u.id) ? { ...u, status: "rented" as const } : u);
        return { ...p, units, stock: units.filter(u => u.status === "available").length };
      }
      return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
    }));
  }, [apply]);

  const restockProduct = useCallback((id: string, qty: number) => {
    if (qty <= 0) return;
    apply(prev => prev.map(p => p.id === id ? { ...p, stock: p.stock + qty } : p));
  }, [apply]);

  const addStock = useCallback((items: CartItem[]) => {
    apply(prev => prev.map((p) => {
      const cartItem = items.find(i => i.product.id === p.id);
      if (!cartItem) return p;
      if (p.units && cartItem.selectedUnits && cartItem.selectedUnits.length > 0) {
        const returnedIds = new Set(cartItem.selectedUnits.map(u => u.id));
        const units = p.units.map(u => returnedIds.has(u.id) ? { ...u, status: "available" as const } : u);
        return { ...p, units, stock: units.filter(u => u.status === "available").length };
      }
      return { ...p, stock: p.stock + cartItem.quantity };
    }));
  }, [apply]);

  return (
    <ProductsContext.Provider value={{ products, categories, addProduct, updateProduct, deleteProduct, deductStock, addStock, restockProduct, addCategory, removeCategory }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used inside ProductsProvider");
  return ctx;
}
