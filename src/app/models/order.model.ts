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
    productId: number;  // Changed to number to match Product.id
    name: string;
    price: number;
    quantity: number;
    points: number;
    totalPoints: number;
    subtotal: number;
}