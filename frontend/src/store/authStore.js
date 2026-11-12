import { create } from 'zustand';
import api from '../api/client';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('wholesalehub_user') || 'null'),
  retailerProfile: JSON.parse(localStorage.getItem('wholesalehub_profile') || 'null'),
  token: localStorage.getItem('wholesalehub_token') || null,
  isAuthenticated: !!localStorage.getItem('wholesalehub_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success) {
        localStorage.setItem('wholesalehub_token', res.token);
        localStorage.setItem('wholesalehub_user', JSON.stringify(res.user));
        if (res.retailerProfile) {
          localStorage.setItem('wholesalehub_profile', JSON.stringify(res.retailerProfile));
        } else {
          localStorage.removeItem('wholesalehub_profile');
        }

        set({
          user: res.user,
          retailerProfile: res.retailerProfile,
          token: res.token,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      }
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, message: err.message };
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', formData);
      if (res.success) {
        localStorage.setItem('wholesalehub_token', res.token);
        localStorage.setItem('wholesalehub_user', JSON.stringify(res.user));
        localStorage.setItem('wholesalehub_profile', JSON.stringify(res.retailerProfile));

        set({
          user: res.user,
          retailerProfile: res.retailerProfile,
          token: res.token,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true, message: res.message };
      }
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, message: err.message };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('wholesalehub_token');
    localStorage.removeItem('wholesalehub_user');
    localStorage.removeItem('wholesalehub_profile');
    set({
      user: null,
      retailerProfile: null,
      token: null,
      isAuthenticated: false,
    });
  },

  fetchCurrentUser: async () => {
    if (!get().token) return;
    try {
      const res = await api.get('/auth/me');
      if (res.success) {
        set({ user: res.user, retailerProfile: res.retailerProfile });
        localStorage.setItem('wholesalehub_user', JSON.stringify(res.user));
        if (res.retailerProfile) {
          localStorage.setItem('wholesalehub_profile', JSON.stringify(res.retailerProfile));
        }
      }
    } catch (e) {
      get().logout();
    }
  },

  quickSwitchUser: async (type) => {
    const creds = {
      admin: { email: 'admin@wholesalehub.io', password: 'Admin@123456' },
      platinum: { email: 'platinum.retailer@supermart.com', password: 'Retailer@123456' },
      gold: { email: 'gold.retailer@metrofmcg.in', password: 'Retailer@123456' },
      silver: { email: 'silver.retailer@citygrocery.com', password: 'Retailer@123456' },
      pending: { email: 'pending.retailer@freshbazaar.org', password: 'Retailer@123456' },
    };

    const target = creds[type];
    if (target) {
      return await get().login(target.email, target.password);
    }
  },
}));
