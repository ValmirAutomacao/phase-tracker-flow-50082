import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatCurrencyInput(value: string): string {
  const numericValue = value.replace(/\D/g, '');
  const numericValueWithDecimal = parseFloat(numericValue) / 100;

  if (isNaN(numericValueWithDecimal) || numericValueWithDecimal === 0) {
    return '';
  }

  return formatCurrency(numericValueWithDecimal);
}

export function parseCurrencyInput(value: string): number {
  const numericValue = value.replace(/\D/g, '');
  return parseFloat(numericValue) / 100;
}

export function currencyMask(value: string): string {
  const numericValue = value.replace(/\D/g, '');

  if (numericValue === '') return '';

  const length = numericValue.length;

  if (length <= 2) {
    return `R$ 0,${numericValue.padStart(2, '0')}`;
  }

  const cents = numericValue.slice(-2);
  const reais = numericValue.slice(0, -2);

  const formattedReais = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `R$ ${formattedReais},${cents}`;
}
