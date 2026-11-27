import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowUpDown, Flame, TrendingUp, Info } from 'lucide-react';
import { Product, Category } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface ProductGridProps {
  products: Product[];
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
  onProductClick: (product: Product) => void;
  onQuickAdd: (product: Product, size: string, color: { name: string; hex: string }) => void;
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'bestsellers';

export default function ProductGrid({
  products,
  selectedCategory,
  onSelectCategory,
  onProductClick,
  onQuickAdd,
}: ProductGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const { formatPrice } = useCurrency();

  // Categories list
  const categoryTabs: { label: string; value: Category }[] = [
    { label: 'ALL GEAR', value: 'all' },
    { label: 'TOPS', value: 'tops' },
    { label: 'BOTTOMS', value: 'bottoms' },
    { label: 'OUTERWEAR', value: 'outerwear' },
    { label: 'ACCESSORIES', value: 'accessories' },
  ];

  // Filtering based on active category
  const filteredProducts = products.filter(
    (p) => selectedCategory === 'all' || p.category === selectedCategory
  );

  // Sorting products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'bestsellers') return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
    return 0; // default
  });

  return (
    <section id="collection-grid-section" className="py-16 sm:py-20 md:py-24 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-[#050505] text-white">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 border-b border-white/5 pb-6 sm:pb-8">
        <div>
          <span className="text-red-500 text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase block mb-2 font-mono">
            ATHLETIC ARCHITECTURE
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black italic tracking-wider uppercase font-display">
            THE CURRENT DROP
          </h2>
        </div>

        {/* Sorting Dropdown Matrix */}
        <div className="mt-4 md:mt-0 flex items-center space-x-2 sm:space-x-3">
          <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40" />
          <select
            id="sort-select-menu"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-[#0c0c0c] border border-white/5 text-white text-[9px] sm:text-[10px] py-2 sm:py-2.5 px-3 sm:px-4 rounded-sm focus:outline-none focus:border-red-600 tracking-[0.1em] font-bold uppercase font-mono"
          >
            <option value="default">SORT: RECOMMENDATIONS</option>
            <option value="price-asc">SORT: PRICE LOW TO HIGH</option>
            <option value="price-desc">SORT: PRICE HIGH TO LOW</option>
            <option value="bestsellers">SORT: BESTSELLERS FIRST</option>
          </select>
        </div>
      </div>

      {/* Category Navigation (Horizontal Slide) */}
      <div className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-4 sm:pb-6 scrollbar-hide mb-8 sm:mb-10">
        {categoryTabs.map((tab) => (
          <button
            key={tab.value}
            id={`grid-tab-${tab.value}`}
            onClick={() => onSelectCategory(tab.value)}
            className={`whitespace-nowrap px-4 sm:px-6 py-2 sm:py-3 rounded-sm text-[10px] sm:text-xs font-black tracking-[0.15em] uppercase transition-all duration-300 flex items-center space-x-1.5 sm:space-x-2 border ${
              selectedCategory === tab.value
                ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/25'
                : 'bg-[#0c0c0c] border-white/5 text-zinc-400 hover:text-white hover:border-white/20'
            }`}
          >
            {tab.value === 'all' && <Flame className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-20 bg-[#0c0c0c] rounded-sm border border-white/5">
          <Info className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 tracking-[0.2em] uppercase text-xs font-bold">
            No gear fits the current criteria.
          </p>
          <button
            onClick={() => onSelectCategory('all')}
            className="mt-4 bg-white text-black text-xs font-bold px-6 py-3 rounded-sm tracking-widest uppercase hover:bg-neutral-200 transition-all cursor-pointer"
          >
            RESET COLLECTION
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <AnimatePresence mode="popLayout">
            {sortedProducts.map((product) => (
              <motion.div
                key={product.id}
                id={`product-card-${product.id}`}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="group relative bg-[#0c0c0c] border border-white/5 overflow-hidden flex flex-col justify-between rounded-sm hover:border-white/10 transition-colors"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                {/* Visual Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  {product.stock === 0 ? (
                    <span className="bg-zinc-800 text-zinc-400 border border-white/10 text-[10px] font-black tracking-widest px-3 py-1 uppercase rounded-sm shadow-md">
                      OUT OF STOCK
                    </span>
                  ) : (
                    <>
                      {product.isNew && (
                        <span className="bg-red-600 text-white text-[10px] font-black tracking-widest px-3 py-1 uppercase rounded-sm flex items-center space-x-1 shadow-md">
                          <Sparkles className="w-3 h-3 text-white" />
                          <span>NEW</span>
                        </span>
                      )}
                      {product.isBestSeller && (
                        <span className="bg-amber-500 text-black text-[10px] font-black tracking-widest px-3 py-1 uppercase rounded-sm flex items-center space-x-1 shadow-md">
                          <TrendingUp className="w-3 h-3 text-black" />
                          <span>BEST SELLER</span>
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Main Product Image Workspace */}
                <div
                  className="relative aspect-square overflow-hidden bg-neutral-950 cursor-pointer"
                  onClick={() => onProductClick(product)}
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                      product.stock === 0 ? 'grayscale opacity-40' : ''
                    }`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle hover vignette overlay */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

                  {/* Size quick add overlays on hover */}
                  <AnimatePresence>
                    {hoveredProduct === product.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-4 inset-x-4 bg-[#0c0c0c]/95 backdrop-blur-md border border-white/5 p-3 rounded-sm flex flex-col items-center justify-center z-10"
                      >
                        {product.stock === 0 ? (
                          <span className="text-red-500 font-extrabold tracking-[0.2em] text-xs uppercase font-mono py-2">
                            OUT OF STOCK
                          </span>
                        ) : (
                          <>
                            <span className="text-[9px] font-bold tracking-[0.2em] text-zinc-400 mb-2 uppercase font-mono">
                              QUICK SELECT SIZE
                            </span>
                            <div className="flex gap-1.5 flex-wrap justify-center">
                              {product.sizes.map((size) => (
                                <button
                                  key={size}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onQuickAdd(product, size, product.colors[0]);
                                  }}
                                  className="bg-[#050505] hover:bg-white hover:text-black text-white font-mono font-bold text-xs w-9 h-9 flex items-center justify-center transition-all border border-white/5 hover:border-white rounded-sm"
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Product Metadata Footer */}
                <div className="p-5 flex flex-col flex-grow justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1 text-[10px] font-mono tracking-widest text-neutral-400">
                      <span className="uppercase">{product.category}</span>
                      {product.stock === 0 ? (
                        <span className="text-red-500 font-bold tracking-widest uppercase">OUT OF STOCK</span>
                      ) : (
                        <span>IN STOCK ({product.stock})</span>
                      )}
                    </div>
                    <h3
                      onClick={() => onProductClick(product)}
                      className="text-sm font-bold tracking-wider hover:text-red-500 cursor-pointer transition-colors uppercase leading-tight line-clamp-1 mb-2"
                    >
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    {/* Color Swatches */}
                    <div className="flex items-center space-x-1.5">
                      {product.colors.map((c) => (
                        <span
                          key={c.name}
                          style={{ backgroundColor: c.hex }}
                          className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10 border border-neutral-900"
                          title={c.name}
                        />
                      ))}
                    </div>

                    {/* Price with Original Compare tag */}
                    <div className="flex items-center space-x-2">
                      {product.originalPrice && (
                        <span className="text-xs text-white/40 line-through font-mono">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                      <span className="text-sm font-black text-white font-mono">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
