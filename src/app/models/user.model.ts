export interface User {
    uid: string,
    name: string,
    email: string,
    password: string,
    phone: string,
    address: string,
    img: string
    createdAt?: Date;
    updatedAt?: Date;
    isActive?: boolean;
    role?: 'admin' | 'user';
    lastLogin?: Date;
}