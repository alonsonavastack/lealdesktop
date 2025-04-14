import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from '@angular/fire/firestore';
import { User } from '../models/user.model';
import { Product } from '../models/products.model';
import { Category } from '../models/category.model';
import { Sale } from '../models/sale.model';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor(private firestore: Firestore) {}

  // Users Collection
  async createUser(user: User) {
    const collectionRef = collection(this.firestore, 'users');
    return addDoc(collectionRef, user);
  }

  async updateUser(id: string, user: Partial<User>) {
    const docRef = doc(this.firestore, 'users', id);
    return updateDoc(docRef, user);
  }

  async deleteUser(id: string) {
    const docRef = doc(this.firestore, 'users', id);
    return deleteDoc(docRef);
  }

  async getUsers() {
    const collectionRef = collection(this.firestore, 'users');
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Products Collection
  async createProduct(product: Product) {
    const collectionRef = collection(this.firestore, 'products');
    return addDoc(collectionRef, product);
  }

  async updateProduct(id: string, product: Partial<Product>) {
    const docRef = doc(this.firestore, 'products', id);
    return updateDoc(docRef, product);
  }

  async deleteProduct(id: string) {
    const docRef = doc(this.firestore, 'products', id);
    return deleteDoc(docRef);
  }

  async getProducts() {
    const collectionRef = collection(this.firestore, 'products');
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Categories Collection
  async createCategory(category: Category) {
    const collectionRef = collection(this.firestore, 'categories');
    return addDoc(collectionRef, category);
  }

  async updateCategory(id: string, category: Partial<Category>) {
    const docRef = doc(this.firestore, 'categories', id);
    return updateDoc(docRef, category);
  }

  async deleteCategory(id: string) {
    const docRef = doc(this.firestore, 'categories', id);
    return deleteDoc(docRef);
  }

  async getCategories() {
    const collectionRef = collection(this.firestore, 'categories');
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Sales Collection
  async createSale(sale: Sale) {
    const collectionRef = collection(this.firestore, 'sales');
    return addDoc(collectionRef, sale);
  }

  async updateSale(id: string, sale: Partial<Sale>) {
    const docRef = doc(this.firestore, 'sales', id);
    return updateDoc(docRef, sale);
  }

  async deleteSale(id: string) {
    const docRef = doc(this.firestore, 'sales', id);
    return deleteDoc(docRef);
  }

  async getSales() {
    const collectionRef = collection(this.firestore, 'sales');
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Points Management
  async getUserPoints(userId: string) {
    const salesRef = collection(this.firestore, 'sales');
    const q = query(salesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

   // Orders Collection
   async createOrder(order: Order) {
    const collectionRef = collection(this.firestore, 'orders');
    return addDoc(collectionRef, order);
  }

  async updateOrder(id: string, order: Partial<Order>) {
    const docRef = doc(this.firestore, 'orders', id);
    return updateDoc(docRef, order);
  }

  async getOrders() {
    const collectionRef = collection(this.firestore, 'orders');
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getOrdersByCustomer(customerId: string) {
    const ordersRef = collection(this.firestore, 'orders');
    const q = query(ordersRef, where('customerId', '==', customerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
/*import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  auth = inject(AngularFireAuth);
  fireStore = inject(AngularFirestore);

  constructor() { }

  getAuth() {
    return getAuth();
  }

  login(user: User) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password);
  }
}
*/