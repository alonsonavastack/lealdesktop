export interface Sale {
    id: string;
    userId: string;
    userName: string;
    products: SaleProduct[];
    totalAmount: number;
    totalPoints: number;
    paymentMethod: 'cash' | 'card' | 'points';
    status: 'completed' | 'pending' | 'cancelled';
    createdAt: Date;
    updatedAt?: Date;
}

export interface SaleProduct {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    points: number;
    totalPoints: number;
}