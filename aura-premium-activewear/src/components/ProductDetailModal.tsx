import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ShoppingBag, ShieldCheck, HelpCircle, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    size: string,
    color: { name: string; hex: string },
    quantity: number
  ) => void;
}

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const { formatPrice } = useCurrency();
  
  // Image Zoom State
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  // Initialize selected values when product loads
  React.useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || '');
      setSelectedColor(product.colors[0] || null);
      setQuantity(1);
      setActiveImageIdx(0);
      setIsAddedFeedback(false);
    }
  }, [product]);

  if (!product) return null;

  const handleAddToCart = () => {
    if (!selectedColor) return;
    onAddToCart(product, selectedSize, selectedColor, quantity);
    setIsAddedFeedback(true);
    setTimeout(() => {
      setIsAddedFeedback(false);
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-md"
        />

        {/* Modal Sheet Workspace */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative bg-[#0c0c0c] border border-white/5 w-full max-w-5xl rounded-sm overflow-hidden z-10 shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-y-auto md:overflow-y-visible"
        >
          {/* Close Icon button */}
          <button
            id="close-detail-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md text-white/60 hover:text-white p-2 rounded-sm border border-white/5 hover:border-white/20 transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Panel: Media Showcase */}
          <div className="w-full md:w-1/2 bg-[#050505] p-4 sm:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5">
            <div 
              className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-900 cursor-crosshair"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => {
                setIsZoomed(false);
                setMousePos({ x: 50, y: 50 });
              }}
              onMouseMove={handleMouseMove}
            >
              <img
                src={product.images[activeImageIdx]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 ease-out"
                style={{
                  transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                  transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                }}
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-sm text-[10px] font-mono tracking-widest text-neutral-400 border border-white/10">
                ZOOM DETAILED VIEW
              </span>
            </div>

            {/* Thumbnail Navigation Row */}
            {product.images.length > 1 && (
              <div className="flex space-x-3 mt-4 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    id={`image-thumb-${idx}`}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-16 h-16 rounded-md overflow-hidden bg-neutral-900 border ${activeImageIdx === idx ? 'border-red-600 scale-105' : 'border-white/10 opacity-60 hover:opacity-100'
                      } transition-all`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} perspective ${idx}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel: Specifications Workspace */}
          <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* Category Breadcrumb */}
              <div className="flex items-center space-x-2 text-[10px] font-bold tracking-[0.2em] text-red-500 uppercase mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AURA HIGH TECH LAB • {product.gender && product.gender !== 'unisex' ? `${product.gender}'s ` : ''}{product.category}</span>
              </div>

              {/* Title & Price Row */}
              <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-white mb-2 leading-tight">
                {product.name}
              </h1>

              <div className="flex items-baseline space-x-3 mb-6">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-neutral-400 line-through font-mono">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                <span className="text-[10px] bg-red-600/10 border border-red-500/20 text-red-500 font-bold tracking-widest px-2.5 py-0.5 uppercase rounded-sm ml-2">
                  SHIPPING GUARANTEED
                </span>
              </div>

              {/* Short Bio description */}
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed tracking-wide mb-6">
                {product.description}
              </p>

              {/* Color Selection Matrix */}
              {product.colors.length > 0 && (
                <div className="mb-6">
                  <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase block mb-2.5">
                    SELECT COLOR: <span className="text-white">{selectedColor?.name}</span>
                  </span>
                  <div className="flex items-center space-x-3">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        id={`detail-color-${color.name}`}
                        onClick={() => setSelectedColor(color)}
                        style={{ backgroundColor: color.hex }}
                        className={`w-8 h-8 rounded-full border-2 focus:outline-none transition-all ${selectedColor?.name === color.name
                            ? 'border-red-600 scale-110 ring-2 ring-red-600/20 shadow-lg'
                            : 'border-transparent hover:scale-105'
                          }`}
                        title={color.name}
                      >
                        {selectedColor?.name === color.name && (
                          <Check className="w-4 h-4 text-white mx-auto drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector Matrix */}
              {product.sizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                      SELECT FIT / SIZE
                    </span>
                    <button
                      className="text-[10px] text-red-500 font-bold hover:underline tracking-widest flex items-center space-x-1"
                      onClick={() => alert('Sizing chart: Standard athletic athletic compress-fit. If you prefer a loose relaxed streetwear fit, go 1 size up.')}
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>FITMENT MATRIX</span>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        id={`detail-size-${size}`}
                        onClick={() => setSelectedSize(size)}
                        className={`font-mono text-xs font-bold px-4 py-3 border transition-all rounded-sm ${selectedSize === size
                            ? 'bg-white border-white text-black font-extrabold'
                            : 'bg-[#050505] border-white/5 text-white hover:border-white/30'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector Option */}
              <div className="mb-6">
                <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase block mb-2.5 font-mono">
                  QUANTITY
                </span>
                <div className="flex items-center space-x-2 w-32 bg-[#050505] border border-white/5 rounded-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={product.stock === 0}
                    className="flex-1 py-2 text-center hover:bg-white/5 text-white/60 hover:text-white transition-colors disabled:opacity-20 disabled:pointer-events-none"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono text-xs font-bold">{product.stock === 0 ? 0 : quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={product.stock === 0 || quantity >= product.stock}
                    className="flex-1 py-2 text-center hover:bg-white/5 text-white/60 hover:text-white transition-colors disabled:opacity-20 disabled:pointer-events-none"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="border-t border-white/5 pt-6 mt-6">
              <button
                id="add-to-cart-action-btn"
                onClick={handleAddToCart}
                disabled={isAddedFeedback || product.stock === 0}
                className={`w-full py-4 font-black tracking-[0.2em] text-xs flex items-center justify-center space-x-2 transition-all uppercase rounded-sm shadow-xl ${product.stock === 0
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                    : isAddedFeedback
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white hover:scale-[1.01]'
                  }`}
              >
                {product.stock === 0 ? (
                  <span>OUT OF STOCK</span>
                ) : isAddedFeedback ? (
                  <>
                    <Check className="w-4 h-4 animate-bounce" />
                    <span>SUCCESSFULLY ADDED!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>ADD TO TRAINING GEAR BAG</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-4 mt-4 text-[10px] text-neutral-400 font-mono tracking-wider">
                <div className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>SECURE GATEWAY</span>
                </div>
                <span>•</span>
                <span>AUTHENTIC BRAND GEAR</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
