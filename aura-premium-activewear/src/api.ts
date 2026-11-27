import { Product, CartItem, OrderDetails } from './types';

const USER_TOKEN_KEY = 'aura_user_token';

function getToken(): string | null {
  return localStorage.getItem(USER_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Products ────────────────────────────────────────────────
export function getProducts(): Promise<Product[]> {
  return request('/products');
}

export function getProduct(id: string): Promise<Product> {
  return request(`/products/${id}`);
}

export function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  return request('/products', { method: 'POST', body: JSON.stringify(product) });
}

export function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  return request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) });
}

export function deleteProduct(id: string): Promise<void> {
  return request(`/products/${id}`, { method: 'DELETE' });
}

// ── Categories ──────────────────────────────────────────────
export interface AppCategory { id: string; label: string; }

export function getCategories(): Promise<AppCategory[]> {
  return request('/categories');
}

export function createCategory(id: string, label: string): Promise<AppCategory> {
  return request('/categories', { method: 'POST', body: JSON.stringify({ id, label }) });
}

export function deleteCategory(id: string): Promise<void> {
  return request(`/categories/${id}`, { method: 'DELETE' });
}



// ── Orders ──────────────────────────────────────────────────
export interface PlaceOrderInput {
  items: {
    productId: string;
    size: string;
    colorName: string;
    colorHex: string;
    quantity: number;
  }[];
  customerInfo: OrderDetails['customerInfo'];
  discountCode?: string;
  paymentMethod: 'card' | 'applepay' | 'googlepay';
  card: { number: string; expiry: string; name: string };
}

export function placeOrder(order: PlaceOrderInput): Promise<OrderDetails> {
  return request('/orders', { method: 'POST', body: JSON.stringify(order) });
}

export function getOrder(id: string): Promise<OrderDetails> {
  return request(`/orders/${id}`);
}

export function getOrders(): Promise<OrderDetails[]> {
  return request('/orders');
}

export function updateOrderStatus(id: string, status: string): Promise<OrderDetails> {
  return request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
}

export function deleteOrder(id: string): Promise<void> {
  return request(`/orders/${id}`, { method: 'DELETE' });
}

// ── Discounts ───────────────────────────────────────────────
export function validateDiscount(code: string): Promise<{ valid: boolean; percentOff: number }> {
  return request('/discounts/validate', { method: 'POST', body: JSON.stringify({ code }) });
}

// ── Newsletter ──────────────────────────────────────────────
export function subscribeNewsletter(email: string): Promise<{ subscribed: boolean }> {
  return request('/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
}


// ── Users ───────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export function userSignup(data: any): Promise<AuthResponse> {
  return request('/auth/signup', { method: 'POST', body: JSON.stringify(data) });
}

export function userLogin(data: any): Promise<AuthResponse> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
}

export function googleLogin(data: any): Promise<AuthResponse> {
  return request('/auth/google', { method: 'POST', body: JSON.stringify(data) });
}

export function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}

export function resetPassword(data: any): Promise<{ success: boolean; message: string }> {
  return request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) });
}

export function clearUserToken() {
  localStorage.removeItem(USER_TOKEN_KEY);
}

export function setUserToken(token: string) {
  localStorage.setItem(USER_TOKEN_KEY, token);
}

// ── Admin Users Management ──────────────────────────────────
export interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: number;
  created_at: string;
}

export function getAdminUsers(): Promise<AdminUser[]> {
  return request('/admin/users');
}

export function createAdminUser(data: any): Promise<AdminUser> {
  return request('/admin/users', { method: 'POST', body: JSON.stringify(data) });
}

export function updateAdminUser(id: string | number, data: any): Promise<AdminUser> {
  return request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteAdminUser(id: string | number): Promise<void> {
  return request(`/admin/users/${id}`, { method: 'DELETE' });
}

export function hasUserToken(): boolean {
  return !!localStorage.getItem(USER_TOKEN_KEY);
}

export function getUserOrders(): Promise<any[]> {
  const token = localStorage.getItem(USER_TOKEN_KEY);
  return fetch('/api/user/orders', {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json());
}
