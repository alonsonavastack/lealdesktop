import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Sale } from '../../../models/sale.model';

@Component({
  selector: 'app-ventas',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ventas.component.html'
})
export class VentasComponent {
  sales = signal<Sale[]>([]);
  isLoading = signal<boolean>(false);
  showDetails = signal<boolean>(false);
  selectedSale = signal<Sale | null>(null);

  constructor() {}

  viewSaleDetails(sale: Sale) {
    this.selectedSale.set(sale);
    this.showDetails.set(true);
  }

  closeDetails() {
    this.showDetails.set(false);
    this.selectedSale.set(null);
  }

  getPointsClass(points: number): string {
    return points >= 100 ? 'text-green-500' : 'text-yellow-300';
  }
}