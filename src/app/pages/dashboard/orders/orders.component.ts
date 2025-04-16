import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../models/products.model';
import { Order, OrderItem } from '../../../models/order.model';
import { User } from '../../../models/user.model';
import { FirebaseService } from '../../../services/firebase.service';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './orders.component.html'
})
export class OrdersComponent {
  private firebaseSvc = inject(FirebaseService);
  private toast = inject(HotToastService);
  private fb = inject(FormBuilder);

  currentOrder = signal<OrderItem[]>([]);
  products = signal<Product[]>([]);
  customers = signal<User[]>([]);
  isLoading = signal<boolean>(false);
  showCustomerModal = signal<boolean>(false);
  customerSearch = '';
  filteredCustomers = signal<User[]>([]);

  orderForm: FormGroup;

  constructor() {
    this.orderForm = this.fb.group({
      customerName: ['', Validators.required],
      customerId: ['', Validators.required],
      paymentMethod: ['cash', Validators.required],
      tax: [0, [Validators.required, Validators.min(0)]],
    });

    this.loadProducts();
    this.loadCustomers();
    this.filteredCustomers.set([]); // Initialize filtered customers
  }

  async loadProducts() {
    try {
      const data = await this.firebaseSvc.getCollectionData('products');
      this.products.set(data as Product[]);
    } catch (error) {
      this.toast.error('Error al cargar productos');
    }
  }

  // Add missing methods and fix existing ones
  closeCustomerModal() {
    this.showCustomerModal.set(false);
    this.customerSearch = '';
    this.filteredCustomers.set(this.customers());
  }

  filterCustomers(search: string) {
    const searchTerm = search.toLowerCase();
    this.filteredCustomers.set(
      this.customers().filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm)
      )
    );
  }

  canPayWithPoints(): boolean {
    const customer = this.customers().find(c => c?.uid === this.orderForm.get('customerId')?.value);
    const currentPoints = customer?.points || 0;
    const requiredPoints = this.calculatePointsCost();
    
    return requiredPoints > 0 && currentPoints >= requiredPoints;
  }

  async completeOrder() {
    if (this.orderForm.valid && this.currentOrder().length > 0) {
      try {
        this.isLoading.set(true);
        const totals = this.calculateTotals();
        const customerId = this.orderForm.value.customerId;
        const customer = this.customers().find(c => c?.uid === customerId);
        
        if (!customer || !customer.uid) {
          throw new Error('Cliente no encontrado');
        }

        const order: Order = {
          items: this.currentOrder(),
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          pointsEarned: totals.pointsEarned,
          status: 'completed',
          paymentMethod: this.orderForm.value.paymentMethod,
          customerName: customer.name,
          customerId: customer.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await this.firebaseSvc.addDocument('orders', order);

        // Update user points
        const newPoints = this.orderForm.value.paymentMethod === 'points'
          ? (customer.points || 0) - this.calculatePointsCost() + totals.pointsEarned
          : (customer.points || 0) + totals.pointsEarned;

        await this.firebaseSvc.updateDocument(`users/${customer.uid}`, {
          points: newPoints,
          updatedAt: new Date()
        });

        this.printTicket(order, customer, totals); // Add this line
        this.toast.success('Orden completada exitosamente');
        this.resetOrder();
      } catch (error) {
        this.toast.error('Error al procesar la orden: ' + error.message);
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  private printTicket(order: Order, customer: User, totals: any) {
    const mexicoDate = new Date().toLocaleString('es-MX', { 
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  
    const ticketContent = `
      <div style="font-family: monospace; width: 300px; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2>LEAL</h2>
          <p>${mexicoDate}</p>
        </div>
  
        <div style="margin-bottom: 20px;">
          <p>Cliente: ${customer.name}</p>
          <p>Orden #: ${order.id || ''}</p>
        </div>
  
        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0;">
          ${order.items.map(item => `
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
              <span>${item.name} x${item.quantity}</span>
              <span>$${item.subtotal.toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
  
        <div style="margin-top: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>$${order.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Impuesto:</span>
            <span>$${order.tax.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>Total:</span>
            <span>$${order.total.toFixed(2)}</span>
          </div>
        </div>
  
        <div style="margin-top: 20px; text-align: center;">
          <p>Método de Pago: ${order.paymentMethod === 'points' ? 'Puntos' : order.paymentMethod === 'card' ? 'Tarjeta' : 'Efectivo'}</p>
          <p>Puntos Ganados: ${order.pointsEarned}</p>
          <p>Puntos Acumulados: ${customer.points}</p>
          ${order.paymentMethod === 'points' ? `<p>Puntos Utilizados: ${this.calculatePointsCost()}</p>` : ''}
          <p>¡Gracias por su compra!</p>
        </div>
      </div>
    `;
  
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket de Compra</title>
          </head>
          <body style="margin: 0; display: flex; justify-content: center; padding: 20px;">
            ${ticketContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  }

  selectCustomer(customer: User) {
    if (!customer?.uid) return;
    
    this.orderForm.patchValue({
      customerName: customer.name,
      customerId: customer.uid
    });
    this.showCustomerModal.set(false);
  }

  calculatePointsCost(): number {
    return this.currentOrder().reduce((total, item) => {
      const product = this.products().find(p => p.id === item.productId);
      if (product?.isPointsProduct && product.pointsCost) {
        return total + (product.pointsCost * item.quantity);
      }
      return total;
    }, 0);
  }

  async loadCustomers() {
    try {
      const data = await this.firebaseSvc.getCollectionData('users');
      const users = data.map((user: any) => ({
        ...user,
        points: user.points || 0
      })) as User[];
      this.customers.set(users);
      this.filteredCustomers.set(users);
    } catch (error) {
      this.toast.error('Error al cargar clientes');
    }
  }

  addToOrder(product: Product) {
    if (!product.isActive || product.quantity <= 0) {
      this.toast.error('Producto no disponible');
      return;
    }

    this.currentOrder.update(items => {
      const existingItem = items.find(item => item.productId === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.quantity) {
          this.toast.error('Stock insuficiente');
          return items;
        }
        return items.map(item => 
          item.productId === product.id 
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
                totalPoints: (item.quantity + 1) * (product.points || 0)
              }
            : item
        ) as OrderItem[];
      }
      return [...items, {
        productId: product.id as string,
        name: product.name,
        price: product.price,
        quantity: 1,
        points: product.points || 0,
        totalPoints: product.points || 0,
        subtotal: product.price
      }] as OrderItem[];
    });
  }

  updateQuantity(productId: string, newQuantity: number) {
    if (newQuantity < 1) {
      this.removeFromOrder(productId);
      return;
    }

    const product = this.products().find(p => p.id === productId);
    if (!product) return;

    this.currentOrder.update(items =>
      items.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.price,
              totalPoints: newQuantity * (product.points || 0)
            }
          : item
      )
    );
  }

  calculateTotals() {
    const items = this.currentOrder();
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = (this.orderForm.get('tax')?.value || 0) * subtotal;
    const total = subtotal + tax;
    
    // Calculate points earned
    const pointsEarned = items.reduce((sum, item) => {
      const product = this.products().find(p => p.id === item.productId);
      if (product && !product.isPointsProduct) {
        return sum + (item.quantity * (product.points || 0));
      }
      return sum;
    }, 0);

    return { subtotal, tax, total, pointsEarned };
  }

  removeFromOrder(productId: string) {
    this.currentOrder.update(items => 
      items.filter(item => item.productId !== productId)
    );
  }

  

  // Remove the duplicate calculateTotals method

  resetOrder() {
    this.currentOrder.set([]);
    this.orderForm.reset({ 
      paymentMethod: 'cash',
      tax: 0
    });
  }

  openCustomerModal() {
    this.showCustomerModal.set(true);
    this.filterCustomers(this.customerSearch);
  }
}