import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { inject } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';

@Injectable({
  providedIn: 'root'
})
export class PointsService {
  private firebaseService = inject(FirebaseService);
  private toast = inject(HotToastService);

  constructor() {}

  async reducePoints(customerId: string, pointsToReduce: number) {
    try {
      const userData = await this.firebaseService.getDocument(`users/${customerId}`);
      if (!userData) {
        throw new Error('Usuario no encontrado');
      }

      const currentPoints = userData['points'] || 0;  // Fix index signature access
      if (currentPoints < pointsToReduce) {
        throw new Error('Puntos insuficientes');
      }

      const newPoints = currentPoints - pointsToReduce;

      const reductionRecord = {
        customerId,
        customerName: userData['name'],  // Fix index signature access
        points: -pointsToReduce,
        date: new Date(),
        type: 'reduction',
        totalAmount: 0
      };

      await this.firebaseService.addDocument('pointsHistory', reductionRecord);

      await this.firebaseService.updateDocument(`users/${customerId}`, {
        points: newPoints,
        updatedAt: new Date()
      });

      this.toast.success('Puntos reducidos exitosamente');
      return true;
    } catch (error: any) {
      this.toast.error(error.message || 'Error al reducir puntos');
      throw error;
    }
  }

  async getCustomerPoints(customerId: string): Promise<number> {
    try {
      const userData = await this.firebaseService.getDocument(`users/${customerId}`);
      return userData?.['points'] || 0;  // Fix index signature access
    } catch (error) {
      this.toast.error('Error al obtener los puntos del cliente');
      throw error;
    }
  }

  async getPointsHistory(customerId?: string) {
    try {
      const data = await this.firebaseService.getCollectionData('pointsHistory');
      if (customerId) {
        return data.filter((record: any) => record.customerId === customerId);
      }
      return data;
    } catch (error) {
      this.toast.error('Error al obtener el historial de puntos');
      throw error;
    }
  }
}