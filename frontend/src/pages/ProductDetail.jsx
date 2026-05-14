import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Share2, Minus, Plus, Store, MapPin, ShieldCheck, Cpu, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getProductById, getProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import ReviewSection from '../components/ReviewSection';
import useCartStore from '../store/cartStore';
import useWishlistStore from '../store/wishlistStore';
import useAuthStore from '../store/authStore';
import useCurrencyStore from '../store/currencyStore';
import { toast } from 'react-toastify';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  const { addItem } = useCartStore();
  const { addProduct, removeProduct, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  const { getProductPrice, convertPrice, formatPrice, exchangeRate, currency } = useCurrencyStore();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await getProductById(id);
        setProduct(res.data);
        setSelectedImage(0);
        setQuantity(1);
        if (res.data.categoryId?._id) {
          const relRes = await getProducts({ category: res.data.categoryId._id, limit: 4 });
          setRelated(relRes.data.products.filter((p) => p._id !== id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const inStock = product?.stock > 0;

  const handleAddToCart = async () => {
    if (!inStock) {
      toast.error('Product is out of stock');
      return;
    }
    try {
      await addItem(product, quantity);
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error('Failed to add to cart');
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.info('Sign in to use wishlist');
      return;
    }
    try {
      if (isInWishlist(product._id)) {
        await removeProduct(product._id);
        toast.info('Removed from wishlist');
      } else {
        await addProduct(product._id);
        toast.success('Added to wishlist!');
      }
    } catch (err) {
      toast.error('Wishlist error');
    }
  };

  const handleReviewsChanged = (stats) => {
    if (!stats || !product) return;
    setProduct((prev) => prev ? {
      ...prev,
      averageRating: stats.averageRating ?? prev.averageRating,
      totalReviews: stats.totalReviews ?? prev.totalReviews,
    } : prev);
  };

  if (loading) {
    return (
      <div className="base-container py-8">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-slate-100 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-10 bg-slate-200 rounded w-1/2" />
            <div className="h-32 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="base-container py-20 text-center">
        <p className="text-5xl mb-4">😢</p>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Device Not Found</h2>
        <Link to="/shop" className="text-blue-600 hover:underline">Back to Shop</Link>
      </div>
    );
  }

  const wishlisted = user && isInWishlist(product._id);

  return (
    <div className="base-container py-8 bg-slate-50 min-h-screen">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 flex-wrap font-medium">
        <Link to="/" className="hover:text-blue-600">Home</Link><span>/</span>
        <Link to="/shop" className="hover:text-blue-600">Devices</Link><span>/</span>
        {product.categoryId && (
          <><Link to={`/shop?category=${product.categoryId._id}`} className="hover:text-blue-600">{product.categoryId.name}</Link><span>/</span></>
        )}
        <span className="text-slate-900 truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
        {/* Gallery */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden mb-4 p-8 flex items-center justify-center shadow-sm relative aspect-square">
            <img 
              src={getImageUrl(product.productLink || product.images?.[selectedImage]) || 'https://via.placeholder.com/600'} 
              alt={product.name} 
              className="w-full h-full object-contain" 
              onError={(e) => handleImageError(e, 'Product')}
            />
            {product.discount > 0 && (
              <span className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md uppercase tracking-wider">
                -{product.discount}% OFF
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all p-2 bg-white flex-shrink-0 ${selectedImage === i ? 'border-blue-600 shadow-md ring-2 ring-blue-600/20' : 'border-slate-200 hover:border-blue-300'}`}>
                  <img 
                    src={getImageUrl(img)} 
                    alt="" 
                    className="w-full h-full object-contain" 
                    onError={(e) => handleImageError(e, 'Product')}
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Product Info */}
        <motion.div className="lg:col-span-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="mb-4">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">{product.categoryId?.name || 'Device'}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-0 mb-3 tracking-tight">{product.name}</h1>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                <Star size={16} className="fill-amber-500 text-amber-500" />
                <span className="text-sm font-bold text-amber-700">{product.averageRating || '4.8'}</span>
              </div>
              <span className="text-sm font-medium text-slate-500 underline decoration-slate-300 hover:text-blue-600 cursor-pointer">({product.totalReviews} verified reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-6 pb-6 border-b border-slate-100">
              <div className="flex items-end gap-4">
                <span className="text-4xl font-extrabold text-slate-900">{getProductPrice(product)}</span>
                {product.mrp > product.price && (
                  <div className="flex flex-col">
                    <span className="text-lg text-slate-400 line-through font-medium">
                      {currency === 'USD' ? `$${(product.mrp / exchangeRate).toFixed(2)}` : `Rs. ${product.mrp.toFixed(2)}`}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm font-medium mt-3 mb-0 flex items-center gap-2">
                {inStock ? (
                  <span className="text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full"><CheckCircle size={14} /> In Stock ({product.stock} units available)</span>
                ) : (
                  <span className="text-rose-500 flex items-center gap-1.5 bg-rose-50 px-3 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Out of Stock</span>
                )}
              </p>
            </div>

            {/* Key Specs */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0"><ShieldCheck size={20} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium m-0">Warranty</p>
                  <p className="text-sm font-bold text-slate-900 m-0">1 Year Official</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0"><Cpu size={20} /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium m-0">Condition</p>
                  <p className="text-sm font-bold text-slate-900 m-0">Brand New Sealed</p>
                </div>
              </div>
            </div>

            <div className="mt-auto">
              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-bold text-slate-900">Quantity</span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-12 h-12 flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-600"><Minus size={18} /></button>
                  <span className="w-12 h-12 flex items-center justify-center font-bold text-slate-900 text-base">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} disabled={!inStock} className="w-12 h-12 flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-600 disabled:opacity-50"><Plus size={18} /></button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button onClick={handleAddToCart} disabled={!inStock} className={`flex-1 font-bold py-4 px-8 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 text-lg ${inStock ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 hover:shadow-blue-600/40 hover:-translate-y-0.5' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}>
                  <ShoppingCart size={22} /> Add to Cart
                </button>
                <div className="flex gap-4">
                  <button onClick={handleToggleWishlist}
                    className={`w-16 h-16 sm:w-14 sm:h-14 border-2 rounded-2xl flex items-center justify-center transition-all ${wishlisted ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-inner' : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-500 hover:text-slate-700'}`}>
                    <Heart size={24} className={wishlisted ? 'fill-rose-500' : ''} />
                  </button>
                  <button className="w-16 h-16 sm:w-14 sm:h-14 border-2 border-slate-200 rounded-2xl flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 text-slate-500 hover:text-slate-700 transition-all">
                    <Share2 size={24} />
                  </button>
                </div>
              </div>

              {/* Store Info */}
              {product.storeId && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center"><Store size={20} className="text-blue-600" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium m-0 mb-0.5">Sold by</p>
                    <Link to={`/store/${product.storeId._id}`} className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-sm block">{product.storeId.name}</Link>
                  </div>
                  {product.storeId.city && <div className="text-right"><p className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md inline-flex items-center gap-1.5"><MapPin size={12} className="text-blue-500"/> {product.storeId.city}</p></div>}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mb-16">
        <div className="flex overflow-x-auto border-b border-slate-200 mb-8 gap-8 px-4 scrollbar-hide">
          {['description', 'specifications', 'reviews'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`py-4 text-base font-bold capitalize transition-all border-b-4 whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              {tab === 'reviews' ? `Customer Reviews (${product.totalReviews})` : tab}
            </button>
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-8 lg:p-10 shadow-sm min-h-[300px]">
          {activeTab === 'description' && (
            <div className="prose prose-slate max-w-none">
              <h3 className="text-xl font-bold text-slate-900 mb-4 mt-0">Product Overview</h3>
              <p className="text-slate-700 leading-relaxed text-base whitespace-pre-line">{product.description}</p>
            </div>
          )}
          {activeTab === 'reviews' && <ReviewSection productId={product._id} onReviewsChanged={handleReviewsChanged} />}
          {activeTab === 'specifications' && (
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-6 mt-0">Technical Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {[
                  { label: 'Brand/Model', value: product.name },
                  { label: 'Category', value: product.categoryId?.name || 'Smart Device' },
                  { label: 'SKU / Barcode', value: product.barcode || product.sku || 'N/A' },
                  { label: 'Unit Type', value: product.unit },
                  { label: 'Stock Status', value: inStock ? 'Available' : 'Out of Stock' },
                  { label: 'Seller', value: product.storeId?.name || 'Mobile Hub Direct' },
                ].map((d) => (
                  <div key={d.label} className="flex py-3 border-b border-slate-100 last:border-0">
                    <span className="w-1/3 text-slate-500 font-medium">{d.label}</span>
                    <span className="w-2/3 font-semibold text-slate-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="pt-8 border-t border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 m-0">You Might Also Like</h2>
            <Link to="/shop" className="text-blue-600 font-bold hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {related.slice(0, 4).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
