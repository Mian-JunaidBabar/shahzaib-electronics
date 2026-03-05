"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { CartItem } from "@/lib/whatsapp";

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  addToCart: (item: CartItem) => void;
  removeItem: (id: string | number, variantId?: string) => void;
  updateQuantity: (
    id: string | number,
    quantity: number,
    variantId?: string,
  ) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "shahzaib_autos_cart";

// Helper functions for localStorage
const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading cart from localStorage:", error);
    return [];
  }
};

const saveCartToStorage = (items: CartItem[]) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Error saving cart to localStorage:", error);
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize with empty array to prevent hydration mismatch
  const [items, setItems] = useState<CartItem[]>(() => {
    // Initialize from localStorage if available (client-side only)
    if (typeof window !== "undefined") {
      return loadCartFromStorage();
    }
    return [];
  });
  const [isHydrated, setIsHydrated] = useState(false);

  // Mark as hydrated after mount
  useEffect(() => {
    // This setState is intentional for mount detection and doesn't cause cascading renders
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  // Save cart to localStorage whenever items change (but not on initial hydration)
  useEffect(() => {
    if (isHydrated) {
      saveCartToStorage(items);
    }
  }, [items, isHydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">) => {
      setItems((prev) => {
        // Match by both product id and variantId so different variants of the same product are separate items
        const existing = prev.find(
          (i) => i.id === item.id && i.variantId === item.variantId,
        );
        if (existing) {
          const updated = prev.map((i) =>
            i.id === item.id && i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          );
          return updated;
        }
        const newItems = [...prev, { ...item, quantity: 1 }];
        return newItems;
      });
    },
    [isHydrated],
  );

  // Alias for addItem that accepts full CartItem (with quantity)
  const addToCart = useCallback(
    (item: CartItem) => {
      setItems((prev) => {
        // Match by both product id and variantId
        const existing = prev.find(
          (i) => i.id === item.id && i.variantId === item.variantId,
        );
        if (existing) {
          const updated = prev.map((i) =>
            i.id === item.id && i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + (item.quantity || 1) }
              : i,
          );
          return updated;
        }
        const newItems = [...prev, { ...item, quantity: item.quantity || 1 }];
        return newItems;
      });
    },
    [isHydrated],
  );

  const removeItem = useCallback((id: string | number, variantId?: string) => {
    setItems((prev) =>
      prev.filter((i) => {
        if (variantId) {
          return !(i.id === id && i.variantId === variantId);
        }
        return i.id !== id;
      }),
    );
  }, []);

  const updateQuantity = useCallback(
    (id: string | number, quantity: number, variantId?: string) => {
      if (quantity <= 0) {
        removeItem(id, variantId);
      } else {
        setItems((prev) =>
          prev.map((i) => {
            const isMatch = variantId
              ? i.id === id && i.variantId === variantId
              : i.id === id;
            return isMatch ? { ...i, quantity } : i;
          }),
        );
      }
    },
    [removeItem],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addToCart,
        removeItem,
        updateQuantity,
        clearCart,
        getItemCount,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
