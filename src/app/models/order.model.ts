export interface Order {
    id?: string;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    pointsEarned: number;
    status: 'pending' | 'completed' | 'cancelled';
    paymentMethod?: 'cash' | 'card' | 'points';
    customerName: string;
    customerId: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface OrderItem {
    productId: string;  // Changed to string to match Firebase IDs
    name: string;
    price: number;
    quantity: number;
    points: number;
    totalPoints: number;
    subtotal: number;
}