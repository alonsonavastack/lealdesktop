import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

    router = inject(Router);
    private secretKey = 'L3@L-D3skt0p-2024-S3cur3-K3y';
    
    routerLink(url: string) {
      return this.router.navigateByUrl(url);
    }

    saveLocalStorage(key: string, value: any) {
      return localStorage.setItem(key, JSON.stringify(value));
    }

    getLocalStorage(key: string) {
      return JSON.parse(localStorage.getItem(key));
    }

    removeLocalStorage(key: string) {
      localStorage.removeItem(key);
    }

    encrypt(value: string): string {
      try {
        return CryptoJS.AES.encrypt(value, this.secretKey).toString();
      } catch (error) {
        console.error('Encryption error:', error);
        return value;
      }
    }
  
    decrypt(value: string): string {
      try {
        const bytes = CryptoJS.AES.decrypt(value, this.secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
      } catch (error) {
        console.error('Decryption error:', error);
        return value;
      }
    }
}