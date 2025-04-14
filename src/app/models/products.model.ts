export class Product {
    constructor(
        public id: number,
        public name: string,
        public price: number,
        public image: string,
        public description: string,
        public category: string,
        public quantity: number,
        public points: number,
        public pointsMultiplier: number = 1,
        public minPurchaseForPoints: number = 1,
        public maxPointsPerPurchase?: number,
        public isPointsProduct: boolean = false,
        public pointsCost?: number,
        public createdAt: Date = new Date(),
        public updatedAt?: Date,
        public isActive: boolean = true
    ) {}

    calculatePoints(quantity: number): number {
        if (!this.isPointsProduct && quantity >= this.minPurchaseForPoints) {
            const basePoints = this.points * quantity * this.pointsMultiplier;
            return this.maxPointsPerPurchase 
                ? Math.min(basePoints, this.maxPointsPerPurchase) 
                : basePoints;
        }
        return 0;
    }

    canPurchaseWithPoints(): boolean {
        return this.isPointsProduct && this.pointsCost !== undefined && this.pointsCost > 0;
    }
}