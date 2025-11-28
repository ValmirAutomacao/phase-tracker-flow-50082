import { useMemo } from 'react';

/**
 * Hook para aplicar máscaras de formatação em campos de input
 */
export const useMascaras = () => {

  /**
   * Formatar número de cartão de crédito
   * Formato: 0000 0000 0000 0000
   */
  const formatarCartao = (valor: string): string => {
    // Remove todos os caracteres não numéricos
    const apenasNumeros = valor.replace(/\D/g, '');

    // Limita a 16 dígitos
    const numeroLimitado = apenasNumeros.slice(0, 16);

    // Aplica a formatação em grupos de 4 dígitos
    return numeroLimitado.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  /**
   * Formatar data de vencimento do cartão
   * Formato: MM/AA
   */
  const formatarVencimentoCartao = (valor: string): string => {
    // Remove todos os caracteres não numéricos
    const apenasNumeros = valor.replace(/\D/g, '');

    // Limita a 4 dígitos (MMAA)
    const numeroLimitado = apenasNumeros.slice(0, 4);

    // Aplica formatação MM/AA
    if (numeroLimitado.length >= 3) {
      return numeroLimitado.slice(0, 2) + '/' + numeroLimitado.slice(2);
    }

    return numeroLimitado;
  };

  /**
   * Formatar CPF
   * Formato: 000.000.000-00
   */
  const formatarCPF = (valor: string): string => {
    const apenasNumeros = valor.replace(/\D/g, '');
    const numeroLimitado = apenasNumeros.slice(0, 11);

    return numeroLimitado
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  };

  /**
   * Formatar CNPJ
   * Formato: 00.000.000/0000-00
   */
  const formatarCNPJ = (valor: string): string => {
    const apenasNumeros = valor.replace(/\D/g, '');
    const numeroLimitado = apenasNumeros.slice(0, 14);

    return numeroLimitado
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2');
  };

  /**
   * Formatar telefone
   * Formato: (00) 00000-0000 ou (00) 0000-0000
   */
  const formatarTelefone = (valor: string): string => {
    const apenasNumeros = valor.replace(/\D/g, '');
    const numeroLimitado = apenasNumeros.slice(0, 11);

    if (numeroLimitado.length <= 10) {
      // Telefone fixo: (00) 0000-0000
      return numeroLimitado
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      // Celular: (00) 00000-0000
      return numeroLimitado
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
  };

  /**
   * Formatar CEP
   * Formato: 00000-000
   */
  const formatarCEP = (valor: string): string => {
    const apenasNumeros = valor.replace(/\D/g, '');
    const numeroLimitado = apenasNumeros.slice(0, 8);

    return numeroLimitado.replace(/(\d{5})(\d)/, '$1-$2');
  };

  /**
   * Formatar moeda brasileira
   * Formato: R$ 0.000,00
   */
  const formatarMoeda = (valor: string): string => {
    // Remove tudo que não é dígito
    const apenasNumeros = valor.replace(/\D/g, '');

    // Converte para centavos
    const valorEmCentavos = parseInt(apenasNumeros) / 100;

    // Aplica formatação brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valorEmCentavos);
  };

  /**
   * Detectar e formatar automaticamente documento (CPF ou CNPJ)
   */
  const formatarDocumento = (valor: string): string => {
    const apenasNumeros = valor.replace(/\D/g, '');

    if (apenasNumeros.length <= 11) {
      return formatarCPF(valor);
    } else {
      return formatarCNPJ(valor);
    }
  };

  /**
   * Validar número de cartão usando algoritmo de Luhn
   */
  const validarCartao = (numero: string): boolean => {
    const numeroLimpo = numero.replace(/\s/g, '');

    if (!/^\d+$/.test(numeroLimpo) || numeroLimpo.length < 13 || numeroLimpo.length > 19) {
      return false;
    }

    // Algoritmo de Luhn
    let soma = 0;
    let alternar = false;

    for (let i = numeroLimpo.length - 1; i >= 0; i--) {
      let digito = parseInt(numeroLimpo.charAt(i));

      if (alternar) {
        digito *= 2;
        if (digito > 9) {
          digito -= 9;
        }
      }

      soma += digito;
      alternar = !alternar;
    }

    return soma % 10 === 0;
  };

  /**
   * Detectar bandeira do cartão baseado no número
   */
  const detectarBandeiraCartao = (numero: string): string => {
    const numeroLimpo = numero.replace(/\s/g, '');

    if (/^4/.test(numeroLimpo)) return 'visa';
    if (/^5[1-5]/.test(numeroLimpo)) return 'mastercard';
    if (/^3[47]/.test(numeroLimpo)) return 'amex';
    if (/^6011|^644[0-9]|^65/.test(numeroLimpo)) return 'discover';
    if (/^636368|^438935|^504175|^451416|^636297/.test(numeroLimpo)) return 'elo';
    if (/^606282/.test(numeroLimpo)) return 'hipercard';

    return 'outros';
  };

  return useMemo(() => ({
    formatarCartao,
    formatarVencimentoCartao,
    formatarCPF,
    formatarCNPJ,
    formatarTelefone,
    formatarCEP,
    formatarMoeda,
    formatarDocumento,
    validarCartao,
    detectarBandeiraCartao
  }), []);
};