import type { Product } from "../types";

export const products: Product[] = [
  // ── For Sale ─────────────────────────────────────────────────────────
  // Earphones
  { id: "e1", name: "Sony WH-1000XM5", price: 349, category: "earphones", emoji: "🎧", stock: 5, type: "sale" },
  { id: "e2", name: "AirPods Pro 2", price: 249, category: "earphones", emoji: "🎧", stock: 8, type: "sale" },
  { id: "e3", name: "Samsung Galaxy Buds3", price: 149, category: "earphones", emoji: "🎧", stock: 12, type: "sale" },
  { id: "e4", name: "JBL Tune 510BT", price: 49, category: "earphones", emoji: "🎧", stock: 15, type: "sale" },
  { id: "e5", name: "Wired Earphones", price: 15, category: "earphones", emoji: "🎧", stock: 25, type: "sale" },

  // Chargers
  { id: "ch1", name: "65W GaN USB-C Charger", price: 45, category: "chargers", emoji: "🔌", stock: 20, type: "sale" },
  { id: "ch2", name: "Apple MagSafe Charger", price: 39, category: "chargers", emoji: "🔌", stock: 10, type: "sale" },
  { id: "ch3", name: "20W USB-C Adapter", price: 29, category: "chargers", emoji: "🔌", stock: 15, type: "sale" },
  { id: "ch4", name: "10000mAh Power Bank", price: 35, category: "chargers", emoji: "🔋", stock: 12, type: "sale" },
  { id: "ch5", name: "Wireless Charging Pad", price: 25, category: "chargers", emoji: "⚡", stock: 18, type: "sale" },

  // Cables
  { id: "ca1", name: "USB-C to USB-C 1m", price: 15, category: "cables", emoji: "🔗", stock: 30, type: "sale" },
  { id: "ca2", name: "Lightning to USB-C", price: 20, category: "cables", emoji: "🔗", stock: 20, type: "sale" },
  { id: "ca3", name: "HDMI 2.1 Cable 2m", price: 25, category: "cables", emoji: "🔗", stock: 15, type: "sale" },
  { id: "ca4", name: "USB-A to USB-C", price: 10, category: "cables", emoji: "🔗", stock: 35, type: "sale" },

  // Accessories
  { id: "ac1", name: "Tempered Glass Protector", price: 12, category: "accessories", emoji: "📱", stock: 40, type: "sale" },
  { id: "ac2", name: "Adjustable Phone Stand", price: 18, category: "accessories", emoji: "📱", stock: 20, type: "sale" },
  { id: "ac3", name: "15\" Laptop Sleeve", price: 25, category: "accessories", emoji: "💼", stock: 15, type: "sale" },
  { id: "ac4", name: "USB 4-Port Hub", price: 22, category: "accessories", emoji: "🖥️", stock: 18, type: "sale" },

  // ── For Rent (price = per-day rate) ──────────────────────────────────
  // Laptops
  { id: "l1", name: "MacBook Pro 14\"", price: 25, category: "laptops", emoji: "💻", stock: 3, type: "rental" },
  { id: "l2", name: "Dell XPS 15", price: 20, category: "laptops", emoji: "💻", stock: 4, type: "rental" },
  { id: "l3", name: "ThinkPad X1 Carbon", price: 18, category: "laptops", emoji: "💻", stock: 3, type: "rental" },
  { id: "l4", name: "ASUS ROG Gaming Laptop", price: 30, category: "laptops", emoji: "🎮", stock: 2, type: "rental" },

  // Webcams
  { id: "w1", name: "Logitech 4K Webcam", price: 8, category: "webcams", emoji: "📷", stock: 5, type: "rental" },
  { id: "w2", name: "Razer Kiyo Pro", price: 6, category: "webcams", emoji: "📷", stock: 4, type: "rental" },
  { id: "w3", name: "DSLR Camera Kit", price: 35, category: "webcams", emoji: "📸", stock: 2, type: "rental" },

  // Displays
  { id: "d1", name: "27\" 4K Monitor", price: 15, category: "displays", emoji: "🖥️", stock: 3, type: "rental" },
  { id: "d2", name: "Portable 15\" Monitor", price: 10, category: "displays", emoji: "🖥️", stock: 4, type: "rental" },
  { id: "d3", name: "Mini Projector", price: 20, category: "displays", emoji: "📽️", stock: 2, type: "rental" },

  // Peripherals
  { id: "p1", name: "Mechanical Keyboard", price: 5, category: "peripherals", emoji: "⌨️", stock: 6, type: "rental" },
  { id: "p2", name: "Wireless Mouse", price: 3, category: "peripherals", emoji: "🖱️", stock: 8, type: "rental" },
  { id: "p3", name: "Noise-Cancel Headset", price: 7, category: "peripherals", emoji: "🎙️", stock: 5, type: "rental" },
];
