import { create } from 'zustand';
import api from '../api/client';

export const useCartStore = create((set, get) => ({
  cart: null,
  items: [],
  itemsCount: 0,
  subtotal: 0,
  totalDiscount: 0,
  totalTax: 0,
  grandTotal: 0,
  isLoading: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/cart');
      if (res.success && res.data) {
        set({
          cart: res.data,
          items: res.data.items || [],
          itemsCount: res.data.itemsCount || 0,
          subtotal: res.data.subtotal || 0,
          totalDiscount: res.data.totalDiscount || 0,
          totalTax: res.data.totalTax || 0,
          grandTotal: res.data.grandTotal || 0,
          isLoading: false,
        });
      }
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  addToCart: async (productId, quantity, notes = '') => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/cart/items', { productId, quantity, notes });
      if (res.success && res.data) {
        set({
          cart: res.data,
          items: res.data.items || [],
          itemsCount: res.data.itemsCount || 0,
          subtotal: res.data.subtotal || 0,
          totalDiscount: res.data.totalDiscount || 0,
          totalTax: res.data.totalTax || 0,
          grandTotal: res.data.grandTotal || 0,
          isLoading: false,
        });
        return { success: true, message: res.message };
      }
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, message: err.message };
    }
  },

  updateQuantity: async (productId, quantity) => {
    try {
      const res = await api.patch(`/cart/items/${productId}`, { quantity });
      if (res.success && res.data) {
        set({
          cart: res.data,
          items: res.data.items || [],
          itemsCount: res.data.itemsCount || 0,
          subtotal: res.data.subtotal || 0,
          totalDiscount: res.data.totalDiscount || 0,
          totalTax: res.data.totalTax || 0,
          grandTotal: res.data.grandTotal || 0,
        });
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  removeItem: async (productId) => {
    try {
      const res = await api.delete(`/cart/items/${productId}`);
      if (res.success && res.data) {
        set({
          cart: res.data,
          items: res.data.items || [],
          itemsCount: res.data.itemsCount || 0,
          subtotal: res.data.subtotal || 0,
          totalDiscount: res.data.totalDiscount || 0,
          totalTax: res.data.totalTax || 0,
          grandTotal: res.data.grandTotal || 0,
        });
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  clearCart: async () => {
    try {
      await api.post('/cart/clear');
      set({
        cart: null,
        items: [],
        itemsCount: 0,
        subtotal: 0,
        totalDiscount: 0,
        totalTax: 0,
        grandTotal: 0,
      });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  bulkAdd: async (items) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/cart/bulk-add', { items });
      if (res.success && res.data) {
        set({
          cart: res.data,
          items: res.data.items || [],
          itemsCount: res.data.itemsCount || 0,
          subtotal: res.data.subtotal || 0,
          totalDiscount: res.data.totalDiscount || 0,
          totalTax: res.data.totalTax || 0,
          grandTotal: res.data.grandTotal || 0,
          isLoading: false,
        });
        return { success: true, message: res.message, added: res.added, skipped: res.skipped };
      }
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return { success: false, message: err.message };
    }
  },
}));
