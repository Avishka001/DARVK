import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package, ChevronDown, ChevronUp, LogOut, ShoppingBag, Clock } from 'lucide-react';
import { useUser } from '../context/UserContext';
import * as api from '../api';
import { useCurrency } from '../context/CurrencyContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { currentUser, logoutUser } = useUser();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setLoading(true);
      api.getUserOrders()
        .then(data => {
          setOrders(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, currentUser]);

  const handleLogout = () => {
    logoutUser();
    onClose();
  };

  const statusColors: Record<string, string> = {
    processing: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    shipped:    'text-blue-400 bg-blue-400/10 border-blue-400/30',
    delivered:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    cancelled:  'text-red-400 bg-red-400/10 border-red-400/30',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
          />
          <div className="fixed inset-0 z-[201] flex items-center justify-center px-4 py-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-sm font-black tracking-widest uppercase text-white">My Account</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {currentUser?.firstName} {currentUser?.lastName} &bull; {currentUser?.email}
                  </p>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Orders Section */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="flex items-center space-x-2 mb-4">
                  <Package className="w-4 h-4 text-neutral-400" />
                  <h3 className="text-xs font-bold tracking-widest uppercase text-neutral-400">Order History</h3>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ShoppingBag className="w-10 h-10 text-white/10 mb-3" />
                    <p className="text-sm text-neutral-500">No orders yet</p>
                    <p className="text-xs text-neutral-600 mt-1">Your purchases will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order: any) => (
                      <div key={order.id} className="border border-white/8 rounded-lg overflow-hidden">
                        {/* Order Header */}
                        <button
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/3 transition-colors text-left"
                        >
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="text-xs font-bold text-white font-mono">{order.id}</p>
                              <div className="flex items-center space-x-1.5 mt-0.5">
                                <Clock className="w-3 h-3 text-neutral-600" />
                                <p className="text-[10px] text-neutral-500">
                                  {new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${statusColors[order.status] || statusColors.processing}`}>
                              {order.status}
                            </span>
                            <span className="text-sm font-black text-white">{formatPrice(order.total)}</span>
                            {expandedOrder === order.id
                              ? <ChevronUp className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                              : <ChevronDown className="w-4 h-4 text-neutral-500 flex-shrink-0" />}
                          </div>
                        </button>

                        {/* Order Items */}
                        <AnimatePresence>
                          {expandedOrder === order.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-white/8 overflow-hidden"
                            >
                              <div className="px-4 py-3 space-y-3">
                                {order.items?.map((item: any, idx: number) => {
                                  const images = item.product?.images || [];
                                  const img = images[0] || null;
                                  return (
                                    <div key={idx} className="flex items-center space-x-3">
                                      {img ? (
                                        <img src={img} alt={item.product?.name} className="w-12 h-12 object-cover rounded-lg bg-white/5 flex-shrink-0" />
                                      ) : (
                                        <div className="w-12 h-12 rounded-lg bg-white/5 flex-shrink-0" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{item.product?.name || 'Product'}</p>
                                        <p className="text-[10px] text-neutral-500">
                                          {item.selectedSize} &bull; {item.selectedColor?.name} &bull; Qty: {item.quantity}
                                        </p>
                                      </div>
                                      <p className="text-xs font-bold text-white flex-shrink-0">{formatPrice(item.product?.price * item.quantity)}</p>
                                    </div>
                                  );
                                })}

                                <div className="border-t border-white/8 pt-2 mt-2 flex justify-between text-xs">
                                  <span className="text-neutral-500">Total</span>
                                  <span className="font-black text-white">{formatPrice(order.total)}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 pt-3 border-t border-white/10 flex-shrink-0">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 border border-white/10 hover:border-red-500/50 hover:text-red-400 text-neutral-400 text-xs font-bold tracking-widest uppercase rounded-lg transition-all flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
