export type Category = string; // dynamic — loaded from DB categories table


export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: Category;
  images: string[];
  description: string;
  features: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  isNew?: boolean;
  isBestSeller?: boolean;
  stock: number;
  gender?: string;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: { name: string; hex: string };
  quantity: number;
}

export interface OrderDetails {
  id: string;
  items: CartItem[];
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    mobileNumber?: string;
  };
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: 'card' | 'applepay' | 'googlepay';
  date: string;
  discountCode?: string;
  discountAmount?: number;
  status?: string;
}
