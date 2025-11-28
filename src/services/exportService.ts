import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { ConfiguracaoExportacao, CampoSelecionado, ResultadoBI } from '@/types/bi';

/**
 * Serviço para exportação de relatórios em diferentes formatos
 */
export class ExportService {
  // Logo da SecEngenharia em base64 (versão simplificada)
  private logoBase64 = 'data:image/svg+xml;base64,' + btoa(`
    <svg width="120" height="40" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="40" fill="#1e40af" rx="4"/>
      <text x="60" y="16" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
        SecEngenharia
      </text>
      <text x="60" y="30" text-anchor="middle" fill="#93c5fd" font-family="Arial, sans-serif" font-size="8">
        Gestão Empresarial
      </text>
    </svg>
  `);

  /**
   * Configura logo da empresa para usar nas exportações
   */
  setLogo(logoBase64: string): void {
    this.logoBase64 = logoBase64;
  }

  /**
   * Exporta dados para Excel (.xlsx) - COMPLETAMENTE REFORMULADO
   */
  async exportarParaExcel(
    dados: Record<string, any>[],
    camposSelecionados: CampoSelecionado[],
    configuracao: ConfiguracaoExportacao,
    nomeRelatorio: string,
    filtros?: Record<string, any>,
    totais?: Record<string, number>
  ): Promise<void> {
    try {
      // Criar workbook
      const wb = XLSX.utils.book_new();

      let currentRow = 1;
      const worksheetData: any[][] = [];

      // 1. CABEÇALHO DA EMPRESA
      worksheetData.push(['SECENGENHARIA - Sistema de Gestão Empresarial']);
      worksheetData.push(['']); // linha vazia
      worksheetData.push([`Relatório: ${nomeRelatorio}`]);
      worksheetData.push([`Gerado em: ${new Date().toLocaleString('pt-BR')}`]);
      worksheetData.push(['']); // linha vazia
      currentRow = 6;

      // 2. CABEÇALHOS DAS COLUNAS (igual ao DataTable)
      const headers = camposSelecionados.map(campo => campo.alias || campo.campo);
      worksheetData.push(headers);
      currentRow = 7;

      // 3. DADOS (estrutura idêntica ao DataTable)
      dados.forEach(row => {
        const dataRow = camposSelecionados.map(campo => {
          const valor = row[campo.campo];
          return this.formatarValor(valor, campo.tipo);
        });
        worksheetData.push(dataRow);
      });
      currentRow += dados.length;

      // 4. TOTAIS (se existirem)
      if (totais && Object.keys(totais).length > 0) {
        worksheetData.push(['']); // linha vazia
        worksheetData.push(['TOTAIS:']);

        Object.entries(totais).forEach(([campo, valor]) => {
          const campoInfo = camposSelecionados.find(c => c.campo === campo);
          const label = campoInfo?.alias || campo;
          const valorFormatado = campoInfo?.tipo === 'currency'
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
            : valor.toLocaleString('pt-BR');

          worksheetData.push([label, valorFormatado]);
        });
      }

      // Criar worksheet com todos os dados
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);

      // Configurar larguras das colunas
      const colWidths = headers.map(header => ({
        wch: Math.max(header.length, 15)
      }));
      ws['!cols'] = colWidths;

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

      // Gerar arquivo e fazer download
      const nomeArquivo = this.gerarNomeArquivo(nomeRelatorio, 'xlsx');
      XLSX.writeFile(wb, nomeArquivo);

    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      throw new Error('Falha na exportação para Excel');
    }
  }

  /**
   * Exporta dados para PDF
   */
  async exportarParaPDF(
    dados: Record<string, any>[],
    camposSelecionados: CampoSelecionado[],
    configuracao: ConfiguracaoExportacao,
    nomeRelatorio: string,
    filtros?: Record<string, any>,
    totais?: Record<string, number>
  ): Promise<void> {
    try {
      // Criar documento PDF
      const pdf = new jsPDF({
        orientation: configuracao.orientacao_pdf || 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      let yPosition = 20;

      // Cabeçalho da empresa (logo em texto)
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('SecEngenharia', 20, yPosition);
      yPosition += 6;

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text('Sistema de Gestão Empresarial', 20, yPosition);
      yPosition += 15;

      // Título do relatório
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(configuracao.titulo_personalizado || nomeRelatorio, 20, yPosition);
      yPosition += 10;

      // Informações de filtros apenas se habilitado
      if (configuracao.incluir_filtros && filtros) {
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');

        const filtrosTexto = this.formatarFiltrosParaPDF(filtros);
        filtrosTexto.forEach(linha => {
          pdf.text(linha, 20, yPosition);
          yPosition += 4;
        });
        yPosition += 5;
      }

      // Data de geração
      pdf.setFontSize(8);
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, yPosition);
      yPosition += 10;

      // Preparar dados da tabela
      const dadosTabela = this.formatarDadosParaPDF(dados, camposSelecionados);

      // Criar tabela
      (pdf as any).autoTable({
        head: [camposSelecionados.map(campo => campo.alias || campo.campo)],
        body: dadosTabela,
        startY: yPosition,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 20, right: 20 }
      });

      // Sempre adicionar totais se existirem
      if (totais && Object.keys(totais).length > 0) {
        const finalY = (pdf as any).lastAutoTable.finalY + 10;

        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.text('Totais do Relatório:', 20, finalY);

        let yTotais = finalY + 6;
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');

        Object.entries(totais).forEach(([campo, valor]) => {
          const campoInfo = camposSelecionados.find(c => c.campo === campo);
          const label = campoInfo?.alias || campo;
          const valorFormatado = campoInfo?.tipo === 'currency'
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
            : valor.toLocaleString('pt-BR');

          pdf.text(`${label}: ${valorFormatado}`, 25, yTotais);
          yTotais += 5;
        });
      }

      // Salvar arquivo
      const nomeArquivo = this.gerarNomeArquivo(nomeRelatorio, 'pdf');
      pdf.save(nomeArquivo);

    } catch (error) {
      console.error('Erro ao exportar para PDF:', error);
      throw new Error('Falha na exportação para PDF');
    }
  }

  /**
   * Exporta dados para CSV
   */
  async exportarParaCSV(
    dados: Record<string, any>[],
    camposSelecionados: CampoSelecionado[],
    nomeRelatorio: string
  ): Promise<void> {
    try {
      // Criar cabeçalho CSV
      const cabecalho = camposSelecionados.map(campo => campo.alias || campo.campo);

      // Criar linhas de dados - CORRIGIDO
      const linhas = dados.map(row =>
        camposSelecionados.map(campo => {
          // Usar o nome do campo direto, igual ao DataTable
          const valor = row[campo.campo];
          return this.formatarValorParaCSV(valor, campo.tipo);
        })
      );

      // Combinar cabeçalho e dados
      const csvData = [cabecalho, ...linhas];

      // Converter para string CSV
      const csvString = csvData
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
        .join('\n');

      // Criar blob e fazer download
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = this.gerarNomeArquivo(nomeRelatorio, 'csv');
      link.click();

      // Limpar URL
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error('Erro ao exportar para CSV:', error);
      throw new Error('Falha na exportação para CSV');
    }
  }

  // FUNÇÃO REMOVIDA - formatarDadosParaExcel
  // Agora usa estrutura aoa_to_sheet diretamente

  /**
   * Formata dados para PDF - CORRIGIDO
   */
  private formatarDadosParaPDF(
    dados: Record<string, any>[],
    camposSelecionados: CampoSelecionado[]
  ): any[][] {
    return dados.map(row =>
      camposSelecionados.map(campo => {
        // Usar o nome do campo direto, igual ao DataTable
        const valor = row[campo.campo];
        return this.formatarValor(valor, campo.tipo);
      })
    );
  }

  /**
   * Formata um valor baseado no tipo
   */
  private formatarValor(valor: any, tipo: string): string {
    if (valor === null || valor === undefined) {
      return '';
    }

    switch (tipo) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(Number(valor) || 0);

      case 'date':
        try {
          return new Date(valor).toLocaleDateString('pt-BR');
        } catch {
          return valor.toString();
        }

      case 'boolean':
        return valor ? 'Sim' : 'Não';

      case 'number':
        return Number(valor).toLocaleString('pt-BR');

      default:
        return valor.toString();
    }
  }

  /**
   * Formata valor para CSV
   */
  private formatarValorParaCSV(valor: any, tipo: string): string {
    if (valor === null || valor === undefined) {
      return '';
    }

    switch (tipo) {
      case 'currency':
        // Para CSV, usar formato numérico simples
        return (Number(valor) || 0).toFixed(2).replace('.', ',');

      case 'date':
        try {
          return new Date(valor).toLocaleDateString('pt-BR');
        } catch {
          return valor.toString();
        }

      case 'boolean':
        return valor ? 'Sim' : 'Não';

      case 'number':
        return (Number(valor) || 0).toString().replace('.', ',');

      default:
        return valor.toString();
    }
  }

  // FUNÇÕES REMOVIDAS - criarLinhasInfo e criarLinhasTotais
  // Agora a estrutura é criada diretamente no exportarParaExcel

  /**
   * Formata filtros para PDF
   */
  private formatarFiltrosParaPDF(filtros: Record<string, any>): string[] {
    const linhas: string[] = [];

    if (filtros.data_inicio && filtros.data_fim) {
      linhas.push(`Período: ${filtros.data_inicio} até ${filtros.data_fim}`);
    }

    if (filtros.cliente_id) {
      linhas.push(`Cliente: ${filtros.cliente_id}`);
    }

    if (filtros.obra_id) {
      linhas.push(`Obra: ${filtros.obra_id}`);
    }

    if (filtros.categoria) {
      linhas.push(`Categoria: ${filtros.categoria}`);
    }

    if (filtros.status) {
      linhas.push(`Status: ${filtros.status}`);
    }

    return linhas;
  }

  /**
   * Gera nome do arquivo com timestamp
   */
  private gerarNomeArquivo(nomeRelatorio: string, extensao: string): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const nomeFormatado = nomeRelatorio
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    return `${nomeFormatado}_${timestamp}.${extensao}`;
  }
}

// Instância singleton do serviço
export const exportService = new ExportService();