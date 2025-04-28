import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Product } from '../../../models/products.model';
import { Category } from '../../../models/category.model';
import { FirebaseService } from '../../../services/firebase.service';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './productos.component.html'
})
export class ProductosComponent implements OnInit {
  private firebaseSvc = inject(FirebaseService);
  private toast = inject(HotToastService);
  private fb = inject(FormBuilder);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  selectedProduct = signal<Product | null>(null);

  // Change from FormGroup to FormGroup instance
  productForm: FormGroup;

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required]],
      price: ['', [Validators.required, Validators.min(0)]],
      image: ['', [Validators.required, Validators.pattern('https?://.+')]],
      description: ['', [Validators.required]],
      category: ['', [Validators.required]],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  async loadCategories() {
    try {
      const data = await this.firebaseSvc.getCollectionData('categories');
      this.categories.set(data as Category[]);
    } catch (error) {
      this.toast.error('Error al cargar categorías');
    }
  }

  async loadProducts() {
    try {
      this.isLoading.set(true);
      const data = await this.firebaseSvc.getCollectionData('products');
      this.products.set(data as any[]);
    } catch (error) {
      this.toast.error('Error al cargar productos');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSubmit() {
    if (this.productForm.valid) {
      this.isLoading.set(true);
      const formData = this.productForm.value;
      
      try {
        if (this.selectedProduct()) {
          // Validación adicional del ID
          if (!this.selectedProduct()?.id) {
            throw new Error('ID de producto no válido');
          }
          
          const productId = this.selectedProduct()!.id;
          await this.firebaseSvc.updateDocument(`products/${productId}`, {
            ...formData,
            updatedAt: new Date()
          });
          this.toast.success('Producto actualizado exitosamente');
        } else {
          await this.firebaseSvc.addDocument('products', {
            ...formData,
            createdAt: new Date(),
            updatedAt: null
          });
          this.toast.success('Producto creado exitosamente');
        }

        this.loadProducts();
        this.showForm.set(false);
        this.productForm.reset({
          isActive: true,
          pointsMultiplier: 1,
          minPurchaseForPoints: 1,
          points: 0,
          quantity: 0,
          isPointsProduct: false
        });
        this.selectedProduct.set(null);
      } catch (error: any) {
        this.toast.error(error.message || 'Error al guardar el producto');
        console.error('Error en onSubmit:', error);
      } finally {
        this.isLoading.set(false);
      }
    } else {
      Object.keys(this.productForm.controls).forEach(key => {
        const control = this.productForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  // Add this method to handle points product changes
  onPointsProductChange() {
    const isPointsProduct = this.productForm.get('isPointsProduct')?.value;
    if (isPointsProduct) {
      this.productForm.get('pointsCost')?.setValidators([Validators.required, Validators.min(0)]);
      this.productForm.get('points')?.setValue(0);
      this.productForm.get('pointsMultiplier')?.setValue(1);
    } else {
      this.productForm.get('pointsCost')?.clearValidators();
      this.productForm.get('pointsCost')?.setValue(null);
    }
    this.productForm.get('pointsCost')?.updateValueAndValidity();
  }

  editProduct(product: Product) {
      if (!product || !product.id) {
        this.toast.error('Producto no válido');
        return;
      }
      
      // Primero activamos el formulario
      this.showForm.set(true);
      
      // Esperamos un momento mínimo para que el DOM se actualice
      setTimeout(() => {
        // Luego actualizamos el formulario y hacemos el scroll
        this.selectedProduct.set(product);
        
        // Asegurarnos de que tenemos las categorías cargadas
        if (this.categories().length === 0) {
          this.loadCategories().then(() => {
            this.setProductFormValues(product);
          });
        } else {
          this.setProductFormValues(product);
        }
        
        const element = document.getElementById('editForm');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 0);
  }

  // Método auxiliar para establecer los valores del formulario
  private setProductFormValues(product: Product) {
    this.productForm.patchValue({
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.description,
      category: product.category,
      isActive: product.isActive !== undefined ? product.isActive : true
    });
  }

  async deleteProduct(id: string | number) {
      if (!id) {
          this.toast.error('ID de producto no válido');
          return;
      }
  
      if (confirm('¿Estás seguro de eliminar este producto?')) {
          try {
              this.isLoading.set(true);
              await this.firebaseSvc.deleteDocument(`products/${String(id)}`);
              this.toast.success('Producto eliminado exitosamente');
              this.loadProducts();
          } catch (error) {
              this.toast.error('Error al eliminar el producto');
          } finally {
              this.isLoading.set(false);
          }
      }
  }

  toggleForm() {
    this.showForm.update(value => !value);
    if (!this.showForm()) {
      this.selectedProduct.set(null);
      this.productForm.reset({ isActive: true });
    }
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category ? category.name : 'Categoría no encontrada';
  }
}