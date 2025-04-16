import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { provideHotToastConfig } from '@ngxpert/hot-toast';
import { provideAnimations } from '@angular/platform-browser/animations';

export const firebaseConfig = {
  apiKey: "AIzaSyA-9Y0tFmUUssVZD-DcJPzaRnK7FeBXCSU",
  authDomain: "crud-8aac1.firebaseapp.com",
  databaseURL: "https://crud-8aac1-default-rtdb.firebaseio.com",
  projectId: "crud-8aac1",
  storageBucket: "crud-8aac1.firebasestorage.app",
  messagingSenderId: "1005700363088",
  appId: "1:1005700363088:web:4b421d999a50ed2c827255",
  measurementId: "G-R6KW9J9DZQ"
};

initializeApp(firebaseConfig)

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withHashLocation()),
    provideAnimations(),
    provideHttpClient(),
    importProvidersFrom(
      AngularFireModule.initializeApp(firebaseConfig),
      AngularFirestoreModule
    ), 
    provideHotToastConfig(),
    
  ]
};
