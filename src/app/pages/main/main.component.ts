import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Product } from '../../models/products.model';

interface CartItem extends Product {
  quantity: number;
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main.component.html'
})
export class MainComponent {
  showCart = signal<boolean>(false);
  cartItems = signal<CartItem[]>([]);
  selectedCategory = signal<string>('all');
  isLoggedIn = signal<boolean>(false);
  showUserMenu = signal<boolean>(false);
  currentUser = signal<any>({
    name: 'Usuario Ejemplo',
    email: 'usuario@ejemplo.com'
  });

  categories = ['Bebidas', 'Snacks', 'Dulces', 'Comida Rápida'];

  products = signal<any[]>([
    {
      id: 1,
      name: 'Hamburguesa Clásica',
      price: 150,
      image: 'assets/images/burger.jpg',
      description: 'Deliciosa hamburguesa con queso y vegetales frescos',
      category: 'Comida Rápida',
      points: 15,
      quantity: 50
    },
    {
      id: 2,
      name: 'Refresco Cola',
      price: 25,
      image: 'assets/images/cola.jpg',
      description: 'Bebida refrescante de cola',
      category: 'Bebidas',
      points: 5,
      quantity: 100
    },
    {
      id: 3,
      name: 'Papas Fritas',
      price: 45,
      image: 'assets/images/fries.jpg',
      description: 'Crujientes papas fritas',
      category: 'Snacks',
      points: 8,
      quantity: 75
    }
  ]);

  constructor(private router: Router) {
    this.checkAuthStatus();
  }

  checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
      this.isLoggedIn.set(true);
      // Here you would typically fetch user data from your backend
      // and update the currentUser signal
    }
  }

  filteredProducts() {
    return this.products().filter(product => 
      this.selectedCategory() === 'all' || product.category === this.selectedCategory()
    );
  }

  toggleCart() {
    this.showCart.update(value => !value);
  }

  toggleUserMenu() {
    this.showUserMenu.update(value => !value);
  }

  filterByCategory(category: string) {
    this.selectedCategory.set(category);
  }

  addToCart(product: Product) {
    this.cartItems.update((items:any) => {
      const existingItem = items.find(item => item.id === product.id);
      if (existingItem) {
        return items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...items, { ...product, quantity: 1 }];
    });
  }

  updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) {
      this.removeFromCart(item);
      return;
    }
    
    this.cartItems.update((items: any) =>
      items.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      )
    );
  }

  removeFromCart(item: CartItem) {
    this.cartItems.update(items => 
      items.filter(cartItem => cartItem.id !== item.id)
    );
  }

  calculateTotal(): number {
    return this.cartItems().reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );
  }

  // ... existing code ...

calculateTotalPoints(): number {
  return this.cartItems().reduce((sum, item) => sum + (item.points * item.quantity), 0);
}

// ... rest of the code ...

  login() {
    this.router.navigate(['/login']);
  }

  logout() {
    localStorage.removeItem('token');
    this.isLoggedIn.set(false);
    this.showUserMenu.set(false);
    this.router.navigate(['/login']);
  }

  proceedToCheckout() {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/checkout']);
  }
}