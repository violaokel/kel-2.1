/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  expiryDate: string; // YYYY-MM-DD
  supplier: string;
  location: string;
  wastage: number; // Accrued waste quantity
  image?: string;
}

export type MealType = 'matutino' | 'almoco' | 'vespertino' | 'noturno';

export interface MenuIngredient {
  productId: string;
  name: string;
  quantityPerPortion: number; // e.g. 0.05 kg (50g) of rice per portion
  unit: string;
}

export interface SchoolMenu {
  id: string;
  name: string;
  mealType: MealType;
  date: string; // YYYY-MM-DD
  ingredients: MenuIngredient[];
  portionsCount: number; // e.g. 120 students
  served: boolean; // has it been deducted from inventory?
}

export interface StockTransaction {
  id: string;
  productId: string;
  productName: string;
  type: 'entrada' | 'saida' | 'desperdicio';
  quantity: number;
  unit: string;
  date: string; // ISO string
  user: string;
  notes: string;
}

export interface UserProfile {
  username: string;
  role: 'Administrador' | 'Chefe de Almoxarifado' | 'Coordenadora da Merenda Escolar' | 'Nutricionista';
  name: string;
}

export interface UserAccount {
  id: string;
  username: string;
  role: 'Administrador' | 'Chefe de Almoxarifado' | 'Coordenadora da Merenda Escolar' | 'Nutricionista';
  name: string;
  password?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncedAt: string;
}
