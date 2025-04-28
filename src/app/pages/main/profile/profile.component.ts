import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../../services/firebase.service';
import { HotToastService } from '@ngxpert/hot-toast';
import { signal } from '@angular/core';

interface User {
  name: string;
  email: string;
  img: string;
  qrCode: string;  // Agregamos el campo qrCode
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
export class ProfileComponent implements OnInit {
  private firebaseSvc = inject(FirebaseService);
  private toast = inject(HotToastService);
  router = inject(Router);
  searchTerm = '';
  filterPeriod = 'all';

  user: User = {
    name: '',
    email: '',
    img: '',
    qrCode: '',  // Inicializamos el campo qrCode
    joinDate: new Date(),
    totalPoints: 0,
    availablePoints: 0,
    level: 1,
    pointsProgress: 0,
    pointsToNextLevel: 1000,
    totalPurchases: 0,
    redeemedPoints: 0,
    totalSavings: 0
  };

  currentLevelBenefits = [
    'Acceso anticipado a promociones',
    'Utiliza tus estrellas a partir de 100'
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
        return `${baseClasses} bg-green-900 text-green-300`;
      case 'pending':
        return `${baseClasses} bg-yellow-900 text-yellow-300`;
      case 'cancelled':
        return `${baseClasses} bg-red-900 text-red-300`;
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

  ngOnInit() {
    this.loadUserData();
    this.loadPurchaseHistory();
  }

  async loadUserData() {
    try {
      const currentUser = await this.firebaseSvc.getCurrentUser();
      if (!currentUser) {
        this.toast.error('No has iniciado sesión');
        this.router.navigate(['/auth/login']);
        return;
      }
  
      const userId = currentUser.uid;
      const userData = await this.firebaseSvc.getDocument(`users/${userId}`);
      
      if (userData) {
        if (userData['role'] === 'admin') {
          this.router.navigate(['/dashboard']);
          return;
        }

        this.user = {
          name: userData['name'] || '',
          email: userData['email'] || '',
          img: userData['img'] || '',
          qrCode: userData['qrCode'] || '', // Cargamos el QR del usuario
          joinDate: userData['createdAt']?.toDate() || new Date(),
          totalPoints: userData['points'] || 0,
          availablePoints: userData['points'] || 0,
          level: Math.floor((userData['points'] || 0) / 1000) + 1,
          pointsProgress: ((userData['points'] || 0) % 1000) / 10,
          pointsToNextLevel: 1000 - ((userData['points'] || 0) % 1000),
          totalPurchases: 0,
          redeemedPoints: 0,
          totalSavings: 0
        };

        await this.loadUserStatistics(userId);
      } else {
        this.toast.error('No se encontraron datos del usuario');
        this.router.navigate(['/auth/login']);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.toast.error('Error al cargar los datos del usuario');
      this.router.navigate(['/auth/login']);
    }
  }

  async loadPurchaseHistory() {
    try {
      const currentUser = await this.firebaseSvc.getCurrentUser();
      if (!currentUser) return;
  
      const userId = currentUser.uid;
      const pointsHistory = await this.firebaseSvc.getCollectionData('pointsHistory');
      const userHistory = pointsHistory
        .filter((record: any) => record.customerId === userId)
        .map((record: any) => ({
          id: parseInt(record.id) || Math.floor(Math.random() * 1000), // Ensure numeric ID
          date: record.date?.toDate() || new Date(),
          orderNumber: `ORD-${record.id?.slice(-6).toUpperCase() || '000000'}`,
          total: record.totalAmount || 0,
          pointsEarned: record.points || 0,
          status: this.determineStatus(record)
        } as Purchase))
        .sort((a: Purchase, b: Purchase) => b.date.getTime() - a.date.getTime());
  
      this.purchases.set(userHistory);
    } catch (error) {
      this.toast.error('Error al cargar el historial de compras');
      console.error(error);
    }
  }
  
  private determineStatus(record: any): 'completed' | 'pending' | 'cancelled' {
      if (record.type === 'reduction') return 'cancelled';
      if (record.status === 'pending') return 'pending';
      return 'completed';
  }

  async loadUserStatistics(userId: string) {
    try {
      const pointsHistory = await this.firebaseSvc.getCollectionData('pointsHistory');
      console.log('Historial de puntos:', pointsHistory); // Agregar para debug
      
      if (!pointsHistory || !Array.isArray(pointsHistory)) {
        console.warn('No se encontró historial de puntos o formato inválido');
        return;
      }

      const userHistory = pointsHistory.filter((record: any) => record.customerId === userId);
      
      // Calcular estadísticas con validación
      const totalPoints = userHistory.reduce((sum: number, record: any) => {
        const points = Number(record.points) || 0;
        return sum + points;
      }, 0);

      const redeemedPoints = userHistory
        .filter((record: any) => Number(record.points) < 0)
        .reduce((sum: number, record: any) => sum + Math.abs(Number(record.points) || 0), 0);
      
      this.user = {
        ...this.user,
        totalPoints,
        availablePoints: Math.max(0, totalPoints - redeemedPoints),
        redeemedPoints,
        totalPurchases: userHistory.length,
        level: Math.floor(totalPoints / 1000) + 1,
        pointsProgress: (totalPoints % 1000) / 10,
        pointsToNextLevel: 1000 - (totalPoints % 1000)
      };
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      this.toast.error('Error al cargar estadísticas del usuario');
    }
}
}