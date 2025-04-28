import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FirebaseService } from '../../../services/firebase.service';
import { UtilsService } from '../../../services/utils.service';
import { HotToastService } from '@ngxpert/hot-toast';
import { User } from '../../../models/user.model';
import { signal } from '@angular/core';
import QRCode from 'qrcode';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html'
})
export class UsuariosComponent {
  private fb = inject(FormBuilder);
  private firebaseService = inject(FirebaseService);
  private utilsService = inject(UtilsService);
  private toast = inject(HotToastService);

  users = signal<User[]>([]);
  showForm = signal(false);
  isLoading = signal(false);
  selectedUser = signal<User | null>(null);

  userForm: FormGroup;

  constructor() {
    this.initForm();
    this.getUsers();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [''],
      address: [''],
      role: ['user'],
      isActive: [true],
      img: ['https://icon-library.com/images/avatar-icon-images/avatar-icon-images-4.jpg'],
      points: [0],
      createdAt: [new Date()],
      updatedAt: [null],
      lastLogin: [null]
    });
  }

  async onSubmit() {
    if (this.userForm.valid) {
      this.isLoading.set(true);
      const formData = this.userForm.value;
      
      try {
        // Verificar si el correo ya existe
        const users = await this.firebaseService.getCollectionData('users');
        const emailExists = users.some((user: any) => 
          user.email === formData.email && 
          (!this.selectedUser() || user.uid !== this.selectedUser()?.uid)
        );

        if (emailExists) {
          this.toast.error(`El correo ${formData.email} ya está registrado`, {
            duration: 3000,
            position: 'top-right',
            icon: '⚠️'
          });
          this.isLoading.set(false);
          return;
        }

        const userId = this.selectedUser()?.uid || formData.uid || Date.now().toString();
        
        // Generar datos para el QR
        const qrData = {
          userId: userId,
          name: formData.name,
          email: formData.email,
          points: formData.points
        };

        // Generar QR como URL de datos
        const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));
        
        let user: User = {
          ...formData,
          uid: userId,
          qrCode: qrCodeUrl,
          updatedAt: new Date()
        };

        // Manejar contraseña
        if (!this.selectedUser()) {
          user.password = this.utilsService.encrypt(formData.password);
        } else if (formData.password && formData.password.trim() !== '') {
          user.password = this.utilsService.encrypt(formData.password);
        } else {
          user.password = this.selectedUser().password;
        }

        await this.firebaseService.setDocument(`users/${userId}`, user);
        
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
      } catch (error) {
        console.error('Error:', error);
        this.toast.error(
          'Error al procesar el usuario',
          {
            duration: 2000,
            position: 'top-right',
            icon: '😢',
          }
        );
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  editUser(user: any) {
    // Crear una copia profunda del usuario
    const userToEdit = JSON.parse(JSON.stringify(user));
    
    // Eliminar la contraseña del formulario
    delete userToEdit.password;
    
    // Establecer el usuario seleccionado
    this.selectedUser.set(user);
    
    // Actualizar validadores de contraseña
    if (this.userForm.get('password')) {
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.setValidators([Validators.minLength(6)]);
      this.userForm.get('password')?.updateValueAndValidity();
    }
    
    // Actualizar el formulario con los datos del usuario
    this.userForm.patchValue({
      ...userToEdit,
      uid: user.uid,
      role: user.role || 'client',
      isActive: user.isActive !== undefined ? user.isActive : true
    });
    
    // Mostrar el formulario
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