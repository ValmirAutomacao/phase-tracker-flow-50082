import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import type { FiltrosPadrao } from '@/types/bi';

/**
 * Hook para gerenciar filtros do BI
 */
export function useBIFilters(filtrosIniciais?: FiltrosPadrao) {
  // Estado dos filtros
  const [filtros, setFiltros] = useState<Record<string, any>>(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      data_inicio: format(firstDayOfMonth, 'yyyy-MM-dd'),
      data_fim: format(today, 'yyyy-MM-dd'),
      cliente_id: '',
      obra_id: '',
      categoria: '',
      forma_pagamento: '',
      status: '',
      funcionario_id: '',
      ...filtrosIniciais
    };
  });

  /**
   * Atualiza um filtro específico
   */
  const updateFilter = useCallback((key: string, value: any) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * Atualiza múltiplos filtros
   */
  const updateFilters = useCallback((newFilters: Record<string, any>) => {
    setFiltros(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  /**
   * Reseta todos os filtros para valores padrão
   */
  const resetFilters = useCallback(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    setFiltros({
      data_inicio: format(firstDayOfMonth, 'yyyy-MM-dd'),
      data_fim: format(today, 'yyyy-MM-dd'),
      cliente_id: '',
      obra_id: '',
      categoria: '',
      forma_pagamento: '',
      status: '',
      funcionario_id: '',
      ...filtrosIniciais
    });
  }, [filtrosIniciais]);

  /**
   * Valida se os filtros obrigatórios estão preenchidos
   */
  const validateFilters = useCallback(() => {
    const errors: string[] = [];

    if (!filtros.data_inicio) {
      errors.push('Data de início é obrigatória');
    }

    if (!filtros.data_fim) {
      errors.push('Data de fim é obrigatória');
    }

    if (filtros.data_inicio && filtros.data_fim && filtros.data_inicio > filtros.data_fim) {
      errors.push('Data de início deve ser anterior à data de fim');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [filtros]);

  /**
   * Obtém apenas os filtros que têm valor (não vazios)
   */
  const getActiveFilters = useCallback(() => {
    return Object.entries(filtros).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  }, [filtros]);

  /**
   * Formata filtros para exibição
   */
  const getFormattedFilters = useCallback(() => {
    const activeFilters = getActiveFilters();
    const formatted: Record<string, string> = {};

    Object.entries(activeFilters).forEach(([key, value]) => {
      switch (key) {
        case 'data_inicio':
          formatted['Período início'] = new Date(value).toLocaleDateString('pt-BR');
          break;
        case 'data_fim':
          formatted['Período fim'] = new Date(value).toLocaleDateString('pt-BR');
          break;
        case 'cliente_id':
          formatted['Cliente'] = value; // Seria substituído pelo nome do cliente
          break;
        case 'obra_id':
          formatted['Obra'] = value; // Seria substituído pelo nome da obra
          break;
        case 'categoria':
          formatted['Categoria'] = value;
          break;
        case 'forma_pagamento':
          formatted['Forma de Pagamento'] = value;
          break;
        case 'status':
          formatted['Status'] = value;
          break;
        case 'funcionario_id':
          formatted['Funcionário'] = value; // Seria substituído pelo nome do funcionário
          break;
        default:
          formatted[key] = value;
      }
    });

    return formatted;
  }, [getActiveFilters]);

  /**
   * Aplica filtros padrão do relatório salvo
   */
  useEffect(() => {
    if (filtrosIniciais && Object.keys(filtrosIniciais).length > 0) {
      setFiltros(prev => ({
        ...prev,
        ...filtrosIniciais
      }));
    }
  }, [filtrosIniciais]);

  /**
   * Obtém preset de filtros comuns
   */
  const getFilterPresets = useCallback(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      'Este mês': {
        data_inicio: format(firstDayOfMonth, 'yyyy-MM-dd'),
        data_fim: format(today, 'yyyy-MM-dd')
      },
      'Este ano': {
        data_inicio: format(firstDayOfYear, 'yyyy-MM-dd'),
        data_fim: format(today, 'yyyy-MM-dd')
      },
      'Últimos 30 dias': {
        data_inicio: format(thirtyDaysAgo, 'yyyy-MM-dd'),
        data_fim: format(today, 'yyyy-MM-dd')
      },
      'Últimos 7 dias': {
        data_inicio: format(sevenDaysAgo, 'yyyy-MM-dd'),
        data_fim: format(today, 'yyyy-MM-dd')
      },
      'Hoje': {
        data_inicio: format(today, 'yyyy-MM-dd'),
        data_fim: format(today, 'yyyy-MM-dd')
      }
    };
  }, []);

  /**
   * Aplica um preset de filtro
   */
  const applyPreset = useCallback((presetName: string) => {
    const presets = getFilterPresets();
    const preset = presets[presetName as keyof typeof presets];

    if (preset) {
      updateFilters(preset);
    }
  }, [getFilterPresets, updateFilters]);

  return {
    filtros,
    updateFilter,
    updateFilters,
    resetFilters,
    validateFilters,
    getActiveFilters,
    getFormattedFilters,
    getFilterPresets,
    applyPreset
  };
}