import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent {
  checkoutForm: FormGroup;
  isLoading = signal<boolean>(false);

  constructor(private fb: FormBuilder, private router: Router) {
    this.checkoutForm = this.fb.group({
      customerName: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      paymentMethod: ['cash', Validators.required],
      points: [false]
    });
  }

  completeCheckout() {
    if (this.checkoutForm.valid) {
      this.isLoading.set(true);
      // Here you would typically process the payment and create the order
      setTimeout(() => {
        console.log('Order completed:', {
          ...this.checkoutForm.value,
          // Add cart items and totals
        });
        this.isLoading.set(false);
        this.router.navigate(['/dashboard/orders']);
      }, 1500);
    }
  }
}