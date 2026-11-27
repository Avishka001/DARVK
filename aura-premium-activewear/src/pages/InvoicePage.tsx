import React, { useEffect, useState } from 'react';
import * as api from '../api';
import { OrderDetails } from '../types';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface InvoicePageProps {
  orderId: string;
}

const InvoicePage: React.FC<InvoicePageProps> = ({ orderId }) => {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    api.getOrder(orderId)
      .then(data => setOrder(data))
      .catch(err => setError(err.message || 'Invoice not found'))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center pt-24">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center pt-24">
        <FileText className="w-16 h-16 text-neutral-600 mb-6" />
        <h1 className="text-2xl font-black uppercase tracking-widest mb-4 text-center">Invoice Not Found</h1>
        <p className="text-neutral-400 max-w-md text-center mb-8">{error}</p>
        <a href="/" className="text-red-500 hover:text-white transition-colors uppercase tracking-widest font-bold flex items-center space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-widest text-white">Official Receipt</h1>
              <p className="text-white/80 font-semibold tracking-wider text-sm mt-1">Thank you for your purchase</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-white/80 text-xs tracking-widest uppercase mb-1">Order Number</p>
            <p className="text-white font-black text-lg tracking-wider">{order.id}</p>
            <p className="text-white/80 text-xs tracking-widest mt-1">{new Date(order.date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            {/* Customer Info */}
            <div>
              <h3 className="text-xs font-bold tracking-widest text-neutral-500 uppercase mb-4">Billed To</h3>
              <p className="font-bold text-white mb-1">{order.customerInfo.firstName} {order.customerInfo.lastName}</p>
              <p className="text-neutral-400 text-sm mb-1">{order.customerInfo.email}</p>
              {order.customerInfo.mobileNumber && (
                <p className="text-neutral-400 text-sm mb-1">{order.customerInfo.mobileNumber}</p>
              )}
              <p className="text-neutral-400 text-sm mt-2">{order.customerInfo.address}</p>
              <p className="text-neutral-400 text-sm">{order.customerInfo.city}, {order.customerInfo.postalCode}</p>
              <p className="text-neutral-400 text-sm">{order.customerInfo.country}</p>
            </div>

            {/* Payment Info */}
            <div>
              <h3 className="text-xs font-bold tracking-widest text-neutral-500 uppercase mb-4">Payment Method</h3>
              <p className="text-white capitalize font-semibold tracking-wider">
                {order.paymentMethod === 'card' ? 'Credit / Debit Card' : order.paymentMethod}
              </p>
              <p className="text-neutral-400 text-sm mt-1 capitalize">{order.status} Status</p>
            </div>
          </div>

          {/* Items */}
          <div className="border-t border-white/10 pt-8 mb-8">
            <h3 className="text-xs font-bold tracking-widest text-neutral-500 uppercase mb-6">Order Summary</h3>
            <div className="space-y-6">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center group">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                      <p className="text-white font-bold tracking-wider">{item.product.name}</p>
                      <p className="text-neutral-400 text-xs mt-1 uppercase tracking-wider">Size: {item.selectedSize} | Color: {item.selectedColor.name} | Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-white font-black">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-white/10 pt-8 flex justify-end">
            <div className="w-full sm:w-1/2 md:w-1/3 space-y-3 text-sm">
              <div className="flex justify-between text-neutral-400 font-semibold tracking-wider">
                <span>Subtotal</span>
                <span className="text-white">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountAmount ? (
                <div className="flex justify-between text-green-500 font-semibold tracking-wider">
                  <span>Discount ({order.discountCode})</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-neutral-400 font-semibold tracking-wider">
                <span>Shipping</span>
                <span className="text-white">{order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between text-white font-black text-xl pt-4 border-t border-white/10 mt-4">
                <span>TOTAL</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-neutral-950 p-6 border-t border-white/10 flex items-center justify-between">
           <a href="/" className="text-neutral-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </a>
          <button onClick={() => window.print()} className="text-red-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
