import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../models/products.model';
import { OrderItem } from '../../../models/order.model';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent {
  currentOrder = signal<OrderItem[]>([]);
  products = signal<Product[]>([
    new Product(1, 'Producto 1', 100, 'url-imagen', 'Descripción 1', 'Categoría 1', 10, 5),
    new Product(2, 'Producto 2', 200, 'url-imagen', 'Descripción 2', 'Categoría 1', 15, 10),
    new Product(3, 'Producto 3', 150, 'url-imagen', 'Descripción 3', 'Categoría 2', 20, 7),
  ]);
  isLoading = signal<boolean>(false);
  showCustomerModal = signal<boolean>(false);
  customerSearch = '';
  
  // Example customers data
  mockCustomers = [
    { id: 1, name: 'Juan Pérez', phone: '123-456-7890', points: 100 },
    { id: 2, name: 'María García', phone: '098-765-4321', points: 250 },
    { id: 3, name: 'Carlos López', phone: '555-555-5555', points: 75 },
  ];
  
  filteredCustomers = signal<any[]>([]);
  
  orderForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.orderForm = this.fb.group({
      customerName: ['', Validators.required],
      customerId: ['', Validators.required],
      paymentMethod: ['cash', Validators.required]
    });
    
    this.filteredCustomers.set(this.mockCustomers);
  }

  addToOrder(product: Product) {
    this.currentOrder.update(items => {
      const existingItem = items.find(item => item.productId === product.id);
      if (existingItem) {
        return items.map(item => 
          item.productId === product.id 
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
                totalPoints: product.calculatePoints(item.quantity + 1)
              }
            : item
        );
      }
      return [...items, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        points: product.points,
        totalPoints: product.calculatePoints(1),
        subtotal: product.price
      }];
    });
  }

  updateQuantity(productId: number, newQuantity: number) {
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
              totalPoints: product.calculatePoints(newQuantity)
            }
          : item
      )
    );
  }

  removeFromOrder(productId: number) {
    this.currentOrder.update(items => 
      items.filter(item => item.productId !== productId)
    );
  }

  calculateTotals() {
    const items = this.currentOrder();
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const pointsEarned = items.reduce((sum, item) => sum + item.totalPoints, 0);

    return { subtotal, pointsEarned };
  }

  openCustomerModal() {
    this.showCustomerModal.set(true);
    this.filterCustomers();
  }

  closeCustomerModal() {
    this.showCustomerModal.set(false);
    this.customerSearch = '';
    this.filteredCustomers.set(this.mockCustomers);
  }

  filterCustomers() {
    const search = this.customerSearch.toLowerCase();
    this.filteredCustomers.update(customers => 
      this.mockCustomers.filter(customer => 
        customer.name.toLowerCase().includes(search) ||
        customer.phone.includes(search)
      )
    );
  }

  selectCustomer(customer: any) {
    this.orderForm.patchValue({
      customerName: customer.name,
      customerId: customer.id
    });
    this.closeCustomerModal();
  }

  completeOrder() {
    if (this.orderForm.valid && this.currentOrder().length > 0) {
      this.isLoading.set(true);
      
      const order = {
        customerId: this.orderForm.value.customerId,
        customerName: this.orderForm.value.customerName,
        items: this.currentOrder(),
        paymentMethod: this.orderForm.value.paymentMethod,
        total: this.calculateTotals().subtotal,
        pointsEarned: this.calculateTotals().pointsEarned,
        date: new Date()
      };

      // Simular proceso de guardado
      setTimeout(() => {
        console.log('Order completed:', order);
        this.printTicket();
        this.resetOrder();
        this.isLoading.set(false);
      }, 1000);
    }
  }

  resetOrder() {
    this.currentOrder.set([]);
    this.orderForm.reset({ paymentMethod: 'cash' });
  }

  printTicket() {
    const ticketWindow = window.open('', '_blank');
    if (!ticketWindow) return;

    const order = {
      items: this.currentOrder(),
      totals: this.calculateTotals(),
      customer: this.orderForm.value.customerName,
      paymentMethod: this.orderForm.value.paymentMethod,
      date: new Date()
    };

    ticketWindow.document.write(`
      <html>
        <head>
          <title>Ticket de Compra</title>
          <style>
            body { 
              font-family: monospace; 
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .item { 
              margin: 10px 0;
              display: flex;
              justify-content: space-between;
            }
            .item-details {
              margin-left: 20px;
            }
            .totals { 
              margin-top: 20px; 
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
            .payment-info {
              margin: 10px 0;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LEAL DESKTOP</h1>
            <p>Ticket de Venta</p>
            <p>Fecha: ${order.date.toLocaleString()}</p>
            <p>Cliente: ${order.customer}</p>
          </div>

          <div class="items">
            ${order.items.map(item => `
              <div class="item">
                <div>${item.quantity}x ${item.name}</div>
                <div class="item-details">
                  <div>$${item.price.toFixed(2)} c/u</div>
                  <div>$${item.subtotal.toFixed(2)}</div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="totals">
            <div class="total-line">
              <span>Total:</span>
              <span>$${order.totals.subtotal.toFixed(2)}</span>
            </div>
            <div class="total-line">
              <span>Puntos Ganados:</span>
              <span>${order.totals.pointsEarned} pts</span>
            </div>
          </div>

          <div class="payment-info">
            <p>Método de Pago: ${
              order.paymentMethod === 'cash' ? 'Efectivo' :
              order.paymentMethod === 'card' ? 'Tarjeta' : 'Puntos'
            }</p>
          </div>

          <div class="footer">
            <p>¡Gracias por su compra!</p>
            <p>www.lealdesktop.com</p>
          </div>
        </body>
      </html>
    `);
    ticketWindow.document.close();
    ticketWindow.print();
  }
}