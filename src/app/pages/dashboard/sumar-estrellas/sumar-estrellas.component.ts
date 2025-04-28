import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { User } from '../../../models/user.model';
import { FirebaseService } from '../../../services/firebase.service';
import { HotToastService } from '@ngxpert/hot-toast';
import { PointsService } from '../../../services/points.service';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

interface PointsRecord {
  id: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  points: number;
  date: Date;
}

@Component({
  selector: 'app-sumar-estrellas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ZXingScannerModule],
  templateUrl: './sumar-estrellas.component.html',
  styleUrl: './sumar-estrellas.component.css'
})
export class SumarEstrellasComponent {
  // Add this property
  allowedFormats = [BarcodeFormat.QR_CODE];
  firebaseService = inject(FirebaseService);
  pointsService = inject(PointsService);  // Properly inject PointsService
  private toast = inject(HotToastService);

  pointsForm: FormGroup;
  isLoading = false;
  customerSearch = '';
  calculatedPoints = 0;
  showCustomerModal = signal(false);
  filteredCustomers = signal<any[]>([]);
  pointsHistory = signal<any[]>([]);
  selectedCustomer: any = null;
  customers = signal<User[]>([]);
  showEditModal = signal(false);
  editingRecord: any = null;
  editForm: FormGroup;

  // Propiedades
  showReducePointsModal = signal(false);
  reducePointsForm: FormGroup;
  showQRModal = signal(false);

  // Constructor
  constructor(private fb: FormBuilder) {
    this.reducePointsForm = this.fb.group({
      pointsToReduce: ['', Validators.required]
    });
    this.pointsForm = this.fb.group({
      customerName: ['', Validators.required],
      totalAmount: [0, [Validators.required, Validators.min(0)]]
    });

    this.editForm = this.fb.group({
      totalAmount: [0, [Validators.required, Validators.min(0)]]
    });
  }
  
  // Métodos
  openReducePointsModal() {
    this.showReducePointsModal.set(true);
  }
  
  closeReducePointsModal() {
    this.showReducePointsModal.set(false);
    this.reducePointsForm.reset();
  }
  
  getAvailablePointsOptions(): number[] {
    const totalPoints = this.getTotalPoints();
    const options = [];
    for (let i = 100; i <= totalPoints; i += 100) {
      options.push(i);
    }
    return options;
  }
  
  async reducePoints() {
    if (this.reducePointsForm.valid && !this.isLoading) {
      this.isLoading = true;
      try {
        const pointsToReduce = this.reducePointsForm.get('pointsToReduce')?.value;
        
        await this.pointsService.reducePoints(
          this.selectedCustomer.uid,
          pointsToReduce
        );
  
        this.closeReducePointsModal();
        await this.loadPointsHistory();
      } catch (error) {
        console.error('Error al reducir puntos:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }



  ngOnInit() {
    this.loadCustomers();
    this.loadPointsHistory();
  }

  calculatePoints() {
    const totalAmount = this.pointsForm.get('totalAmount')?.value || 0;
    this.calculatedPoints = Math.floor(totalAmount / 20); // 1 punto por cada 20 pesos
  }

  getStarsArray(points?: number) {
    return new Array(points || this.calculatedPoints);
  }

  openCustomerModal() {
    this.showCustomerModal.set(true);
    this.filterCustomers('');
  }

  closeCustomerModal() {
    this.showCustomerModal.set(false);
    this.customerSearch = '';
  }

  filterCustomers(search: string) {
    const searchTerm = search.toLowerCase();
    this.filteredCustomers.set(
      this.customers().filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) || 
        customer.email.toLowerCase().includes(searchTerm) ||
        (customer.phone && customer.phone.includes(searchTerm))
      )
    );
  }

  async addPoints() {
    if (this.pointsForm.valid && this.selectedCustomer) {
      this.isLoading = true;
      
      try {
        const pointsData = {
          customerId: this.selectedCustomer.uid,
          customerName: this.selectedCustomer.name,
          totalAmount: this.pointsForm.get('totalAmount')?.value,
          points: this.calculatedPoints,
          date: new Date()
        };

        // Guardar el registro en la colección de historial de puntos
        await this.firebaseService.addDocument('pointsHistory', pointsData);

        // Actualizar los puntos del usuario
        const currentPoints = this.selectedCustomer.points || 0;
        const newPoints = currentPoints + this.calculatedPoints;

        await this.firebaseService.updateDocument(`users/${this.selectedCustomer.uid}`, {
          points: newPoints,
          updatedAt: new Date()
        });

        this.toast.success('Puntos agregados exitosamente');
        this.loadPointsHistory();
        
        this.pointsForm.reset();
        this.selectedCustomer = null;
        this.calculatedPoints = 0;
      } catch (error) {
        this.toast.error('Error al agregar puntos');
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  async loadPointsHistory() {
    try {
      const data = await this.firebaseService.getCollectionData('pointsHistory');
      
      // Calcular el total general de todos los puntos
      const totalGeneralPoints = data.reduce((sum, record: PointsRecord) => sum + (record.points || 0), 0);
      
      // Si hay un usuario seleccionado, mostrar solo su historial
      if (this.selectedCustomer) {
        const filteredHistory = data
          .filter((record: PointsRecord) => record.customerId === this.selectedCustomer.uid)
          .sort((a: PointsRecord, b: PointsRecord) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        
        // Actualizar los puntos del usuario seleccionado
        const userTotalPoints = filteredHistory.reduce((sum, record: PointsRecord) => sum + (record.points || 0), 0);
        this.selectedCustomer = {
          ...this.selectedCustomer,
          points: userTotalPoints,
          totalPoints: totalGeneralPoints // Agregamos el total general
        };
        
        this.pointsHistory.set(filteredHistory);
      } else {
        const sortedHistory = data.sort((a: PointsRecord, b: PointsRecord) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.pointsHistory.set(sortedHistory);
      }
    } catch (error) {
      this.toast.error('Error al cargar el historial de puntos');
    }
  }

  selectCustomer(customer: any) {
    this.selectedCustomer = customer;
    this.pointsForm.patchValue({
      customerName: customer.name
    });
    this.closeCustomerModal();
    // Cargar el historial del cliente seleccionado
    this.loadPointsHistory();
    // Actualizar los puntos del usuario seleccionado
    this.loadCustomerPoints();
  }

  async loadCustomerPoints() {
    if (this.selectedCustomer) {
      try {
        // Obtener los datos actualizados del usuario
        const userData = await this.firebaseService.getDocument(`users/${this.selectedCustomer.uid}`);
        if (userData) {
          // Actualizar solo los puntos del usuario seleccionado
          this.selectedCustomer = {
            ...this.selectedCustomer,
            points: userData['points'] || 0
          };
        }
      } catch (error) {
        this.toast.error('Error al cargar los puntos del cliente');
      }
    }
  }

  async loadCustomers() {
    try {
      const data = await this.firebaseService.getCollectionData('users');
      // Obtener el historial de puntos
      const pointsHistory = await this.firebaseService.getCollectionData('pointsHistory');
      
      const users = await Promise.all(data.map(async (user: any) => {
        // Calcular los puntos totales del historial para cada usuario
        const userPoints = pointsHistory
          .filter((record: any) => record.customerId === user.uid)
          .reduce((sum: number, record: any) => sum + (record.points || 0), 0);
        
        return {
          ...user,
          points: userPoints
        };
      })) as User[];
      
      this.customers.set(users);
      this.filteredCustomers.set(users);
    } catch (error) {
      this.toast.error('Error al cargar clientes');
    }
  }

  async deletePointsRecord(record: any) {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      try {
        this.isLoading = true;
        
        // Actualizar los puntos del usuario
        const user = this.customers().find(c => c.uid === record.customerId);
        if (user) {
          const newPoints = (user.points || 0) - record.points;
          await this.firebaseService.updateDocument(`users/${record.customerId}`, {
            points: newPoints,
            updatedAt: new Date()
          });
        }

        // Eliminar el registro
        await this.firebaseService.deleteDocument(`pointsHistory/${record.id}`);
        
        this.toast.success('Registro eliminado exitosamente');
        this.loadPointsHistory();
        this.loadCustomers();
      } catch (error) {
        this.toast.error('Error al eliminar el registro');
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  async editPointsRecord(record: any) {
    this.editingRecord = record;
    this.editForm.patchValue({
      totalAmount: record.totalAmount
    });
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.editingRecord = null;
    this.editForm.reset();
  }

  async saveEditedRecord() {
    if (this.editForm.valid && this.editingRecord) {
      this.isLoading = true;
      
      try {
        const newAmount = this.editForm.get('totalAmount')?.value;
        const newPoints = Math.floor(newAmount / 20);
        const pointsDiff = newPoints - this.editingRecord.points;

        // Actualizar el registro en el historial
        await this.firebaseService.updateDocument(`pointsHistory/${this.editingRecord.id}`, {
          totalAmount: newAmount,
          points: newPoints,
          updatedAt: new Date()
        });

        // Actualizar los puntos del usuario
        const user = this.customers().find(c => c.uid === this.editingRecord.customerId);
        if (user) {
          const currentPoints = user.points || 0;
          const updatedPoints = currentPoints + pointsDiff;
          
          await this.firebaseService.updateDocument(`users/${this.editingRecord.customerId}`, {
            points: updatedPoints,
            updatedAt: new Date()
          });
        }

        this.toast.success('Registro actualizado exitosamente');
        this.loadPointsHistory();
        this.loadCustomers();
        this.closeEditModal();
      } catch (error) {
        this.toast.error('Error al actualizar el registro');
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  calculateEditPoints(amount: number): number {
    return Math.floor(amount / 20);
  }

  getTotalPoints(): number {
    return this.pointsHistory().reduce((sum, record) => sum + (record.points || 0), 0);
  }

  openQRScanner() {
    this.showQRModal.set(true);
  }

  closeQRModal() {
    this.showQRModal.set(false);
  }

  async onQRCodeScanned(result: string) {
    try {
      const qrData = JSON.parse(result);
      if (qrData.userId) {
        const userData = await this.firebaseService.getDocument(`users/${qrData.userId}`);
        if (userData) {
          const customer = {
            uid: qrData.userId,
            name: userData['name'],
            email: userData['email'],
            phone: userData['phone'],
            points: userData['points'] || 0
          };
          this.selectCustomer(customer);
          this.closeQRModal();
        } else {
          this.toast.error('Usuario no encontrado');
        }
      } else {
        this.toast.error('QR inválido');
      }
    } catch (error) {
      console.error('Error al procesar QR:', error);
      this.toast.error('Error al procesar el código QR');
    }
  }
}