import { inject, Injectable, signal } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { User } from '../models/user.model';
import { collection, addDoc, getFirestore, doc, setDoc, getDoc, getDocs, query, where, deleteDoc } from '@angular/fire/firestore';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  auth = inject(AngularFireAuth);
  fireStore = inject(AngularFirestore);
  utilsService = inject(UtilsService);
  // Add signals
  private _user = signal<User>({} as User);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  constructor() { }

  // Getters for signals
  get user() { return this._user(); }
  get loading() { return this._loading(); }
  get error() { return this._error(); }

  getAuth() {
    return getAuth();
  }

  async login(user: User) {
    this._loading.set(true);
    this._error.set(null);
    try {
      const result = await signInWithEmailAndPassword(getAuth(), user.email, user.password);
      
      // Get user data from Firestore
      const userData = await this.getDocument(`users/${result.user.uid}`);
      const fullUserData = { ...userData } as User;
      
      // Store user data
      this._user.set(fullUserData);
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(fullUserData));
      
      // Return both auth result and user data
      return {
        result,
        userData: fullUserData
      };
    } catch (error: any) {
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  // Add method to check user role
  getUserRole(): string {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user) as User;
      return userData.role;
    }
    return 'user'; // default role
  }

  async getDocument(path: string) {
    this._loading.set(true);
    try {
      const docData = await getDoc(doc(getFirestore(), path));
      return docData.data();
    } catch (error: any) {
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async getCollectionData(path: string) {
    this._loading.set(true);
    try {
      const querySnapshot = await getDocs(collection(getFirestore(), path));
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
    } catch (error: any) {
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async addDocument(path: string, data: any) {   
    this._loading.set(true);
    try {
      const result = await addDoc(collection(getFirestore(), path), data);
      return result;
    } catch (error: any) {
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async updateDocument(path: string, data: any) {
    this._loading.set(true);
    try {
      const docRef = doc(getFirestore(), path);
      await setDoc(docRef, data, { merge: true });
      return true;
    } catch (error: any) {
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async setDocument(path: string, data: any) {
    try {
      const docRef = doc(getFirestore(), path);
      await setDoc(docRef, data);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async deleteDocument(path: string) {
    this._loading.set(true);
    try {
      await deleteDoc(doc(getFirestore(), path));
      return true;
    } catch (error: any) {
      this._error.set(error.message);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

    // Add this new method for collection-based authentication
    async loginWithCredentials(email: string, password: string) {
      this._loading.set(true);
      try {
        const usersRef = collection(getFirestore(), 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw new Error('Usuario no encontrado');
        }
  
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as User;
        
        // Decrypt and verify password
        const decryptedPassword = this.utilsService.decrypt(userData.password);
        
        if (password !== decryptedPassword) {
          throw new Error('Contraseña incorrecta');
        }
  
        this._user.set(userData);
        return userData;
      } catch (error) {
        throw error;
      } finally {
        this._loading.set(false);
      }
    }

    // actualiza el perfil del usuario
    async updateUserProfile(userData: User, changePassword: boolean = false) {
      this._loading.set(true);
      try {
        const userRef = doc(getFirestore(), `users/${userData.uid}`);
        
        if (changePassword && userData.password) {
          userData.password = this.utilsService.encrypt(userData.password);
        }
  
        await setDoc(userRef, {
          ...userData,
          updatedAt: new Date()
        }, { merge: true });
  
        // Update local storage
        localStorage.setItem('user', JSON.stringify(userData));
        this._user.set(userData);
  
        return userData;
      } catch (error: any) {
        this._error.set(error.message);
        throw error;
      } finally {
        this._loading.set(false);
      }
    }
}