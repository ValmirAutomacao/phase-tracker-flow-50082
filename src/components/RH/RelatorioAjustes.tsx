// 🤖 CLAUDE-NOTE: Componente para geração de relatórios de ajustes em PDF/CSV
// 📅 Criado em: 2024-11-29
// 🎯 Propósito: Exportar relatórios detalhados para auditoria e conformidade legal
// ⚠️ IMPORTANTE: Formatação adequada para fiscalizações trabalhistas
// 🔗 Usado por: ModalHistoricoAjustes.tsx, ControlePonto.tsx

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  Download,
  Calendar,
  Users,
  Filter,
  Settings
} from "lucide-react";
import {
  AjustePonto,
  Afastamento,
  FuncionarioCompleto
} from "@/types/ponto";

interface RelatorioAjustesProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  funcionarios: FuncionarioCompleto[];
  ajustes: AjustePonto[];
  afastamentos: Afastamento[];
}

interface ConfiguracaoRelatorio {
  formato: 'pdf' | 'csv';
  periodo_inicio: string;
  periodo_fim: string;
  funcionarios_selecionados: string[];
  incluir_ajustes: boolean;
  incluir_afastamentos: boolean;
  incluir_justificativas: boolean;
  incluir_documentos: boolean;
  agrupar_por: 'funcionario' | 'data' | 'tipo';
}

export function RelatorioAjustes({
  isOpen,
  onOpenChange,
  funcionarios,
  ajustes,
  afastamentos,
}: RelatorioAjustesProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<ConfiguracaoRelatorio>({
    formato: 'pdf',
    periodo_inicio: '',
    periodo_fim: '',
    funcionarios_selecionados: [],
    incluir_ajustes: true,
    incluir_afastamentos: true,
    incluir_justificativas: true,
    incluir_documentos: false,
    agrupar_por: 'data',
  });

  const handleConfigChange = <K extends keyof ConfiguracaoRelatorio>(
    campo: K,
    valor: ConfiguracaoRelatorio[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleFuncionarioToggle = (funcionarioId: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      funcionarios_selecionados: checked
        ? [...prev.funcionarios_selecionados, funcionarioId]
        : prev.funcionarios_selecionados.filter(id => id !== funcionarioId)
    }));
  };

  const selecionarTodosFuncionarios = (selecionar: boolean) => {
    setConfig(prev => ({
      ...prev,
      funcionarios_selecionados: selecionar ? funcionarios.map(f => f.id) : []
    }));
  };

  const gerarRelatorio = async () => {
    setIsGenerating(true);
    try {
      console.log("Gerando relatório com configuração:", config);

      // Buscar dados do banco baseado na configuração
      const dadosRelatorio = await buscarDadosRelatorio();

      if (config.formato === 'pdf') {
        await gerarRelatorioPDF(dadosRelatorio);
      } else {
        await gerarRelatorioCSV(dadosRelatorio);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const buscarDadosRelatorio = async () => {
    try {
      // Construir filtros SQL
      const whereConditions: string[] = [];

      if (config.funcionarios_selecionados.length > 0) {
        const funcionariosList = config.funcionarios_selecionados.map(id => `'${id}'`).join(',');
        whereConditions.push(`funcionario_id IN (${funcionariosList})`);
      }

      if (config.periodo_inicio) {
        whereConditions.push(`(data_ajuste >= '${config.periodo_inicio}' OR data_inicio >= '${config.periodo_inicio}')`);
      }

      if (config.periodo_fim) {
        whereConditions.push(`(data_ajuste <= '${config.periodo_fim}' OR data_fim <= '${config.periodo_fim}')`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const queries: string[] = [];
      const dados: any = { ajustes: [], afastamentos: [] };

      // Buscar ajustes se solicitado
      if (config.incluir_ajustes) {
        const ajustesQuery = `
          SELECT
            a.*,
            f.nome as funcionario_nome,
            fc.nome as funcao_nome,
            s.nome as setor_nome
          FROM ajustes_ponto a
          LEFT JOIN funcionarios f ON a.funcionario_id = f.id
          LEFT JOIN funcoes fc ON f.funcao_id = fc.id
          LEFT JOIN setores s ON fc.setor_id = s.id
          ${whereClause.replace(/data_inicio|data_fim/g, 'data_ajuste')}
          ORDER BY
            CASE
              WHEN '${config.agrupar_por}' = 'funcionario' THEN f.nome
              WHEN '${config.agrupar_por}' = 'data' THEN a.data_ajuste::text
              WHEN '${config.agrupar_por}' = 'tipo' THEN a.tipo_ajuste
              ELSE a.data_ajuste::text
            END,
            a.data_ajuste DESC, a.created_at DESC
        `;

        const ajustesResult = await (globalThis as any).mcp__supabase__execute_sql({ query: ajustesQuery });
        dados.ajustes = ajustesResult || [];
      }

      // Buscar afastamentos se solicitado
      if (config.incluir_afastamentos) {
        const afastamentosQuery = `
          SELECT
            a.*,
            f.nome as funcionario_nome,
            fc.nome as funcao_nome,
            s.nome as setor_nome
          FROM afastamentos a
          LEFT JOIN funcionarios f ON a.funcionario_id = f.id
          LEFT JOIN funcoes fc ON f.funcao_id = fc.id
          LEFT JOIN setores s ON fc.setor_id = s.id
          ${whereClause.replace(/data_ajuste/g, 'data_inicio')}
          AND a.ativo = true
          ORDER BY
            CASE
              WHEN '${config.agrupar_por}' = 'funcionario' THEN f.nome
              WHEN '${config.agrupar_por}' = 'data' THEN a.data_inicio::text
              WHEN '${config.agrupar_por}' = 'tipo' THEN a.tipo_afastamento
              ELSE a.data_inicio::text
            END,
            a.data_inicio DESC, a.created_at DESC
        `;

        const afastamentosResult = await (globalThis as any).mcp__supabase__execute_sql({ query: afastamentosQuery });
        dados.afastamentos = afastamentosResult || [];
      }

      return dados;

    } catch (error) {
      console.error("Erro ao buscar dados para relatório:", error);
      throw new Error("Falha ao carregar dados do relatório");
    }
  };

  const gerarRelatorioPDF = async (dadosRelatorio: any) => {
    console.log("Gerando PDF...");

    // Preparar dados para HTML/PDF
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const periodoTexto = config.periodo_inicio && config.periodo_fim
      ? `${new Date(config.periodo_inicio).toLocaleDateString('pt-BR')} a ${new Date(config.periodo_fim).toLocaleDateString('pt-BR')}`
      : 'Período completo';

    // Estatísticas
    const totalAjustes = dadosRelatorio.ajustes.length;
    const totalAfastamentos = dadosRelatorio.afastamentos.length;
    const funcionariosUnicos = new Set([
      ...dadosRelatorio.ajustes.map((a: any) => a.funcionario_id),
      ...dadosRelatorio.afastamentos.map((a: any) => a.funcionario_id)
    ]).size;

    // Gerar HTML do relatório
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório de Ajustes e Afastamentos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #6b7280; }
            .info-section { margin-bottom: 30px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-box { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 32px; font-weight: bold; color: #3b82f6; }
            .stat-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
            .section-title { font-size: 18px; font-weight: bold; color: #1f2937; margin: 30px 0 15px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            .data-table th, .data-table td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            .data-table th { background: #f3f4f6; font-weight: bold; }
            .group-header { background: #e5e7eb; font-weight: bold; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #d1d5db; font-size: 12px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Relatório de Ajustes de Ponto e Afastamentos</div>
            <div class="subtitle">Sistema de Controle de Ponto - EngFlow</div>
          </div>

          <div class="info-section">
            <div class="info-row"><span><strong>Período:</strong></span> <span>${periodoTexto}</span></div>
            <div class="info-row"><span><strong>Agrupamento:</strong></span> <span>${config.agrupar_por.charAt(0).toUpperCase() + config.agrupar_por.slice(1)}</span></div>
            <div class="info-row"><span><strong>Funcionários:</strong></span> <span>${config.funcionarios_selecionados.length === 0 ? 'Todos' : config.funcionarios_selecionados.length + ' selecionados'}</span></div>
            <div class="info-row"><span><strong>Gerado em:</strong></span> <span>${dataAtual}</span></div>
          </div>

          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-number">${totalAjustes}</div>
              <div class="stat-label">Ajustes de Ponto</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${totalAfastamentos}</div>
              <div class="stat-label">Afastamentos</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${funcionariosUnicos}</div>
              <div class="stat-label">Funcionários Envolvidos</div>
            </div>
          </div>

          ${config.incluir_ajustes && totalAjustes > 0 ? `
            <div class="section-title">Ajustes de Ponto (${totalAjustes})</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Funcionário</th>
                  <th>Tipo</th>
                  <th>Hora Original</th>
                  <th>Hora Ajustada</th>
                  <th>Justificativa</th>
                  <th>Responsável</th>
                </tr>
              </thead>
              <tbody>
                ${dadosRelatorio.ajustes.map((ajuste: any) => `
                  <tr>
                    <td>${new Date(ajuste.data_ajuste).toLocaleDateString('pt-BR')}</td>
                    <td>${ajuste.funcionario_nome}</td>
                    <td>${ajuste.tipo_ajuste.charAt(0).toUpperCase() + ajuste.tipo_ajuste.slice(1)}</td>
                    <td>${ajuste.hora_original || 'N/A'}</td>
                    <td>${ajuste.hora_ajustada}</td>
                    <td>${ajuste.justificativa}</td>
                    <td>${ajuste.usuario_ajuste_nome}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          ${config.incluir_afastamentos && totalAfastamentos > 0 ? `
            <div class="section-title">Afastamentos (${totalAfastamentos})</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Tipo</th>
                  <th>Data Início</th>
                  <th>Data Fim</th>
                  <th>Dias</th>
                  <th>Motivo</th>
                  <th>Responsável</th>
                </tr>
              </thead>
              <tbody>
                ${dadosRelatorio.afastamentos.map((afastamento: any) => `
                  <tr>
                    <td>${afastamento.funcionario_nome}</td>
                    <td>${afastamento.tipo_afastamento.replace('_', ' ').charAt(0).toUpperCase() + afastamento.tipo_afastamento.replace('_', ' ').slice(1)}</td>
                    <td>${new Date(afastamento.data_inicio).toLocaleDateString('pt-BR')}</td>
                    <td>${new Date(afastamento.data_fim).toLocaleDateString('pt-BR')}</td>
                    <td>${afastamento.total_dias}</td>
                    <td>${afastamento.motivo}</td>
                    <td>${afastamento.usuario_cadastro_nome}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <div class="footer">
            <p><strong>Nota Legal:</strong> Este documento é válido para fins de auditoria trabalhista e conformidade legal.</p>
            <p>Relatório gerado automaticamente pelo sistema EngFlow em ${dataAtual}</p>
          </div>
        </body>
      </html>
    `;

    // Converter HTML para PDF usando browser print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Aguardar carregamento e imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    }
  };

  const gerarRelatorioCSV = async (dadosRelatorio: any) => {
    console.log("Gerando CSV...");

    const headers = [
      'Tipo de Operação',
      'Data',
      'Funcionário',
      'Função',
      'Setor',
      'Tipo Específico',
      'Hora/Data Original',
      'Hora/Data Ajustada',
      'Justificativa/Motivo',
      'Responsável',
      'Data da Operação',
      'Observações'
    ];

    const csvData: string[][] = [];

    // Processar ajustes
    if (config.incluir_ajustes && dadosRelatorio.ajustes) {
      dadosRelatorio.ajustes.forEach((ajuste: any) => {
        csvData.push([
          'Ajuste de Ponto',
          new Date(ajuste.data_ajuste).toLocaleDateString('pt-BR'),
          ajuste.funcionario_nome || '',
          ajuste.funcao_nome || '',
          ajuste.setor_nome || '',
          ajuste.tipo_ajuste ? ajuste.tipo_ajuste.charAt(0).toUpperCase() + ajuste.tipo_ajuste.slice(1).replace('_', ' ') : '',
          ajuste.hora_original || 'N/A',
          ajuste.hora_ajustada || '',
          ajuste.justificativa || '',
          ajuste.usuario_ajuste_nome || '',
          new Date(ajuste.created_at).toLocaleString('pt-BR'),
          ajuste.observacoes || ''
        ]);
      });
    }

    // Processar afastamentos
    if (config.incluir_afastamentos && dadosRelatorio.afastamentos) {
      dadosRelatorio.afastamentos.forEach((afastamento: any) => {
        csvData.push([
          'Afastamento',
          new Date(afastamento.data_inicio).toLocaleDateString('pt-BR'),
          afastamento.funcionario_nome || '',
          afastamento.funcao_nome || '',
          afastamento.setor_nome || '',
          afastamento.tipo_afastamento ? afastamento.tipo_afastamento.charAt(0).toUpperCase() + afastamento.tipo_afastamento.slice(1).replace('_', ' ') : '',
          new Date(afastamento.data_inicio).toLocaleDateString('pt-BR'),
          new Date(afastamento.data_fim).toLocaleDateString('pt-BR'),
          afastamento.motivo || '',
          afastamento.usuario_cadastro_nome || '',
          new Date(afastamento.created_at).toLocaleString('pt-BR'),
          `${afastamento.total_dias} dias` + (afastamento.observacoes ? ` | ${afastamento.observacoes}` : '') + (afastamento.documento_anexo_nome ? ` | Anexo: ${afastamento.documento_anexo_nome}` : '')
        ]);
      });
    }

    // Ordenar dados conforme agrupamento
    csvData.sort((a, b) => {
      switch (config.agrupar_por) {
        case 'funcionario':
          return a[2].localeCompare(b[2]); // Nome do funcionário
        case 'tipo':
          return a[0].localeCompare(b[0]); // Tipo de operação
        case 'data':
        default:
          return new Date(b[1]).getTime() - new Date(a[1]).getTime(); // Data (mais recente primeiro)
      }
    });

    // Construir CSV
    const csvContent = [
      headers.join(','),
      ...csvData.map(row =>
        row.map(field => {
          // Escapar aspas e campos com vírgulas
          const fieldStr = field?.toString() || '';
          if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
            return `"${fieldStr.replace(/"/g, '""')}"`;
          }
          return fieldStr;
        }).join(',')
      )
    ].join('\n');

    // Adicionar BOM para UTF-8 (para Excel)
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Nome do arquivo baseado nas configurações
    const periodoSufixo = config.periodo_inicio && config.periodo_fim
      ? `_${config.periodo_inicio}_${config.periodo_fim}`
      : '_completo';
    const tipoSufixo = config.incluir_ajustes && config.incluir_afastamentos
      ? '_completo'
      : config.incluir_ajustes
        ? '_ajustes'
        : '_afastamentos';

    a.download = `relatorio${tipoSufixo}${periodoSufixo}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const validarConfiguracao = (): string[] => {
    const erros: string[] = [];

    if (!config.periodo_inicio) {
      erros.push("Data de início é obrigatória");
    }

    if (!config.periodo_fim) {
      erros.push("Data de fim é obrigatória");
    }

    if (config.periodo_inicio && config.periodo_fim) {
      if (new Date(config.periodo_fim) < new Date(config.periodo_inicio)) {
        erros.push("Data de fim deve ser posterior à data de início");
      }
    }

    if (!config.incluir_ajustes && !config.incluir_afastamentos) {
      erros.push("Selecione pelo menos um tipo de dados para incluir");
    }

    return erros;
  };

  const errosValidacao = validarConfiguracao();
  const podeGerar = errosValidacao.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Relatório de Ajustes
          </DialogTitle>
          <DialogDescription>
            Configure as opções do relatório para exportação em PDF ou CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formato e Período */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Formato</Label>
              <Select
                value={config.formato}
                onValueChange={(value: 'pdf' | 'csv') => handleConfigChange('formato', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF (Relatório Formatado)</SelectItem>
                  <SelectItem value="csv">CSV (Planilha)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Agrupar Por</Label>
              <Select
                value={config.agrupar_por}
                onValueChange={(value: 'funcionario' | 'data' | 'tipo') =>
                  handleConfigChange('agrupar_por', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="funcionario">Funcionário</SelectItem>
                  <SelectItem value="tipo">Tipo de Operação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={config.periodo_inicio}
                onChange={(e) => handleConfigChange('periodo_inicio', e.target.value)}
              />
            </div>
            <div>
              <Label>Data de Fim</Label>
              <Input
                type="date"
                value={config.periodo_fim}
                onChange={(e) => handleConfigChange('periodo_fim', e.target.value)}
              />
            </div>
          </div>

          {/* Opções de Conteúdo */}
          <div className="space-y-3">
            <Label>Incluir no Relatório</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluir_ajustes"
                  checked={config.incluir_ajustes}
                  onCheckedChange={(checked) =>
                    handleConfigChange('incluir_ajustes', !!checked)}
                />
                <Label htmlFor="incluir_ajustes" className="text-sm">
                  Ajustes de Ponto
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluir_afastamentos"
                  checked={config.incluir_afastamentos}
                  onCheckedChange={(checked) =>
                    handleConfigChange('incluir_afastamentos', !!checked)}
                />
                <Label htmlFor="incluir_afastamentos" className="text-sm">
                  Afastamentos
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluir_justificativas"
                  checked={config.incluir_justificativas}
                  onCheckedChange={(checked) =>
                    handleConfigChange('incluir_justificativas', !!checked)}
                />
                <Label htmlFor="incluir_justificativas" className="text-sm">
                  Justificativas
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluir_documentos"
                  checked={config.incluir_documentos}
                  onCheckedChange={(checked) =>
                    handleConfigChange('incluir_documentos', !!checked)}
                />
                <Label htmlFor="incluir_documentos" className="text-sm">
                  Documentos Anexos
                </Label>
              </div>
            </div>
          </div>

          {/* Seleção de Funcionários */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Funcionários ({config.funcionarios_selecionados.length} selecionados)</Label>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selecionarTodosFuncionarios(true)}
                >
                  Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selecionarTodosFuncionarios(false)}
                >
                  Nenhum
                </Button>
              </div>
            </div>

            <div className="max-h-32 overflow-y-auto border rounded-md p-3 space-y-2">
              {funcionarios.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">
                  Nenhum funcionário disponível
                </p>
              ) : (
                funcionarios.map((funcionario) => (
                  <div key={funcionario.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={funcionario.id}
                      checked={config.funcionarios_selecionados.includes(funcionario.id)}
                      onCheckedChange={(checked) =>
                        handleFuncionarioToggle(funcionario.id, !!checked)}
                    />
                    <Label htmlFor={funcionario.id} className="text-sm">
                      {funcionario.nome} - {funcionario.funcao?.nome}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Erros de Validação */}
          {errosValidacao.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-medium text-red-800 mb-1">
                Corrija os seguintes erros:
              </p>
              <ul className="text-sm text-red-600 space-y-1">
                {errosValidacao.map((erro, index) => (
                  <li key={index}>• {erro}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              Cancelar
            </Button>
            <Button
              onClick={gerarRelatorio}
              disabled={!podeGerar || isGenerating}
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? "Gerando..." : "Gerar Relatório"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}