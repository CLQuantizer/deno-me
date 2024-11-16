import { BinarySearchTree } from '@std/data-structures/binary-search-tree';
import {PriceLevel, Trade} from "./types.ts";

export const BuyTree = new BinarySearchTree((a:PriceLevel, b) => a.price - b.price);
export const SellTree = new BinarySearchTree((a:PriceLevel, b) => a.price - b.price);

export const Trades: Trade[] = [];
