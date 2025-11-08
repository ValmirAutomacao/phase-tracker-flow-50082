import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined): string {
  // Converter para número se necessário
  let numValue: number = 0;

  if (value === null || value === undefined) {
    numValue = 0;
  } else if (typeof value === 'number') {
    numValue = isNaN(value) ? 0 : value;
  } else if (typeof value === 'string') {
    // Parse string sem chamar parseCurrencyInput para evitar dependência circular
    if (value.includes('R$') || value.includes(',')) {
      let cleanValue = value.replace(/R\$|\s/g, '').replace(/\./g, '');
      cleanValue = cleanValue.replace(',', '.');
      numValue = parseFloat(cleanValue) || 0;
    } else {
      numValue = parseFloat(value) || 0;
    }
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

export function formatCurrencyInput(value: string): string {
  const numericValue = value.replace(/\D/g, '');
  const numericValueWithDecimal = parseFloat(numericValue) / 100;

  if (isNaN(numericValueWithDecimal) || numericValueWithDecimal === 0) {
    return 'R$ 0,00';
  }

  return formatCurrency(numericValueWithDecimal);
}

export function parseCurrencyInput(value: string | number): number {
  // Se já é um número, retorna diretamente
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }

  // Se é string vazia ou nula, retorna 0
  if (!value || value === '') return 0;

  // Se já está em formato numérico (ex: "123.45")
  if (value.includes('.') && !value.includes(',')) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Se está em formato monetário brasileiro (ex: "R$ 1.234,56")
  if (value.includes('R$') || value.includes(',')) {
    // Remove R$, espaços e pontos de milhares
    let cleanValue = value.replace(/R\$|\s/g, '').replace(/\./g, '');
    // Troca vírgula por ponto decimal
    cleanValue = cleanValue.replace(',', '.');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Remove tudo exceto números
  const numericValue = value.replace(/\D/g, '');

  if (!numericValue || numericValue === '0') return 0;

  // Converte centavos para valor decimal
  const result = parseFloat(numericValue) / 100;
  return isNaN(result) ? 0 : result;
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
