import React, { useState, useRef, useEffect } from 'react';
import { upload } from '@vercel/blob/client';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Plus, Trash2, Package, Tag, Layers, DollarSign, Image as ImageIcon,
  CheckCircle2, AlertCircle, LogOut, BarChart3, ShoppingBag, Settings,
  ChevronRight, Upload, Star, Sparkles, Receipt, TrendingUp, RefreshCw, Edit2, Users
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { Product, Category, OrderDetails } from '../types';
import { DarvkLogo } from './DarvkLogo';
import { useUser } from '../context/UserContext';

interface AdminDashboardProps {
  onClose: () => void;
}

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'O/S'];

type Tab = 'products' | 'add' | 'orders' | 'categories' | 'reports' | 'users';

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const { isAdmin, logoutUser } = useUser();
  const {
    allProducts, productsLoading, addProduct, updateProduct, deleteProduct,
    allOrders, ordersLoading, refreshOrders, updateOrderStatus, deleteOrder,
    allCategories, categoriesLoading, addCategory, removeCategory,
    allUsers, usersLoading, addUser, updateUserDetails, removeUser,
  } = useAdmin();
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [orderDeleteConfirmId, setOrderDeleteConfirmId] = useState<string | null>(null);
  // Category form state
  const [catLabelInput, setCatLabelInput] = useState('');
  const [catError, setCatError] = useState('');
  const [catDeleteId, setCatDeleteId] = useState<string | null>(null);
  const [catDeleteError, setCatDeleteError] = useState('');
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // ── Users State ──────────────────────────────────────────────
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormFirstName, setUserFormFirstName] = useState('');
  const [userFormLastName, setUserFormLastName] = useState('');
  const [userFormRole, setUserFormRole] = useState(2); // 1 = Admin, 2 = Customer
  const [userFormError, setUserFormError] = useState('');
  const [userDeleteId, setUserDeleteId] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userSubmitting, setUserSubmitting] = useState(false);

  // ── Report State ────────────────────────────────────────────
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [reportEndDate, setReportEndDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [dateRangePreset, setDateRangePreset] = useState('last30');

  useEffect(() => {
    const today = new Date();
    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    if (dateRangePreset === 'thisMonth') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setReportStartDate(formatDate(start));
      setReportEndDate(formatDate(end));
    } else if (dateRangePreset === 'lastMonth') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      setReportStartDate(formatDate(start));
      setReportEndDate(formatDate(end));
    } else if (dateRangePreset === 'last7') {
      const start = new Date();
      start.setDate(today.getDate() - 7);
      setReportStartDate(formatDate(start));
      setReportEndDate(formatDate(today));
    } else if (dateRangePreset === 'last30') {
      const start = new Date();
      start.setDate(today.getDate() - 30);
      setReportStartDate(formatDate(start));
      setReportEndDate(formatDate(today));
    } else if (dateRangePreset === 'last90') {
      const start = new Date();
      start.setDate(today.getDate() - 90);
      setReportStartDate(formatDate(start));
      setReportEndDate(formatDate(today));
    } else if (dateRangePreset === 'thisYear') {
      const start = new Date(today.getFullYear(), 0, 1);
      setReportStartDate(formatDate(start));
      setReportEndDate(formatDate(today));
    }
  }, [dateRangePreset]);

  // Auto-close dashboard if admin session is lost (e.g. token expired)
  useEffect(() => {
    if (!isAdmin) {
      onClose();
    }
  }, [isAdmin, onClose]);

  // ── Form State ──────────────────────────────────────────────
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('');
  const [formGender, setFormGender] = useState('unisex');
  const [formDescription, setFormDescription] = useState('');
  const [formFeatures, setFormFeatures] = useState('');
  const [formSizes, setFormSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [formColors, setFormColors] = useState([{ name: 'Black', hex: '#111827' }]);
  const [formStock, setFormStock] = useState('20');
  const [formIsNew, setFormIsNew] = useState(true);
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ── Image handling ──────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingImages(true);
    setFormErrors((prev) => {
      const { images: _ignored, ...rest } = prev;
      return rest;
    });

    const token = localStorage.getItem('aura_user_token');
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const blob = await upload(`products/${file.name}`, file, {
          access: 'private',
          handleUploadUrl: '/api/blob/upload',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        uploadedUrls.push(`/api/blob/image?url=${encodeURIComponent(blob.url)}`);
      }
      setFormImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      setFormErrors((prev) => ({
        ...prev,
        images: err?.message || 'Image upload to Vercel Blob failed',
      }));
    } finally {
      setIsUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const url = formImageUrl.trim();
    if (url) {
      setFormImages((prev) => [...prev, url]);
      setFormImageUrl('');
    }
  };

  const handleRemoveImage = (idx: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Size toggle ──────────────────────────────────────────────
  const toggleSize = (size: string) => {
    setFormSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // ── Color management ─────────────────────────────────────────
  const updateColor = (idx: number, field: 'name' | 'hex', val: string) => {
    setFormColors((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: val } : c)));
  };

  const addColorRow = () => setFormColors((prev) => [...prev, { name: '', hex: '#ffffff' }]);
  const removeColorRow = (idx: number) => setFormColors((prev) => prev.filter((_, i) => i !== idx));

  // ── Validation & Submit ──────────────────────────────────────
  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = 'Product name required';
    if (!formPrice || isNaN(Number(formPrice)) || Number(formPrice) <= 0) errors.price = 'Valid price required';
    if (!formCategory) errors.category = 'Please select a category';
    if (!formDescription.trim()) errors.description = 'Description required';
    if (formImages.length === 0) errors.images = 'At least one image required';
    if (formSizes.length === 0) errors.sizes = 'Select at least one size';
    if (formColors.some((c) => !c.name.trim())) errors.colors = 'All color names required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const newProduct: Omit<Product, 'id'> = {
      name: formName.trim(),
      price: Number(formPrice),
      originalPrice: formOriginalPrice ? Number(formOriginalPrice) : undefined,
      category: formCategory,
      images: formImages,
      description: formDescription.trim(),
      features: formFeatures.split('\n').map((f) => f.trim()).filter(Boolean),
      sizes: formSizes,
      colors: formColors.filter((c) => c.name.trim()),
      isNew: formIsNew,
      isBestSeller: formIsBestSeller,
      stock: Number(formStock) || 20,
      gender: formGender,
    };

    let ok = false;
    if (editingProductId) {
      ok = await updateProduct(editingProductId, newProduct);
    } else {
      ok = await addProduct(newProduct);
    }

    if (!ok) {
      setFormErrors({ submit: `Could not ${editingProductId ? 'update' : 'save'} the product. Check the backend is running and try again.` });
      return;
    }

    // Reset form
    setEditingProductId(null);
    setFormName(''); setFormPrice(''); setFormOriginalPrice('');
    setFormCategory(''); setFormGender('unisex'); setFormDescription(''); setFormFeatures('');
    setFormSizes(['S', 'M', 'L', 'XL']); setFormColors([{ name: 'Black', hex: '#111827' }]);
    setFormStock('20'); setFormIsNew(true); setFormIsBestSeller(false);
    setFormImages([]); setFormImageUrl(''); setFormErrors({});

    showSuccess(`"${newProduct.name}" ${editingProductId ? 'updated' : 'added to storefront'}!`);
    
    if (!editingProductId) {
      onClose();
      setTimeout(() => {
        const grid = document.getElementById('collection-grid-section');
        if (grid) grid.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setFormName(product.name || '');
    setFormPrice(product.price ? product.price.toString() : '0');
    setFormOriginalPrice(product.originalPrice ? product.originalPrice.toString() : '');
    setFormCategory(product.category || '');
    setFormGender(product.gender || 'unisex');
    setFormDescription(product.description || '');
    setFormFeatures(product.features ? product.features.join('\n') : '');
    setFormSizes(product.sizes || []);
    setFormColors(product.colors || []);
    setFormStock(product.stock !== undefined ? product.stock.toString() : '0');
    setFormIsNew(!!product.isNew);
    setFormIsBestSeller(!!product.isBestSeller);
    setFormImages(product.images || []);
    setActiveTab('add');
  };



  return (
    <div className="fixed inset-0 z-[300] bg-[#030303] text-white flex flex-col overflow-hidden">

      {/* ── Sidebar + Main layout ── */}
      <div className="flex h-full">

        {/* Sidebar */}
        <div className="w-60 bg-[#080808] border-r border-white/5 flex flex-col flex-shrink-0">
          {/* Brand */}
          <div className="p-5 border-b border-white/5">
            <DarvkLogo className="h-5 mb-3" />
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-400 tracking-widest uppercase">Admin Active</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1">
            {([
              { id: 'products', icon: Package, label: 'All Products', badge: allProducts.length },
              { id: 'add', icon: Plus, label: 'Add Product', badge: null },
              { id: 'orders', icon: Receipt, label: 'Transactions', badge: allOrders.length || null },
              { id: 'categories', icon: Tag, label: 'Categories', badge: allCategories.length || null },
              { id: 'reports', icon: BarChart3, label: 'Sales Reports', badge: null },
              { id: 'users', icon: Users, label: 'User Management', badge: allUsers.length || null },
            ] as const).map(({ id, icon: Icon, label, badge }) => (
              <button
                key={id}
                onClick={() => {
                  if (id === 'add') {
                    setEditingProductId(null);
                    setFormName(''); setFormPrice(''); setFormOriginalPrice('');
                    setFormCategory(''); setFormDescription(''); setFormFeatures('');
                    setFormSizes(['S', 'M', 'L', 'XL']); setFormColors([{ name: 'Black', hex: '#111827' }]);
                    setFormStock('20'); setFormIsNew(true); setFormIsBestSeller(false);
                    setFormImages([]); setFormImageUrl(''); setFormErrors({});
                  }
                  setActiveTab(id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all text-xs font-bold tracking-wider uppercase ${activeTab === id
                  ? 'bg-red-600/15 text-red-400 border border-red-600/20'
                  : 'text-neutral-500 hover:text-white hover:bg-white/5'
                  }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </div>
                {badge !== null && (
                  <span className="text-[9px] bg-white/10 text-neutral-400 font-mono px-1.5 py-0.5 rounded-sm">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Stats */}
          <div className="p-3 space-y-2 border-t border-white/5">
            <div className="bg-[#0c0c0c] border border-white/5 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-neutral-500">TOTAL PRODUCTS</span>
                <span className="text-white font-bold">{allProducts.length}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-neutral-500">TOTAL STOCK</span>
                <span className="text-emerald-400 font-bold">
                  {allProducts.reduce((sum, p) => sum + p.stock, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-neutral-500">ORDERS</span>
                <span className="text-amber-400 font-bold">{allOrders.length}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-neutral-500">REVENUE</span>
                <span className="text-red-400 font-bold">
                  ${allOrders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col flex-1 p-4 space-y-2 mt-auto border-t border-white/5">
              <button
                onClick={() => {
                  logoutUser();
                  onClose();
                }}
                className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Topbar */}
          <div className="px-6 py-4 border-b border-white/5 bg-[#050505] flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="text-sm font-black tracking-widest uppercase text-white">
                {activeTab === 'products' ? 'Product Management'
                  : activeTab === 'add' ? 'Add New Product'
                    : activeTab === 'orders' ? 'Transactions'
                      : activeTab === 'categories' ? 'Category Management'
                        : activeTab === 'users' ? 'User Management'
                          : 'Sales & Inventory Reports'}
              </h1>
              <p className="text-[10px] text-neutral-500 tracking-wider font-mono mt-0.5">
                DARVK ADMIN PORTAL — SYSTEM MANAGEMENT
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <AnimatePresence>
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-bold tracking-wider">{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={onClose}
                className="flex items-center space-x-1.5 text-[10px] text-neutral-500 hover:text-white font-bold tracking-widest uppercase transition-colors"
              >
                <span>VIEW STORE</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { logoutUser(); onClose(); }}
                className="flex items-center space-x-1.5 text-[10px] text-red-500/70 hover:text-red-400 font-bold tracking-widest uppercase transition-colors border border-red-500/20 hover:border-red-400/40 px-3 py-1.5 rounded-lg"
              >
                <LogOut className="w-3 h-3" />
                <span>LOGOUT</span>
              </button>
            </div>
          </div>

          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto">

            {/* ── PRODUCTS TAB ── */}
            {activeTab === 'products' && (
              <div className="p-6 space-y-4">
                {productsLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-white/10 border-t-red-600 rounded-full animate-spin" />
                    <p className="text-neutral-500 text-xs font-bold tracking-widest uppercase">Loading products...</p>
                  </div>
                ) : allProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
                    <Package className="w-16 h-16 text-white/10" />
                    <p className="text-neutral-500 text-xs font-bold tracking-widest uppercase">No products yet</p>
                    <button
                      onClick={() => setActiveTab('add')}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-lg uppercase tracking-widest transition-all"
                    >
                      Add First Product
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {allProducts.map((product) => {
                      return (
                        <div
                          key={product.id}
                          className="bg-[#0c0c0c] border border-white/5 rounded-xl overflow-hidden group transition-all"
                        >
                          {/* Image */}
                          <div className="relative h-44 bg-[#050505] overflow-hidden">
                            {product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <ImageIcon className="w-10 h-10 text-white/10" />
                              </div>
                            )}
                            {product.isNew && (
                              <span className="absolute top-2 right-2 text-[8px] bg-red-600 text-white font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                New
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-white line-clamp-1">
                              {product.name}
                            </h3>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-sm font-black text-white font-mono">LKR {product.price}</span>
                              <span className="text-[9px] text-neutral-500 font-mono uppercase bg-white/5 px-2 py-0.5 rounded">
                                {product.category}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-[9px] text-neutral-500 font-mono">
                                STOCK: {product.stock} | SIZES: {product.sizes.join(', ')}
                              </span>
                              <div className="relative">
                                {deleteConfirmId === product.id ? (
                                  <div className="flex items-center space-x-1.5">
                                    <button
                                      onClick={() => {
                                        deleteProduct(product.id).then(() => {
                                          setDeleteConfirmId(null);
                                          showSuccess('Product deleted.');
                                        });
                                      }}
                                      className="text-[9px] bg-red-600 text-white px-2 py-1 rounded font-bold uppercase tracking-wider"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="text-[9px] text-neutral-500 hover:text-white px-1 py-1 font-bold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => handleEditProduct(product)}
                                      className="text-neutral-600 hover:text-white transition-colors p-1"
                                      title="Edit product"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(product.id)}
                                      className="text-neutral-600 hover:text-red-500 transition-colors p-1"
                                      title="Delete product"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── TRANSACTIONS TAB ── */}
            {activeTab === 'orders' && (
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Receipt className="w-4 h-4 text-red-500" />
                    <h2 className="text-xs font-black tracking-widest uppercase text-white">Order Transactions</h2>
                    <span className="text-[9px] bg-white/5 text-neutral-400 font-mono px-2 py-0.5 rounded">
                      {allOrders.length} total
                    </span>
                  </div>
                  <button
                    onClick={() => refreshOrders()}
                    disabled={ordersLoading}
                    className="flex items-center space-x-1.5 text-[10px] text-neutral-500 hover:text-white font-bold uppercase tracking-widest transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {ordersLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-white/10 border-t-red-600 rounded-full animate-spin" />
                    <p className="text-neutral-500 text-xs font-bold tracking-widest uppercase">Loading transactions...</p>
                  </div>
                ) : allOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
                    <Receipt className="w-16 h-16 text-white/10" />
                    <p className="text-neutral-500 text-xs font-bold tracking-widest uppercase">No orders yet</p>
                    <p className="text-neutral-600 text-[10px] font-mono">Orders will appear here once customers place them</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allOrders.map((order: OrderDetails) => {
                      const statusColors: Record<string, string> = {
                        processing: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
                        shipped: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
                        delivered: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
                        cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
                      };
                      const statusColor = statusColors[order.status || 'processing'] || statusColors['processing'];

                      return (
                        <div key={order.id} className="bg-[#0c0c0c] border border-white/5 rounded-xl overflow-hidden">
                          {/* Order header */}
                          <div className="px-4 py-3 bg-[#050505] border-b border-white/5 flex flex-wrap items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">{order.id}</p>
                              <p className="text-[9px] font-mono text-neutral-600">
                                {new Date(order.date).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Status badge */}
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${statusColor}`}>
                                {order.status || 'processing'}
                              </span>
                              {/* Revenue */}
                              <span className="text-sm font-black text-white font-mono">${(order.total || 0).toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Order body */}
                          <div className="p-4 space-y-4">
                            {/* Items */}
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center space-x-3">
                                  {item.product.images?.[0] && (
                                    <img
                                      src={item.product.images[0]}
                                      alt={item.product.name}
                                      className="w-10 h-10 rounded-lg object-cover border border-white/5"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-white uppercase tracking-wide truncate">{item.product.name}</p>
                                    <p className="text-[9px] font-mono text-neutral-500">
                                      {item.selectedSize} · {item.selectedColor?.name} · Qty {item.quantity}
                                    </p>
                                  </div>
                                  <span className="text-[10px] font-mono text-white">LKR {(item.product.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>

                            {/* Customer + Totals */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="bg-[#080808] rounded-lg p-3 space-y-1">
                                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Customer</p>
                                <p className="text-[10px] text-white font-bold">{order.customerInfo?.firstName} {order.customerInfo?.lastName}</p>
                                <p className="text-[9px] text-neutral-400 font-mono">{order.customerInfo?.email}</p>
                                <p className="text-[9px] text-neutral-500 font-mono">
                                  {order.customerInfo?.address}, {order.customerInfo?.city} {order.customerInfo?.postalCode}
                                </p>
                                <p className="text-[9px] text-neutral-500 font-mono">{order.customerInfo?.country}</p>
                              </div>
                              <div className="bg-[#080808] rounded-lg p-3 space-y-1.5">
                                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Totals</p>
                                <div className="flex justify-between text-[9px] font-mono">
                                  <span className="text-neutral-400">Subtotal</span>
                                  <span className="text-white">LKR {(order.subtotal || 0).toFixed(2)}</span>
                                </div>
                                {order.discountCode && (
                                  <div className="flex justify-between text-[9px] font-mono">
                                    <span className="text-neutral-400">Discount ({order.discountCode})</span>
                                    <span className="text-emerald-400">-LKR {(order.discountAmount || 0).toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-[9px] font-mono">
                                  <span className="text-neutral-400">Shipping</span>
                                  <span className="text-white">{order.shipping === 0 ? 'FREE' : `LKR ${order.shipping}`}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-mono border-t border-white/5 pt-1.5">
                                  <span className="text-white font-bold">Total</span>
                                  <span className="text-white font-bold">LKR {(order.total || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[9px] font-mono">
                                  <span className="text-neutral-400">Payment</span>
                                  <span className="text-white uppercase">{order.paymentMethod}</span>
                                </div>
                              </div>
                            </div>

                            {/* Status Update + Delete */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <div className="flex items-center space-x-2">
                                <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Update Status:</label>
                                <select
                                  value={order.status || 'processing'}
                                  disabled={updatingOrderId === order.id}
                                  onChange={async (e) => {
                                    setUpdatingOrderId(order.id);
                                    await updateOrderStatus(order.id, e.target.value);
                                    setUpdatingOrderId(null);
                                    showSuccess(`Order status updated to "${e.target.value}"`);
                                  }}
                                  className="bg-[#0a0a0a] border border-white/10 text-white text-[10px] font-mono rounded-lg px-2 py-1.5 focus:border-red-600 focus:outline-none cursor-pointer uppercase tracking-wider"
                                >
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                                {updatingOrderId === order.id && (
                                  <div className="w-3.5 h-3.5 border-2 border-white/10 border-t-red-600 rounded-full animate-spin" />
                                )}
                              </div>

                              {/* Delete confirm */}
                              {orderDeleteConfirmId === order.id ? (
                                <div className="flex items-center space-x-1.5">
                                  <button
                                    onClick={async () => {
                                      await deleteOrder(order.id);
                                      setOrderDeleteConfirmId(null);
                                      showSuccess('Transaction deleted.');
                                    }}
                                    className="text-[9px] bg-red-600 text-white px-2 py-1 rounded font-bold uppercase tracking-wider"
                                  >
                                    Confirm Delete
                                  </button>
                                  <button
                                    onClick={() => setOrderDeleteConfirmId(null)}
                                    className="text-[9px] text-neutral-500 hover:text-white px-1 py-1 font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setOrderDeleteConfirmId(order.id)}
                                  className="text-neutral-600 hover:text-red-500 transition-colors p-1"
                                  title="Delete transaction"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ADD PRODUCT TAB ── */}
            {activeTab === 'add' && (
              <form onSubmit={handleSubmit} className="p-6 max-w-3xl mx-auto space-y-8 pb-16">

                {/* SECTION: Basic Info */}
                <section className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
                    <Tag className="w-4 h-4 text-red-500" />
                    <h2 className="text-xs font-black tracking-widest uppercase text-white">1. Basic Information</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="sm:col-span-2">
                      <label className="field-label">Product Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Performance Seamless Tee"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="admin-input"
                      />
                      {formErrors.name && <p className="field-error">{formErrors.name}</p>}
                    </div>

                    {/* Price */}
                    <div>
                      <label className="field-label">Price (LKR)</label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-2.5 w-4 h-4 text-neutral-600" />
                        <input
                          type="number"
                          placeholder="48"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          className="admin-input pl-9"
                          min="1"
                        />
                      </div>
                      {formErrors.price && <p className="field-error">{formErrors.price}</p>}
                    </div>

                    {/* Original Price */}
                    <div>
                      <label className="field-label">Original Price in LKR (optional — for strike-through)</label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-2.5 w-4 h-4 text-neutral-600" />
                        <input
                          type="number"
                          placeholder="58"
                          value={formOriginalPrice}
                          onChange={(e) => setFormOriginalPrice(e.target.value)}
                          className="admin-input pl-9"
                          min="1"
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="field-label">Category</label>
                      <select
                        value={formCategory}
                        onChange={(e) => {
                          setFormCategory(e.target.value as Category);
                        }}
                        className={`admin-input ${formErrors.category ? 'border-red-500/60' : ''}`}
                      >
                        <option value="">— Select a category —</option>
                        {allCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                      {formErrors.category && <p className="field-error">{formErrors.category}</p>}
                      {allCategories.length === 0 && !categoriesLoading && (
                        <p className="field-error">No categories found. Go to the <button type="button" onClick={() => setActiveTab('categories')} className="underline text-red-400">Categories</button> tab to create one first.</p>
                      )}
                    </div>


                    {/* Gender */}
                    <div>
                      <label className="field-label">Gender (Target Audience)</label>
                      <select
                        value={formGender}
                        onChange={(e) => setFormGender(e.target.value)}
                        className="admin-input"
                      >
                        <option value="unisex">Unisex</option>
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                      </select>
                    </div>

                    {/* Stock */}
                    <div>
                      <label className="field-label">Stock Quantity</label>
                      <input
                        type="number"
                        placeholder="20"
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        className="admin-input"
                        min="0"
                      />
                    </div>

                    {/* Badges */}
                    <div className="sm:col-span-2 flex items-center space-x-6">
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formIsNew}
                          onChange={(e) => setFormIsNew(e.target.checked)}
                          className="w-4 h-4 accent-red-600"
                        />
                        <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                          Mark as New
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formIsBestSeller}
                          onChange={(e) => setFormIsBestSeller(e.target.checked)}
                          className="w-4 h-4 accent-red-600"
                        />
                        <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                          Best Seller
                        </span>
                      </label>
                    </div>
                  </div>
                </section>

                {/* SECTION: Images */}
                <section className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
                    <ImageIcon className="w-4 h-4 text-red-500" />
                    <h2 className="text-xs font-black tracking-widest uppercase text-white">2. Product Images</h2>
                  </div>

                  {/* Upload from device */}
                  <div
                    onClick={() => !isUploadingImages && fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-white/10 hover:border-red-600/40 rounded-xl p-8 flex flex-col items-center justify-center transition-all group ${isUploadingImages ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                  >
                    <Upload className="w-8 h-8 text-neutral-600 group-hover:text-red-500 transition-colors mb-2" />
                    <p className="text-xs font-bold text-neutral-500 tracking-widest uppercase group-hover:text-white transition-colors">
                      {isUploadingImages ? 'Uploading to Vercel Blob...' : 'Click to upload images'}
                    </p>
                    <p className="text-[10px] text-neutral-600 mt-1 font-mono">JPG, PNG, WEBP supported</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Or paste URL */}
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      placeholder="Or paste an image URL (https://...)"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImageUrl())}
                      className="admin-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 rounded-lg uppercase tracking-widest transition-all"
                    >
                      Add
                    </button>
                  </div>

                  {formErrors.images && <p className="field-error">{formErrors.images}</p>}

                  {/* Image Previews */}
                  {formImages.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {formImages.map((src, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-[#0c0c0c] border border-white/5">
                          <img src={src} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1 text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                              Main
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* SECTION: Description */}
                <section className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
                    <Layers className="w-4 h-4 text-red-500" />
                    <h2 className="text-xs font-black tracking-widest uppercase text-white">3. Description & Features</h2>
                  </div>

                  <div>
                    <label className="field-label">Product Description</label>
                    <textarea
                      placeholder="Describe the product in detail — fabric, purpose, fit, technology..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={3}
                      className="admin-input resize-none"
                    />
                    {formErrors.description && <p className="field-error">{formErrors.description}</p>}
                  </div>

                  <div>
                    <label className="field-label">Key Features (one per line)</label>
                    <textarea
                      placeholder={"4-way stretch compression knit\nAnti-odor silver-ion treatment\nMoisture-wicking technology"}
                      value={formFeatures}
                      onChange={(e) => setFormFeatures(e.target.value)}
                      rows={4}
                      className="admin-input resize-none font-mono"
                    />
                  </div>
                </section>

                {/* SECTION: Sizes */}
                <section className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
                    <ShoppingBag className="w-4 h-4 text-red-500" />
                    <h2 className="text-xs font-black tracking-widest uppercase text-white">4. Available Sizes</h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {ALL_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all border ${formSizes.includes(size)
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'bg-transparent border-white/10 text-neutral-500 hover:border-white/30 hover:text-white'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {formErrors.sizes && <p className="field-error">{formErrors.sizes}</p>}
                </section>

                {/* SECTION: Colors */}
                <section className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
                    <Sparkles className="w-4 h-4 text-red-500" />
                    <h2 className="text-xs font-black tracking-widest uppercase text-white">5. Color Variants</h2>
                  </div>

                  <div className="space-y-3">
                    {formColors.map((color, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={color.hex}
                          onChange={(e) => updateColor(idx, 'hex', e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/10 p-0.5"
                          title="Pick color"
                        />
                        <input
                          type="text"
                          placeholder="Color name (e.g. Obsidian Black)"
                          value={color.name}
                          onChange={(e) => updateColor(idx, 'name', e.target.value)}
                          className="admin-input flex-1"
                        />
                        {formColors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeColorRow(idx)}
                            className="text-neutral-600 hover:text-red-500 transition-colors p-1.5"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {formErrors.colors && <p className="field-error">{formErrors.colors}</p>}
                    <button
                      type="button"
                      onClick={addColorRow}
                      className="flex items-center space-x-1.5 text-xs text-neutral-500 hover:text-white font-bold uppercase tracking-widest transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Color Variant</span>
                    </button>
                  </div>
                </section>

                {/* Submit */}
                <div className="pt-4">
                  {formErrors.submit && (
                    <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span className="text-[10px] text-red-400 font-bold tracking-wider uppercase">{formErrors.submit}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    id="admin-add-product-btn"
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black tracking-[0.25em] text-xs flex items-center justify-center space-x-2.5 transition-all uppercase rounded-xl shadow-xl hover:scale-[1.01]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ADD PRODUCT TO STOREFRONT</span>
                  </button>
                </div>
              </form>
            )}

            {/* ── CATEGORIES TAB ── */}
            {activeTab === 'categories' && (
              <div className="p-6 max-w-2xl mx-auto space-y-8 pb-16">

                {/* Create Category Form */}
                <section className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
                    <Tag className="w-4 h-4 text-red-500" />
                    <h2 className="text-xs font-black tracking-widest uppercase text-white">Create New Category</h2>
                  </div>

                  <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-5 space-y-4">
                    <div className="space-y-1.5">
                      <label className="field-label">Category Name (Display Label)</label>
                      <input
                        id="cat-label-input"
                        type="text"
                        placeholder="e.g. Footwear, Sports Bras, Swimwear..."
                        value={catLabelInput}
                        onChange={(e) => {
                          setCatLabelInput(e.target.value);
                          setCatError('');
                        }}
                        className="admin-input"
                        maxLength={80}
                      />
                      {catLabelInput && (
                        <p className="text-[9px] font-mono text-neutral-500 mt-1">
                          ID will be: <span className="text-neutral-300">{catLabelInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}</span>
                        </p>
                      )}
                      {catError && (
                        <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <span className="text-[10px] text-red-400 font-bold">{catError}</span>
                        </div>
                      )}
                    </div>

                    <button
                      id="cat-create-btn"
                      type="button"
                      disabled={catSubmitting || !catLabelInput.trim()}
                      onClick={async () => {
                        const label = catLabelInput.trim();
                        if (!label) { setCatError('Category name is required'); return; }
                        const id = label.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                        setCatSubmitting(true);
                        const ok = await addCategory(id, label);
                        setCatSubmitting(false);
                        if (ok) {
                          setCatLabelInput('');
                          setCatError('');
                          showSuccess(`Category "${label}" created!`);
                        } else {
                          setCatError('Failed to create category. It may already exist.');
                        }
                      }}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black tracking-[0.2em] text-xs flex items-center justify-center space-x-2 transition-all uppercase rounded-xl"
                    >
                      {catSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Create Category</span>
                        </>
                      )}
                    </button>
                  </div>
                </section>

                {/* Existing Categories List */}
                <section className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
                    <Layers className="w-4 h-4 text-red-500" />
                    <h2 className="text-xs font-black tracking-widest uppercase text-white">
                      Existing Categories
                    </h2>
                    <span className="text-[9px] bg-white/10 text-neutral-400 font-mono px-1.5 py-0.5 rounded-sm">{allCategories.length}</span>
                  </div>

                  {categoriesLoading ? (
                    <div className="flex items-center justify-center py-12 space-x-3">
                      <div className="w-6 h-6 border-2 border-white/10 border-t-red-600 rounded-full animate-spin" />
                      <p className="text-neutral-500 text-xs font-bold tracking-widest uppercase">Loading...</p>
                    </div>
                  ) : allCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-2">
                      <Tag className="w-12 h-12 text-white/10" />
                      <p className="text-neutral-500 text-xs font-bold tracking-widest uppercase">No categories yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allCategories.map((cat) => {
                        const productCount = allProducts.filter(p => p.category === cat.id).length;
                        const isDeleting = catDeleteId === cat.id;
                        return (
                          <div key={cat.id} className="bg-[#0c0c0c] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-600/20 flex items-center justify-center flex-shrink-0">
                                <Tag className="w-3.5 h-3.5 text-red-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-white uppercase tracking-wide">{cat.label}</p>
                                <p className="text-[9px] font-mono text-neutral-500">
                                  id: {cat.id} &nbsp;·&nbsp;
                                  <span className={productCount > 0 ? 'text-amber-400' : 'text-neutral-600'}>
                                    {productCount} product{productCount !== 1 ? 's' : ''}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {isDeleting ? (
                                <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
                                  <span className="text-[9px] text-red-400 font-bold">
                                    {catDeleteError || 'Are you sure?'}
                                  </span>
                                  {!catDeleteError && (
                                    <>
                                      <button
                                        id={`cat-confirm-delete-${cat.id}`}
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            await removeCategory(cat.id);
                                            setCatDeleteId(null);
                                            setCatDeleteError('');
                                            showSuccess(`Category "${cat.label}" deleted.`);
                                          } catch (err: any) {
                                            setCatDeleteError(err.message || 'Delete failed');
                                          }
                                        }}
                                        className="text-[9px] bg-red-600 text-white font-bold px-2 py-0.5 rounded hover:bg-red-700 transition-colors"
                                      >
                                        Yes, Delete
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => { setCatDeleteId(null); setCatDeleteError(''); }}
                                        className="text-[9px] text-neutral-400 hover:text-white font-bold px-2 py-0.5 rounded hover:bg-white/5 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                  {catDeleteError && (
                                    <button
                                      type="button"
                                      onClick={() => { setCatDeleteId(null); setCatDeleteError(''); }}
                                      className="text-[9px] text-neutral-400 hover:text-white font-bold px-2 py-0.5 rounded"
                                    >
                                      OK
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  id={`cat-delete-${cat.id}`}
                                  type="button"
                                  onClick={() => { setCatDeleteId(cat.id); setCatDeleteError(''); }}
                                  className="p-2 text-neutral-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                  title="Delete category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

              </div>
            )}

            {/* ── REPORTS TAB ── */}
            {activeTab === 'reports' && (() => {
              const filteredOrders = allOrders.filter(order => {
                const d = order.date ? order.date.split('T')[0] : '';
                return d >= reportStartDate && d <= reportEndDate;
              });

              interface ReportRow {
                productId: string;
                productName: string;
                salesQty: number;
                availableQty: number;
                discountAmount: number;
                salesValue: number;
              }

              const rowMap: Record<string, ReportRow> = {};

              allProducts.forEach(p => {
                rowMap[p.id] = { productId: p.id, productName: p.name, salesQty: 0, availableQty: p.stock, discountAmount: 0, salesValue: 0 };
              });

              filteredOrders.forEach(order => {
                const subtotal = order.subtotal || order.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
                order.items.forEach(item => {
                  const pid = item.product.id;
                  const qty = item.quantity;
                  const itemVal = item.product.price * qty;
                  const itemDiscount = order.discountAmount && subtotal > 0 ? (itemVal / subtotal) * (order.discountAmount || 0) : 0;
                  const netVal = itemVal - itemDiscount;
                  const dbProd = allProducts.find(p => p.id === pid);
                  if (!rowMap[pid]) {
                    rowMap[pid] = { productId: pid, productName: item.product.name, salesQty: 0, availableQty: dbProd ? dbProd.stock : 0, discountAmount: 0, salesValue: 0 };
                  }
                  rowMap[pid].salesQty += qty;
                  rowMap[pid].discountAmount += itemDiscount;
                  rowMap[pid].salesValue += netVal;
                });
              });

              const rows = Object.values(rowMap);
              const totAvail = rows.reduce((s, r) => s + r.availableQty, 0);
              const totSell = rows.reduce((s, r) => s + r.salesQty, 0);
              const totDisc = rows.reduce((s, r) => s + r.discountAmount, 0);
              const totVal = rows.reduce((s, r) => s + r.salesValue, 0);

              const handlePrint = () => {
                const pw = window.open('', '_blank');
                if (!pw) { alert('Allow popups to print reports.'); return; }
                const rowsHtml = rows.map(r => `<tr><td>${r.productId}</td><td>${r.productName}</td><td align="right">${r.salesQty}</td><td align="right">${r.availableQty}</td><td align="right">LKR ${r.discountAmount.toFixed(2)}</td><td align="right">LKR ${r.salesValue.toFixed(2)}</td></tr>`).join('');
                pw.document.write(`<!DOCTYPE html><html><head><title>DARVK Sales Report ${reportStartDate} to ${reportEndDate}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Outfit',system-ui,sans-serif;color:#111;padding:40px;background:#fff}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #dc2626;padding-bottom:24px;margin-bottom:32px}
  .logo{font-size:36px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;line-height:1}
  .logo span{color:#dc2626}
  .logo small{display:block;font-size:10px;color:#6b7280;font-weight:500;letter-spacing:.15em;margin-top:4px}
  .title{font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
  .date-range{font-size:12px;color:#6b7280}
  table{width:100%;border-collapse:collapse;margin-top:0}
  th{background:#f9fafb;border-bottom:2px solid #e5e7eb;padding:12px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#374151;text-align:left}
  td{border-bottom:1px solid #f3f4f6;padding:11px 14px;font-size:13px;color:#4b5563}
  tr:nth-child(even) td{background:#fafafa}
  .total td{font-weight:700;background:#f1f5f9!important;border-top:2px solid #334155;border-bottom:2px solid #334155;color:#0f172a;font-size:13px}
  .footer{margin-top:40px;display:flex;justify-content:space-between;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px}
  .print-btn{background:#111;color:#fff;border:none;padding:10px 22px;font-size:12px;font-weight:700;border-radius:6px;cursor:pointer;text-transform:uppercase;letter-spacing:.05em;margin-top:8px}
  @media print{.print-btn{display:none}}
</style></head><body>
<div class="header">
  <div><p class="title">Sales &amp; Inventory Report</p><p class="date-range">Period: <strong>${reportStartDate}</strong> &ndash; <strong>${reportEndDate}</strong></p></div>
  <div style="text-align:right"><div class="logo">DARVK<span>.</span><small>PREMIUM ACTIVEWEAR</small></div><button class="print-btn" onclick="window.print()">&#128438; Print</button></div>
</div>
<table><thead><tr><th>Product ID</th><th>Product Name</th><th style="text-align:right">Sales Qty</th><th style="text-align:right">Available Qty</th><th style="text-align:right">Discount Given</th><th style="text-align:right">Net Sales Value</th></tr></thead>
<tbody>${rowsHtml}<tr class="total"><td colspan="2">TOTALS</td><td align="right">${totSell}</td><td align="right">${totAvail}</td><td align="right">LKR ${totDisc.toFixed(2)}</td><td align="right">LKR ${totVal.toFixed(2)}</td></tr></tbody></table>
<div class="footer"><span>Generated: ${new Date().toLocaleString()}</span><span>DARVK Premium Activewear &copy; ${new Date().getFullYear()}</span></div>
</body></html>`);
                pw.document.close();
              };

              return (
                <div className="p-6 space-y-6 pb-16">

                  {/* Date filter bar */}
                  <div className="bg-[#0c0c0c] border border-white/5 rounded-xl p-5 flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[180px]">
                      <label className="field-label">Select Period</label>
                      <select
                        value={dateRangePreset}
                        onChange={(e) => setDateRangePreset(e.target.value)}
                        className="admin-input"
                      >
                        <option value="custom">— Custom Date Range —</option>
                        <option value="last7">Last 7 Days</option>
                        <option value="last30">Last 30 Days</option>
                        <option value="last90">Last 90 Days</option>
                        <option value="thisMonth">This Month</option>
                        <option value="lastMonth">Last Month</option>
                        <option value="thisYear">This Year</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <label className="field-label">Start Date</label>
                      <input
                        type="date"
                        value={reportStartDate}
                        onChange={e => {
                          setReportStartDate(e.target.value);
                          setDateRangePreset('custom');
                        }}
                        className="admin-input"
                      />
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <label className="field-label">End Date</label>
                      <input
                        type="date"
                        value={reportEndDate}
                        onChange={e => {
                          setReportEndDate(e.target.value);
                          setDateRangePreset('custom');
                        }}
                        className="admin-input"
                      />
                    </div>
                    <button
                      onClick={handlePrint}
                      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs px-6 py-3 rounded-lg uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Print Report</span>
                    </button>
                  </div>

                  {/* Summary cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Total Available Stock', value: `${totAvail} units`, color: 'text-white' },
                      { label: 'Total Units Sold', value: `${totSell} sold`, color: 'text-emerald-400' },
                      { label: 'Net Sales Value', value: `$${totVal.toFixed(2)}`, color: 'text-red-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-[#0c0c0c] border border-white/5 rounded-xl p-5">
                        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2">{label}</p>
                        <p className={`text-2xl font-black font-mono ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Product table */}
                  <div className="bg-[#0c0c0c] border border-white/5 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-xs font-black tracking-widest uppercase text-white">Product-Wise Sales Grouping</h3>
                      <span className="text-[9px] font-mono text-neutral-500">{reportStartDate} → {reportEndDate}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-black/30 text-[9px] font-bold text-neutral-400 uppercase tracking-widest border-b border-white/5">
                            <th className="px-5 py-4">Product ID</th>
                            <th className="px-5 py-4">Product Name</th>
                            <th className="px-5 py-4 text-right">Sales Qty</th>
                            <th className="px-5 py-4 text-right">Available Qty</th>
                            <th className="px-5 py-4 text-right">Discount Given</th>
                            <th className="px-5 py-4 text-right">Net Sales Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {rows.map(r => (
                            <tr key={r.productId} className="hover:bg-white/[0.03] transition-colors">
                              <td className="px-5 py-4 text-[11px] font-mono text-neutral-500">{r.productId}</td>
                              <td className="px-5 py-4 text-xs font-bold text-white uppercase tracking-wide">{r.productName}</td>
                              <td className="px-5 py-4 text-right text-xs font-mono text-emerald-400 font-bold">{r.salesQty}</td>
                              <td className="px-5 py-4 text-right text-xs font-mono text-white">{r.availableQty}</td>
                              <td className="px-5 py-4 text-right text-xs font-mono text-neutral-500">${r.discountAmount.toFixed(2)}</td>
                              <td className="px-5 py-4 text-right text-xs font-mono text-red-400 font-bold">${r.salesValue.toFixed(2)}</td>
                            </tr>
                          ))}
                          {rows.length === 0 && (
                            <tr><td colSpan={6} className="px-5 py-12 text-center text-neutral-600 text-xs font-bold uppercase tracking-widest">No orders in this date range</td></tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-black/50 border-t-2 border-white/10">
                            <td colSpan={2} className="px-5 py-5 text-xs font-black text-white uppercase tracking-widest">TOTAL SUMS</td>
                            <td className="px-5 py-5 text-right text-sm font-black font-mono text-emerald-400">{totSell}</td>
                            <td className="px-5 py-5 text-right text-sm font-black font-mono text-white">{totAvail}</td>
                            <td className="px-5 py-5 text-right text-sm font-black font-mono text-neutral-400">${totDisc.toFixed(2)}</td>
                            <td className="px-5 py-5 text-right text-sm font-black font-mono text-red-400">${totVal.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* ── User Management Tab ── */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-fade-in">
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row justify-end mb-8 border-b border-white/5 pb-4">
                  <button
                    onClick={() => {
                      setEditingUserId(null);
                      setUserFormEmail('');
                      setUserFormFirstName('');
                      setUserFormLastName('');
                      setUserFormPassword('');
                      setUserFormRole(2);
                      setShowUserForm(true);
                      setUserFormError('');
                    }}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all mt-4 sm:mt-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create User</span>
                  </button>
                </div>

                {usersLoading ? (
                  <div className="py-20 flex justify-center">
                    <RefreshCw className="w-6 h-6 text-neutral-600 animate-spin" />
                  </div>
                ) : (
                  <div className="bg-[#0a0a0a] rounded-xl border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                            <th className="px-5 py-4">User</th>
                            <th className="px-5 py-4">Role</th>
                            <th className="px-5 py-4">Joined</th>
                            <th className="px-5 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {allUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-5 py-4">
                                <div className="text-sm font-bold text-white mb-1">
                                  {u.first_name} {u.last_name}
                                </div>
                                <div className="text-[10px] font-mono text-neutral-500">
                                  {u.email}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest ${
                                  u.role === 1 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {u.role === 1 ? 'Admin' : 'Customer'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-[10px] font-mono text-neutral-500">
                                {new Date(u.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingUserId(u.id);
                                      setUserFormEmail(u.email);
                                      setUserFormFirstName(u.first_name);
                                      setUserFormLastName(u.last_name);
                                      setUserFormPassword(''); // blank implies unchanged
                                      setUserFormRole(u.role);
                                      setShowUserForm(true);
                                      setUserFormError('');
                                    }}
                                    className="p-2 bg-neutral-900 border border-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  
                                  {userDeleteId === u.id ? (
                                    <div className="flex items-center space-x-2 bg-red-600/20 border border-red-600/40 rounded-lg p-1">
                                      <button
                                        onClick={async () => {
                                          await removeUser(u.id);
                                          setUserDeleteId(null);
                                        }}
                                        className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-md"
                                      >
                                        Sure?
                                      </button>
                                      <button
                                        onClick={() => setUserDeleteId(null)}
                                        className="px-2 py-1 bg-neutral-800 text-neutral-400 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-md"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setUserDeleteId(u.id)}
                                      className="p-2 bg-neutral-900 border border-white/10 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {allUsers.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-5 py-12 text-center text-neutral-600 text-xs font-bold uppercase tracking-widest">
                                No users found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Add / Edit User Modal ── */}
            <AnimatePresence>
              {showUserForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#0c0c0c] border border-white/10 rounded-xl max-w-md w-full shadow-2xl overflow-hidden"
                  >
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                      <h3 className="text-sm font-bold tracking-widest uppercase text-white">
                        {editingUserId ? 'Edit User' : 'Create User'}
                      </h3>
                      <button onClick={() => setShowUserForm(false)} className="text-neutral-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <form 
                      autoComplete="off"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setUserSubmitting(true);
                        setUserFormError('');
                        try {
                          let success = false;
                          const data = {
                            firstName: userFormFirstName,
                            lastName: userFormLastName,
                            email: userFormEmail,
                            password: userFormPassword,
                            role: userFormRole
                          };
                          
                          if (editingUserId) {
                            success = await updateUserDetails(editingUserId, data);
                          } else {
                            success = await addUser(data);
                          }

                          if (success) {
                            setShowUserForm(false);
                          } else {
                            setUserFormError('Failed to save user. Make sure email is not duplicated.');
                          }
                        } finally {
                          setUserSubmitting(false);
                        }
                      }}
                      className="p-6 space-y-5"
                    >
                      {userFormError && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{userFormError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">First Name</label>
                          <input
                            type="text"
                            required
                            value={userFormFirstName}
                            onChange={e => setUserFormFirstName(e.target.value)}
                            className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Last Name</label>
                          <input
                            type="text"
                            required
                            value={userFormLastName}
                            onChange={e => setUserFormLastName(e.target.value)}
                            className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Email Address</label>
                        <input
                          type="email"
                          required
                          autoComplete="off"
                          value={userFormEmail}
                          onChange={e => setUserFormEmail(e.target.value)}
                          className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                          Password {editingUserId && <span className="text-neutral-600 normal-case tracking-normal ml-2">(Leave blank to keep unchanged)</span>}
                        </label>
                        <input
                          type="password"
                          required={!editingUserId}
                          autoComplete="new-password"
                          value={userFormPassword}
                          onChange={e => setUserFormPassword(e.target.value)}
                          className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Account Role</label>
                        <select
                          value={userFormRole}
                          onChange={e => setUserFormRole(Number(e.target.value))}
                          className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 appearance-none"
                        >
                          <option value={2}>Customer</option>
                          <option value={1}>Admin</option>
                        </select>
                      </div>

                      <div className="pt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowUserForm(false)}
                          className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={userSubmitting}
                          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          {userSubmitting ? 'Saving...' : 'Save User'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}
