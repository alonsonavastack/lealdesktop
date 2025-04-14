import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Product } from '../../../models/products.model';

@Component({
  selector: 'app-productos',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './productos.component.html'
})
export class ProductosComponent {
  products = signal<Product[]>([]);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  selectedProduct = signal<Product | null>(null);
  
  categories = [
    'Electrónicos',
    'Ropa',
    'Alimentos',
    'Hogar',
    'Belleza',
    'Deportes'
  ];

  productForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.productForm = this.fb.group({
      id: [null],
      name: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      image: ['', [Validators.required]],
      description: ['', [Validators.required]],
      category: ['', [Validators.required]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      points: [0, [Validators.required, Validators.min(0)]],
      pointsMultiplier: [1, [Validators.required, Validators.min(1)]],
      minPurchaseForPoints: [1, [Validators.required, Validators.min(1)]],
      maxPointsPerPurchase: [null],
      isPointsProduct: [false],
      pointsCost: [null],
      isActive: [true],
      createdAt: [new Date()],
      updatedAt: [null]
    });

    // Habilitar/deshabilitar pointsCost según isPointsProduct
    this.productForm.get('isPointsProduct')?.valueChanges.subscribe(isPointsProduct => {
      const pointsCostControl = this.productForm.get('pointsCost');
      if (isPointsProduct) {
        pointsCostControl?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        pointsCostControl?.clearValidators();
        pointsCostControl?.setValue(null);
      }
      pointsCostControl?.updateValueAndValidity();
    });
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.isLoading.set(true);
      const formData = this.productForm.value;
      
      const product = new Product(
        formData.id || Date.now(),
        formData.name,
        formData.price,
        formData.image,
        formData.description,
        formData.category,
        formData.quantity,
        formData.points,
        formData.pointsMultiplier,
        formData.minPurchaseForPoints,
        formData.maxPointsPerPurchase,
        formData.isPointsProduct,
        formData.pointsCost,
        formData.createdAt,
        new Date(),
        formData.isActive
      );

      if (this.selectedProduct()) {
        this.products.update(products => 
          products.map(p => p.id === product.id ? product : p)
        );
      } else {
        this.products.update(products => [...products, product]);
      }

      this.isLoading.set(false);
      this.showForm.set(false);
      this.productForm.reset();
    }
  }

  editProduct(product: Product) {
    this.selectedProduct.set(product);
    this.productForm.patchValue(product);
    this.showForm.set(true);
  }

  deleteProduct(id: number) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.products.update(products => products.filter(p => p.id !== id));
    }
  }

  toggleForm() {
    this.showForm.update(value => !value);
    if (!this.showForm()) {
      this.selectedProduct.set(null);
      this.productForm.reset({
        pointsMultiplier: 1,
        minPurchaseForPoints: 1,
        isActive: true,
        createdAt: new Date()
      });
    }
  }

  calculateCurrentPoints(): number {
    const formValue = this.productForm.value;
    if (formValue.quantity && formValue.points) {
      return new Product(
        0, '', 0, '', '', '', 0, formValue.points,
        formValue.pointsMultiplier,
        formValue.minPurchaseForPoints,
        formValue.maxPointsPerPurchase,
        formValue.isPointsProduct
      ).calculatePoints(formValue.quantity);
    }
    return 0;
  }
}