import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Product } from '../types/bazaar';

export type CartItem = {
  productId: string;
  name: string;
  price: number; // integer cents
  category: Product['category'];
  stock: number;
  imageUrl: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotalCents: number;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const CART_STORAGE_KEY = 'bug_bazaar_cart_v1';

const CartContext = createContext<CartContextValue | null>(null);

function loadInitialCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is CartItem => {
      return (
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as CartItem).productId === 'string' &&
        typeof (entry as CartItem).name === 'string' &&
        typeof (entry as CartItem).price === 'number' &&
        typeof (entry as CartItem).quantity === 'number' &&
        (entry as CartItem).quantity > 0
      );
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadInitialCart());

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [items]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    if (quantity <= 0 || product.stock <= 0) return;

    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const nextQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: nextQty, stock: product.stock, price: product.price }
            : item,
        );
      }

      const initialQty = Math.min(product.stock, quantity);
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          stock: product.stock,
          imageUrl: product.imageUrl,
          quantity: initialQty,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.productId !== productId);
      }
      return prev.map((item) => {
        if (item.productId !== productId) return item;
        const clamped = Math.min(item.stock, quantity);
        return { ...item, quantity: clamped };
      });
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const subtotalCents = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItems,
      subtotalCents,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, totalItems, subtotalCents, addItem, updateQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
