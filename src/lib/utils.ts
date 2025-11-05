import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrencyInput(value: string): string {
  const numericValue = value.replace(/\D/g, '');
  const numericValueWithDecimal = parseFloat(numericValue) / 100;

  if (isNaN(numericValueWithDecimal) || numericValueWithDecimal === 0) {
    return 'R$ 0,00';
  }

  return formatCurrency(numericValueWithDecimal);
}

export function parseCurrencyInput(value: string): number {
  // Remove tudo exceto números
  const numericValue = value.replace(/\D/g, '');
  
  if (!numericValue || numericValue === '0') return 0;
  
  // Converte centavos para valor decimal
  return parseFloat(numericValue) / 100;
}

export function currencyMask(value: string): string {
  // Remove tudo exceto números
  const numericValue = value.replace(/\D/g, '');

  if (numericValue === '' || numericValue === '0') return 'R$ 0,00';

  // Converte para número decimal (centavos)
  const numValue = parseFloat(numericValue) / 100;

  // Formata usando Intl
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}
