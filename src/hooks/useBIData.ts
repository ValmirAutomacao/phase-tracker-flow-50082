import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { biDataService } from '@/services/biDataService';
import type { ConsultaBI, ResultadoBI, CampoSelecionado } from '@/types/bi';

/**
 * Hook para gerenciar dados do BI
 */
export function useBIData() {
  const [isExecuting, setIsExecuting] = useState(false);

  /**
   * Executa uma consulta de BI
   */
  const executeQuery = useCallback(async (consulta: ConsultaBI): Promise<ResultadoBI> => {
    setIsExecuting(true);
    try {
      const resultado = await biDataService.executarConsulta(consulta);
      return resultado;
    } catch (error) {
      console.error('Erro ao executar consulta BI:', error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  /**
   * Busca opções para filtros
   */
  const { data: filterOptions, isLoading: isLoadingFilters } = useQuery({
    queryKey: ['bi-filter-options'],
    queryFn: () => biDataService.buscarOpcoesEFilters(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });

  return {
    executeQuery,
    isExecuting,
    filterOptions: filterOptions || {
      clientes: [],
      obras: [],
      funcionarios: [],
      categorias: [],
      formas_pagamento: []
    },
    isLoadingFilters
  };
}