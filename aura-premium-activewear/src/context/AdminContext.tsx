import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Product, OrderDetails } from '../types';
import * as api from '../api';
import type { AppCategory, AdminUser } from '../api';

import { useUser } from './UserContext';

interface AdminContextType {
  allProducts: Product[];
  productsLoading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<void>;
  refreshProducts: () => Promise<void>;
  // Orders / Transactions
  allOrders: OrderDetails[];
  ordersLoading: boolean;
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<void>;
  // Categories
  allCategories: AppCategory[];
  categoriesLoading: boolean;
  addCategory: (id: string, label: string) => Promise<boolean>;
  removeCategory: (id: string) => Promise<void>;
  refreshCategories: () => Promise<void>;
  // Users
  allUsers: AdminUser[];
  usersLoading: boolean;
  refreshUsers: () => Promise<void>;
  addUser: (data: any) => Promise<boolean>;
  updateUserDetails: (id: string | number, data: any) => Promise<boolean>;
  removeUser: (id: string | number) => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType>({
  allProducts: [],
  productsLoading: true,
  addProduct: async () => false,
  updateProduct: async () => false,
  deleteProduct: async () => { },
  refreshProducts: async () => { },
  allOrders: [],
  ordersLoading: false,
  refreshOrders: async () => { },
  updateOrderStatus: async () => false,
  deleteOrder: async () => { },
  allCategories: [],
  categoriesLoading: false,
  addCategory: async () => false,
  removeCategory: async () => { },
  refreshCategories: async () => { },
  allUsers: [],
  usersLoading: false,
  refreshUsers: async () => {},
  addUser: async () => false,
  updateUserDetails: async () => false,
  removeUser: async () => false,
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const { isUserLoggedIn, currentUser } = useUser();
  const isAdmin = currentUser?.role === 1;

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<OrderDetails[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [allCategories, setAllCategories] = useState<AppCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const refreshProducts = async () => {
    setProductsLoading(true);
    try {
      const products = await api.getProducts();
      setAllProducts(products);
    } catch (err) {
      console.error('Failed to load products from the backend:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const refreshCategories = async () => {
    setCategoriesLoading(true);
    try {
      const cats = await api.getCategories();
      setAllCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const refreshOrders = async () => {
    setOrdersLoading(true);
    try {
      const orders = await api.getOrders();
      setAllOrders(orders);
    } catch (err) {
      console.error('Failed to load orders from the backend:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const refreshUsers = async () => {
    setUsersLoading(true);
    try {
      const users = await api.getAdminUsers();
      setAllUsers(users);
    } catch (err) {
      console.error('Failed to load users from the backend:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    refreshProducts();
    refreshCategories();
  }, []);

  // Reload orders and users automatically when the admin logs in
  useEffect(() => {
    if (isAdmin) {
      refreshOrders();
      refreshUsers();
    } else {
      setAllOrders([]);
      setAllUsers([]);
    }
  }, [isAdmin]);

  const addProduct = async (product: Omit<Product, 'id'>): Promise<boolean> => {
    try {
      await api.createProduct(product);
      await refreshProducts();
      return true;
    } catch (err) {
      console.error('Failed to add product:', err);
      return false;
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>): Promise<boolean> => {
    try {
      await api.updateProduct(id, product);
      await refreshProducts();
      return true;
    } catch (err) {
      console.error('Failed to update product:', err);
      return false;
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    try {
      await api.deleteProduct(id);
      await refreshProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const addCategory = async (id: string, label: string): Promise<boolean> => {
    try {
      await api.createCategory(id, label);
      await refreshCategories();
      return true;
    } catch (err: any) {
      console.error('Failed to add category:', err);
      return false;
    }
  };

  const removeCategory = async (id: string): Promise<void> => {
    try {
      await api.deleteCategory(id);
      await refreshCategories();
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      throw err; // re-throw so UI can show the error message
    }
  };

  const updateOrderStatus = async (id: string, status: string): Promise<boolean> => {
    try {
      const updated = await api.updateOrderStatus(id, status);
      setAllOrders(prev => prev.map(o => (o.id === id ? updated : o)));
      return true;
    } catch (err) {
      console.error('Failed to update order status:', err);
      return false;
    }
  };

  const deleteOrder = async (id: string): Promise<void> => {
    try {
      await api.deleteOrder(id);
      setAllOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      console.error('Failed to delete order:', err);
    }
  };

  const addUser = async (data: any): Promise<boolean> => {
    try {
      await api.createAdminUser(data);
      await refreshUsers();
      return true;
    } catch (err) {
      console.error('Failed to add user:', err);
      return false;
    }
  };

  const updateUserDetails = async (id: string | number, data: any): Promise<boolean> => {
    try {
      await api.updateAdminUser(id, data);
      await refreshUsers();
      return true;
    } catch (err) {
      console.error('Failed to update user:', err);
      return false;
    }
  };

  const removeUser = async (id: string | number): Promise<boolean> => {
    try {
      await api.deleteAdminUser(id);
      await refreshUsers();
      return true;
    } catch (err) {
      console.error('Failed to remove user:', err);
      return false;
    }
  };
  // ── Auto-logout Idle Timer (10 minutes) ──────────────────────────
  const { logoutUser } = useUser();

  useEffect(() => {
    if (!isAdmin) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 10 minute = 6000000 ms
      timeoutId = setTimeout(() => {
        logoutUser();
        window.location.reload(); // Hard refresh per user request
      }, 6000000);
    };

    // Listen to mouse, keyboard, scroll, and click events to track activity
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach((event) => window.addEventListener(event, resetTimer, true));

    // Initial setup
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer, true));
    };
  }, [isAdmin, logoutUser]);

  return (
    <AdminContext.Provider
      value={{
        allProducts,
        productsLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        refreshProducts,
        allOrders,
        ordersLoading,
        refreshOrders,
        updateOrderStatus,
        deleteOrder,
        allCategories,
        categoriesLoading,
        addCategory,
        removeCategory,
        refreshCategories,
        allUsers,
        usersLoading,
        refreshUsers,
        addUser,
        updateUserDetails,
        removeUser,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
