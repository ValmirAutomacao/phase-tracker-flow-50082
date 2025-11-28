import { useState, useCallback } from 'react';
import { exportService } from '@/services/exportService';
import { useToast } from '@/hooks/use-toast';
import type { ConfiguracaoExportacao, CampoSelecionado } from '@/types/bi';

/**
 * Hook para gerenciar exportações do BI
 */
export function useBIExport() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  /**
   * Exporta dados para Excel
   */
  const exportToExcel = useCallback(async (
    dados: Record<string, any>[],
    camposSelecionados: CampoSelecionado[],
    nomeRelatorio: string,
    configuracao: Partial<ConfiguracaoExportacao> = {},
    filtros?: Record<string, any>,
    totais?: Record<string, number>
  ) => {
    if (dados.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Execute a consulta primeiro para gerar dados.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting('xlsx');
    try {
      const config: ConfiguracaoExportacao = {
        formato: 'xlsx',
        incluir_logo: true,
        incluir_filtros: true,
        incluir_totais: true,
        ...configuracao
      };

      await exportService.exportarParaExcel(
        dados,
        camposSelecionados,
        config,
        nomeRelatorio,
        filtros,
        totais
      );

      toast({
        title: "Exportação Excel concluída!",
        description: "O arquivo foi baixado com sucesso.",
      });
    } catch (error) {
      console.error('Erro na exportação Excel:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar para Excel.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  }, [toast]);

  /**
   * Exporta dados para PDF
   */
  const exportToPDF = useCallback(async (
    dados: Record<string, any>[],
    camposSelecionados: CampoSelecionado[],
    nomeRelatorio: string,
    configuracao: Partial<ConfiguracaoExportacao> = {},
    filtros?: Record<string, any>,
    totais?: Record<string, number>
  ) => {
    if (dados.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Execute a consulta primeiro para gerar dados.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting('pdf');
    try {
      const config: ConfiguracaoExportacao = {
        formato: 'pdf',
        incluir_logo: true,
        incluir_filtros: true,
        incluir_totais: true,
        orientacao_pdf: 'landscape',
        ...configuracao
      };

      await exportService.exportarParaPDF(
        dados,
        camposSelecionados,
        config,
        nomeRelatorio,
        filtros,
        totais
      );

      toast({
        title: "Exportação PDF concluída!",
        description: "O arquivo foi baixado com sucesso.",
      });
    } catch (error) {
      console.error('Erro na exportação PDF:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar para PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  }, [toast]);

  /**
   * Exporta dados para CSV
   */
  const exportToCSV = useCallback(async (
    dados: Record<string, any>[],
    camposSelecionados: CampoSelecionado[],
    nomeRelatorio: string
  ) => {
    if (dados.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Execute a consulta primeiro para gerar dados.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting('csv');
    try {
      await exportService.exportarParaCSV(dados, camposSelecionados, nomeRelatorio);

      toast({
        title: "Exportação CSV concluída!",
        description: "O arquivo foi baixado com sucesso.",
      });
    } catch (error) {
      console.error('Erro na exportação CSV:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar para CSV.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  }, [toast]);

  /**
   * Imprime relatório
   */
  const printReport = useCallback(() => {
    try {
      window.print();
      toast({
        title: "Enviado para impressão",
        description: "O relatório foi enviado para a impressora.",
      });
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast({
        title: "Erro na impressão",
        description: "Não foi possível enviar para impressão.",
        variant: "destructive",
      });
    }
  }, [toast]);

  /**
   * Configura logo da empresa para exportações
   */
  const setCompanyLogo = useCallback((logoBase64: string) => {
    exportService.setLogo(logoBase64);
  }, []);

  return {
    exportToExcel,
    exportToPDF,
    exportToCSV,
    printReport,
    setCompanyLogo,
    isExporting
  };
}