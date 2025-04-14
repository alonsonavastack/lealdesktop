import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-categorias',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categorias.component.html'
})
export class CategoriasComponent {
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  selectedCategory = signal<Category | null>(null);

  categoryForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      image: [''],
      isActive: [true]
    });
  }

  onSubmit() {
    if (this.categoryForm.valid) {
      this.isLoading.set(true);
      const formData = this.categoryForm.value;
      
      const category: Category = {
        ...formData,
        id: this.selectedCategory()?.id || Date.now().toString(),
        createdAt: this.selectedCategory()?.createdAt || new Date(),
        updatedAt: new Date()
      };

      if (this.selectedCategory()) {
        this.categories.update(cats => 
          cats.map(c => c.id === category.id ? category : c)
        );
      } else {
        this.categories.update(cats => [...cats, category]);
      }

      this.isLoading.set(false);
      this.showForm.set(false);
      this.categoryForm.reset({ isActive: true });
    }
  }

  editCategory(category: Category) {
    this.selectedCategory.set(category);
    this.categoryForm.patchValue(category);
    this.showForm.set(true);
  }

  deleteCategory(id: string) {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      this.categories.update(cats => cats.filter(c => c.id !== id));
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