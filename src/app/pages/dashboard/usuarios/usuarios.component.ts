import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html'
})
export class UsuariosComponent {
  users = signal<User[]>([]);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  selectedUser = signal<User | null>(null);

  userForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      uid: [null],
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.required]],
      address: ['', [Validators.required]],
      img: [''],
      role: ['user', [Validators.required]],
      isActive: [true],
      createdAt: [new Date()],
      updatedAt: [null],
      lastLogin: [null]
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.isLoading.set(true);
      const formData = this.userForm.value;
      
      const user: User = {
        ...formData,
        uid: formData.uid || Date.now().toString(),
        updatedAt: new Date()
      };

      if (this.selectedUser()) {
        this.users.update(users => 
          users.map(u => u.uid === user.uid ? user : u)
        );
      } else {
        this.users.update(users => [...users, user]);
      }

      this.isLoading.set(false);
      this.showForm.set(false);
      this.userForm.reset({ role: 'user', isActive: true });
    }
  }

  editUser(user: User) {
    const userToEdit = { ...user };
    delete userToEdit.password; // Don't show password in form
    this.selectedUser.set(user);
    this.userForm.patchValue(userToEdit);
    this.showForm.set(true);
  }

  deleteUser(uid: string) {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      this.users.update(users => users.filter(u => u.uid !== uid));
    }
  }

  toggleForm() {
    this.showForm.update(value => !value);
    if (!this.showForm()) {
      this.selectedUser.set(null);
      this.userForm.reset({ 
        role: 'user', 
        isActive: true,
        createdAt: new Date()
      });
    }
  }
}