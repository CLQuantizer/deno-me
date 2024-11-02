import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const Side = {
    BUY: "BUY",
    SELL: "SELL",
} as const;

export const OrderStatus = {
    OPEN: "OPEN",
    FILLED: "FILLED",
    PARTIALLY_FILLED: "PARTIALLY_FILLED",
    CANCELLED: "CANCELLED",
} as const;

// Create a reusable decimal validator
const DecimalNumber = z.number()
    .positive()
    .transform((n) => Number(n.toFixed(2))) // This automatically handles decimal places
    .refine((n) => Number.isFinite(n), "Must be a valid number");

// Schema for creating new orders
export const NewOrderSchema = z.object({
    userId: z.string(),
    side: z.enum([Side.BUY, Side.SELL]),
    timestamp: z.number(),
    price: DecimalNumber,
    quantity: DecimalNumber,
});

// Full order schema extends new order schema with additional fields
export const OrderSchema = NewOrderSchema.extend({
    id: z.string().uuid(),
    status: z.enum([
        OrderStatus.OPEN,
        OrderStatus.FILLED,
        OrderStatus.PARTIALLY_FILLED,
        OrderStatus.CANCELLED,
    ]),
    filledQuantity: DecimalNumber.default(0),
});

export const TradeSchema = z.object({
    buyOrderId: z.string(),
    sellOrderId: z.string(),
    price: DecimalNumber,
    quantity: DecimalNumber,
    timestamp: z.number(),
});

export function formatPriceLevel(level: PriceLevel) {
    return {
        price: level.price,
        volume: level.orders.reduce((sum, order) => sum + order.quantity, 0),
        orderCount: level.orders.length,
        orders: level.orders.map(order => ({
            id: order.id,
            quantity: order.quantity,
            timestamp: order.timestamp
        }))
    };
}


export type NewOrder = z.infer<typeof NewOrderSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type PriceLevel = { price: number; orders: Order[] };
export type Trade = z.infer<typeof TradeSchema>;