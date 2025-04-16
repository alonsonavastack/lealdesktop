import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Product } from '../../models/products.model';
import { User } from '../../models/user.model';
import { FirebaseService } from '../../services/firebase.service';
import { Category } from '../../models/category.model';

interface CartItem extends Product {
  quantity: number;
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main.component.html'
})
export class MainComponent implements OnInit {
  private firebaseSvc = inject(FirebaseService);
  private router = inject(Router);

  showCart = signal<boolean>(false);
  cartItems = signal<CartItem[]>([]);
  selectedCategory = signal<string>('all');
  isLoggedIn = signal<boolean>(false);
  showUserMenu = signal<boolean>(false);
  currentUser = signal<User | null>(null);
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);

  constructor() {
    this.checkAuthStatus();
  }

  async ngOnInit() {
    await this.loadCategories();
    await this.loadProducts();
  }

  checkAuthStatus() {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.isLoggedIn.set(true);
      this.currentUser.set(JSON.parse(userData));
    }
  }

  async loadCategories() {
    try {
      const data = await this.firebaseSvc.getCollectionData('categories');
      this.categories.set(data as Category[]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async loadProducts() {
    try {
      const data = await this.firebaseSvc.getCollectionData('products');
      this.products.set(data as Product[]);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  filteredProducts() {
    return this.products().filter(product => 
      this.selectedCategory() === 'all' || product.category === this.selectedCategory()
    );
  }

  filterByCategory(category: string) {
    this.selectedCategory.set(category);
  }

  toggleCart() {
    this.showCart.update(value => !value);
  }

  toggleUserMenu() {
    this.showUserMenu.update(value => !value);
  }

  addToCart(product: Product) {
    if (product.quantity <= 0) return;

    this.cartItems.update((items: any) => {
      const existingItem = items.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.quantity) {
          return items; // Don't add more if exceeding available stock
        }
        return items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...items, { ...product, quantity: 1 }];
    });

    // Update product quantity in products signal
    this.products.update((products: any) =>
      products.map(p =>
        p.id === product.id
          ? { ...p, quantity: p.quantity - 1 }
          : p
      )
    );
  }

  updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    const product = this.products().find(p => p.id === item.id);
    
    if (!product) return;

    if (newQuantity < 1) {
      this.removeFromCart(item);
      return;
    }

    if (change > 0 && product.quantity <= 0) {
      return; // Can't increase if no stock available
    }

    this.cartItems.update((items: any) =>
      items.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      )
    );

    // Update product quantity in products signal
    this.products.update((products: any) =>
      products.map(p =>
        p.id === item.id
          ? { ...p, quantity: p.quantity - change }
          : p
      )
    );
  }

  removeFromCart(item: CartItem) {
    this.cartItems.update(items => 
      items.filter(cartItem => cartItem.id !== item.id)
    );

    // Restore product quantity in products signal
    this.products.update((products: any) =>
      products.map(p =>
        p.id === item.id
          ? { ...p, quantity: p.quantity + item.quantity }
          : p
      )
    );
  }

  calculateTotal(): number {
    return this.cartItems().reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );
  }

  calculateTotalPoints(): number {
    return this.cartItems().reduce(
      (sum, item) => sum + (item.points * item.quantity), 
      0
    );
  }

  goToProfile() {
    this.router.navigate(['/profile']);
    this.showUserMenu.set(false);
  }

  login() {
    this.router.navigate(['/login']);
  }

  logout() {
    localStorage.removeItem('user');
    this.isLoggedIn.set(false);
    this.showUserMenu.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/auth']);
  }

  proceedToCheckout() {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }
    this.router.navigate(['/checkout']);
  }
}