import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../../models/user.model';
import { CartItem } from '../../../models/products.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  isLoading = signal<boolean>(false);
  cartItems = signal<CartItem[]>([]);
  currentUser = signal<User | null>(null);

  checkoutForm = signal<FormGroup>(this.fb.group({
    customerName: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    address: ['', Validators.required],
    paymentMethod: ['cash', Validators.required],
    usePoints: [false]
  }));

  totalAmount = computed(() => 
    this.cartItems().reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );

  totalPoints = computed(() => 
    this.cartItems().reduce((sum, item) => sum + (item.points * item.quantity), 0)
  );

  constructor() {
    this.loadUserData();
    this.loadCartItems();
  }

  loadUserData() {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user: User = JSON.parse(userData);
      this.currentUser.set(user);
      this.checkoutForm().patchValue({
        customerName: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address
      });
    }
  }

  loadCartItems() {
    const cartData = localStorage.getItem('cartItems');
    if (cartData) {
      this.cartItems.set(JSON.parse(cartData));
    }
  }

  completeCheckout() {
    if (this.checkoutForm().valid) {
      this.isLoading.set(true);
      
      const orderData = {
        ...this.checkoutForm().value,
        items: this.cartItems(),
        total: this.totalAmount(),
        points: this.totalPoints(),
        userId: this.currentUser()?.uid,
        createdAt: new Date(),
        status: 'pending'
      };

      // Here you would send the order to your backend
      console.log('Order Data:', orderData);

      setTimeout(() => {
        // Clear cart after successful order
        localStorage.removeItem('cartItems');
        this.isLoading.set(false);
        this.router.navigate(['/dashboard/orders']);
      }, 1500);
    }
  }

  goBack() {
    this.router.navigate(['/main']);
  }
}