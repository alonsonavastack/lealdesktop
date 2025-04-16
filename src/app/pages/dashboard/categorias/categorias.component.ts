import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Category } from '../../../models/category.model';
import { FirebaseService } from '../../../services/firebase.service';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-categorias',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categorias.component.html'
})
export class CategoriasComponent implements OnInit {
  private firebaseSvc = inject(FirebaseService);
  private toast = inject(HotToastService);
  private fb = inject(FormBuilder);

  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  selectedCategory = signal<Category | null>(null);

  categoryForm: FormGroup;

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      image: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadCategories();
  }

  async loadCategories() {
    try {
      this.isLoading.set(true);
      const data = await this.firebaseSvc.getCollectionData('categories');
      this.categories.set(data as Category[]);
    } catch (error) {
      this.toast.error('Error al cargar categorías');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSubmit() {
    if (this.categoryForm.valid) {
      this.isLoading.set(true);
      const formData = this.categoryForm.value;
      
      try {
        if (this.selectedCategory()) {
          // Update existing category
          const categoryId = this.selectedCategory()!.id;
          await this.firebaseSvc.updateDocument(`categories/${categoryId}`, {
            ...formData,
            updatedAt: new Date()
          });
          this.toast.success('Categoría actualizada exitosamente');
        } else {
          // Create new category
          await this.firebaseSvc.addDocument('categories', {
            ...formData,
            createdAt: new Date(),
            updatedAt: null
          });
          this.toast.success('Categoría creada exitosamente');
        }

        this.loadCategories();
        this.showForm.set(false);
        this.categoryForm.reset({ isActive: true });
        this.selectedCategory.set(null);
      } catch (error) {
        this.toast.error('Error al guardar la categoría');
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  editCategory(category: Category) {
    this.selectedCategory.set(category);
    this.categoryForm.patchValue(category);
    this.showForm.set(true);
  }

  async deleteCategory(id: string) {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      try {
        this.isLoading.set(true);
        await this.firebaseSvc.deleteDocument(`categories/${id}`);
        this.toast.success('Categoría eliminada exitosamente');
        this.loadCategories();
      } catch (error) {
        this.toast.error('Error al eliminar la categoría');
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  toggleForm() {
    this.showForm.update(value => !value);
    if (!this.showForm()) {
      this.selectedCategory.set(null);
      this.categoryForm.reset({ isActive: true });
    }
  }
}