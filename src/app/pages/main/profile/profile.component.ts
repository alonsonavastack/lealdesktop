import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface User {
  name: string;
  email: string;
  profileImage: string;
  joinDate: Date;
  totalPoints: number;
  availablePoints: number;
  level: number;
  pointsProgress: number;
  pointsToNextLevel: number;
  totalPurchases: number;
  redeemedPoints: number;
  totalSavings: number;
}

interface Purchase {
  id: number;
  date: Date;
  orderNumber: string;
  total: number;
  pointsEarned: number;
  status: 'completed' | 'pending' | 'cancelled';
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent {
  router = inject(Router);
  searchTerm = '';
  filterPeriod = 'all';

  user: User = {
    name: 'John Doe',
    email: 'john@example.com',
    profileImage: '',
    joinDate: new Date('2023-01-01'),
    totalPoints: 1250,
    availablePoints: 750,
    level: 2,
    pointsProgress: 65,
    pointsToNextLevel: 250,
    totalPurchases: 15,
    redeemedPoints: 500,
    totalSavings: 125.50
  };

  currentLevelBenefits = [
    'Descuento del 10% en todas las compras',
    'Puntos dobles los fines de semana',
    'Acceso anticipado a promociones',
    'Envío gratis en pedidos mayores a $500'
  ];

  purchases = signal<Purchase[]>([
    {
      id: 1,
      date: new Date('2024-01-15'),
      orderNumber: 'ORD-001',
      total: 150.00,
      pointsEarned: 15,
      status: 'completed'
    },
    {
      id: 2,
      date: new Date('2025-01-20'),
      orderNumber: 'ORD-002',
      total: 85.50,
      pointsEarned: 8,
      status: 'completed'
    },
    {
      id: 3,
      date: new Date('2024-02-01'),
      orderNumber: 'ORD-003',
      total: 200.00,
      pointsEarned: 20,
      status: 'pending'
    }
  ]);

  filteredPurchases() {
    let filtered = this.purchases();

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(purchase => 
        purchase.orderNumber.toLowerCase().includes(term) ||
        purchase.total.toString().includes(term)
      );
    }

    // Apply period filter
    const today = new Date();
    switch (this.filterPeriod) {
      case 'month':
        filtered = filtered.filter(purchase => 
          purchase.date.getMonth() === today.getMonth() &&
          purchase.date.getFullYear() === today.getFullYear()
        );
        break;
      case 'year':
        filtered = filtered.filter(purchase => 
          purchase.date.getFullYear() === today.getFullYear()
        );
        break;
    }

    return filtered;
  }

  getStatusClass(status: string): string {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return baseClasses;
    }
  }

  viewPurchaseDetails(purchase: Purchase) {
    console.log('Viewing details for purchase:', purchase);
    // Implement purchase details view logic
  }

  updateProfile() {
    console.log('Updating profile...');
    // Implement profile update logic
  }

  uploadProfileImage(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Implement image upload logic
      console.log('Uploading profile image:', file);
    }
  }

  navigateToEdit() {
    this.router.navigate(['/profile/edit']);
  }

  navigateToMain() {
    this.router.navigate(['/main']);
  }
}