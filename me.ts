import { BinarySearchTree } from '@std/data-structures/binary-search-tree';
import { Order, OrderStatus, PriceLevel, Side } from './types.ts';
import { BuyTree, SellTree, Trades } from './context.ts';

export const addOrderToBook = (order: Order, book: BinarySearchTree<PriceLevel>)=> {
    console.log("Order:", order);
    const priceLevel = { price: order.price, orders: [] };
    const priceInBook = book.find(priceLevel);
    if (priceInBook) {
        priceInBook.orders.push(order);
    } else {
        book.insert({ price: order.price, orders: [order] });
    }
    const finalPriceLevel = book.find(priceLevel);
    console.log("Final Price Level:", finalPriceLevel);
};

// recursive function to match order
const matchOrder = (order: Order, oppositeBook: BinarySearchTree<PriceLevel>): Order => {
    // Get the best matching price level
    const bestPriceLevel = order.side === Side.BUY ? oppositeBook.min() : oppositeBook.max();
    if (!bestPriceLevel) {
        return order;  // No matching price level found
    }
    // if the price does not cross, return the order
    if (order.side === Side.BUY && order.price < bestPriceLevel.price) {
        return order;
    }
    if (order.side === Side.SELL && order.price > bestPriceLevel.price) {
        return order;
    }
    let remainingQuantity = order.quantity - order.filledQuantity;
    const currentPriceOrders = [...bestPriceLevel.orders];

    // Process orders at this price level
    while (remainingQuantity > 0 && currentPriceOrders.length > 0) {
        const matchingOrder = currentPriceOrders[0];
        const matchQuantity = Math.min(
            remainingQuantity,
            matchingOrder.quantity - matchingOrder.filledQuantity
        );

        // Update filled quantities
        matchingOrder.filledQuantity += matchQuantity;
        order.filledQuantity += matchQuantity;
        remainingQuantity -= matchQuantity;

        // Record the trade
        Trades.push({
            price: bestPriceLevel.price,
            quantity: matchQuantity,
            timestamp: Date.now(),
            buyOrderId: order.side === Side.BUY ? order.id : matchingOrder.id,
            sellOrderId: order.side === Side.SELL ? order.id : matchingOrder.id,
        });
        console.log("Trades:", Trades);

        // Update order statuses
        if (matchingOrder.filledQuantity === matchingOrder.quantity) {
            matchingOrder.status = OrderStatus.FILLED;
            currentPriceOrders.shift();  // Remove filled order
        } else {
            matchingOrder.status = OrderStatus.PARTIALLY_FILLED;
        }
    }

    // Update the price level's orders
    bestPriceLevel.orders = currentPriceOrders;
    if (bestPriceLevel.orders.length === 0) {
        oppositeBook.remove({ price: bestPriceLevel.price, orders: [] });
    }

    // Update incoming order status
    if (order.filledQuantity === order.quantity) {
        order.status = OrderStatus.FILLED;
    } else if (order.filledQuantity > 0) {
        order.status = OrderStatus.PARTIALLY_FILLED;
    }

    // If order still has remaining quantity and there are more price levels,
    // continue matching
    if (remainingQuantity > 0 && oppositeBook.size > 0) {
        return matchOrder(order, oppositeBook);
    }

    return order;
};

export const processOrder = (order: Order) => {
    // First try to match the order
    const updatedOrder = matchOrder(
        order,
        order.side === Side.BUY ? SellTree : BuyTree
    );

    // If not fully filled, add remaining quantity to the order book
    if (updatedOrder.status !== OrderStatus.FILLED) {
        addOrderToBook(
            updatedOrder,
            updatedOrder.side === Side.BUY ? BuyTree : SellTree
        );
    }
};