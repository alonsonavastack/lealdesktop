import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '../../../models/user.model';
import { FirebaseService } from '../../../services/firebase.service';
import { HotToastService } from '@ngxpert/hot-toast';
import { UtilsService } from '../../../services/utils.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit {
  firebaseService = inject(FirebaseService);
  toast = inject(HotToastService);
  utilsService = inject(UtilsService);
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
      img: ['https://icon-library.com/images/avatar-icon-images/avatar-icon-images-4.jpg'],
      role: ['client', [Validators.required]],
      isActive: [true],
      createdAt: [new Date()],
      updatedAt: [null],
      lastLogin: [null]
    });
  }

  ngOnInit() {
    this.getUsers();
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.isLoading.set(true);
      const formData = this.userForm.value;
      
      const userId = this.selectedUser()?.uid || formData.uid || Date.now().toString();
      
      let user: User = {
        ...formData,
        uid: userId,
        updatedAt: new Date()
      };

      // Always encrypt password for new users
      if (!this.selectedUser()) {
        console.log('Encrypting new password:', formData.password); // Debug log
        user.password = this.utilsService.encrypt(formData.password);
      } 
      // Handle password updates for existing users
      else if (formData.password && formData.password.trim() !== '') {
        console.log('Encrypting updated password:', formData.password); // Debug log
        user.password = this.utilsService.encrypt(formData.password);
      } else {
        user.password = this.selectedUser().password;
      }

      console.log('Final password value:', user.password); // Debug log

      this.firebaseService.setDocument(`users/${userId}`, user)
        .then(() => {
          this.getUsers();
          this.showForm.set(false);
          this.selectedUser.set(null);
          this.userForm.reset({ 
            role: 'user', 
            isActive: true,
            img: 'https://icon-library.com/images/avatar-icon-images/avatar-icon-images-4.jpg'
          });
          this.toast.success(
            this.selectedUser() ? 'Usuario actualizado con éxito!' : 'Usuario creado con éxito!',
            {
              duration: 2000,
              position: 'top-right',
              icon: '👏',
            }
          );
        })
        .catch(error => {
          console.error(error);
          this.toast.error(
            this.selectedUser() ? 'Error al actualizar usuario' : 'Error al crear usuario',
            {
              duration: 2000,
              position: 'top-right',
              icon: '😢',
            }
          );
        })
        .finally(() => {
          this.isLoading.set(false);
        });
    }
  }

  editUser(user: User) {
    const userToEdit = { ...user };
    delete userToEdit.password;
    this.selectedUser.set(user);
    
    if (this.userForm.get('password')) {
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.setValidators([Validators.minLength(6)]);
      this.userForm.get('password')?.updateValueAndValidity();
    }
    
    this.userForm.patchValue(userToEdit);
    this.showForm.set(true);
  }

  deleteUser(uid: string) {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      this.isLoading.set(true);
      const path = `users/${uid}`;
      
      this.firebaseService.deleteDocument(path)
        .then(() => {
          this.getUsers();
          this.toast.success('Usuario eliminado con éxito!', {
            duration: 2000,
            position: 'top-right',
            icon: '🗑️',
          });
        })
        .catch(error => {
          console.error(error);
          this.toast.error('Error al eliminar usuario', {
            duration: 2000,
            position: 'top-right',
            icon: '😢',
          });
        })
        .finally(() => {
          this.isLoading.set(false);
        });
    }
  }

  toggleForm() {
    this.showForm.update(value => !value);
    if (!this.showForm()) {
      this.selectedUser.set(null);
      if (this.userForm.get('password')) {
        this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.userForm.get('password')?.updateValueAndValidity();
      }
      this.userForm.reset({ 
        role: 'user', 
        isActive: true,
        createdAt: new Date(),
        img: 'https://icon-library.com/images/avatar-icon-images/avatar-icon-images-4.jpg'
      });
    }
  }

  getUsers() {
    this.isLoading.set(true);
    const path = 'users';
    
    this.firebaseService.getCollectionData(path)
      .then((res: any) => {
        this.users.set(res);
      })
      .catch(error => {
        console.error('Error fetching users:', error);
        this.toast.error('Error al cargar usuarios', {
          duration: 2000,
          position: 'top-right',
          icon: '😢'
        });
      })
      .finally(() => {
        this.isLoading.set(false);
      });
  }
}