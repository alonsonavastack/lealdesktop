import firebase from 'firebase/compat/app';
export interface User {
    uid: string | null;
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    img: string;
    points: number;
    qrCode: string;  // Nuevo campo para el QR
    createdAt: Date | firebase.firestore.Timestamp;
    updatedAt: Date | firebase.firestore.Timestamp | null;
    isActive: boolean;
    role: string;
    lastLogin: Date | firebase.firestore.Timestamp | null;
}