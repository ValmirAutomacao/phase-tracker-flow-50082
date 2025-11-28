import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Printer,
  Calendar,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Loader2,
  Save
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { supabase } from "@/lib/supabaseClient";
import { DataTable } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import type { RelatorioBi, CampoSelecionado, ResultadoBI, ConfiguracaoExportacao } from "@/types/bi";
import { exportService } from "@/services/exportService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const BIVisualizer = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  // Estados
  const [relatorio, setRelatorio] = useState<RelatorioBi | null>(null);
  const [filtros, setFiltros] = useState<Record<string, any>>({
    data_inicio: '2019-01-01', // Período amplo para capturar dados históricos e atuais
    data_fim: '2025-12-31'
  });
  const [dadosRelatorio, setDadosRelatorio] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState<string | null>(null);

  // Hooks do Supabase
  const { data: relatorios = [] } = useOptimizedSupabaseQuery<RelatorioBi>('RELATORIOS_BI');
  const { add } = useSupabaseCRUD<RelatorioBi>('RELATORIOS_BI');
  const { data: clientes = [] } = useOptimizedSupabaseQuery<any>('CLIENTES');
  const { data: obras = [] } = useOptimizedSupabaseQuery<any>('OBRAS');
  const { data: funcionarios = [] } = useOptimizedSupabaseQuery<any>('FUNCIONARIOS');
  const { data: categorias = [] } = useOptimizedSupabaseQuery<any>('CATEGORIAS');
  // const { data: formasPagamento = [] } = useOptimizedSupabaseQuery<any>('FORMAS_PAGAMENTO');

  // Dados para preview
  const previewData = useMemo(() => {
    if (searchParams.get('preview') === 'true') {
      try {
        const data = searchParams.get('data');
        if (data) {
          return JSON.parse(data);
        }
      } catch (error) {
        console.error('Erro ao parsear dados de preview:', error);
      }
    }
    return null;
  }, [searchParams]);

  // Carregar relatório
  useEffect(() => {
    if (id && relatorios.length > 0) {
      const relatorioEncontrado = relatorios.find(r => r.id === id);
      if (relatorioEncontrado) {
        setRelatorio(relatorioEncontrado);
        // Aplicar filtros padrão
        if (relatorioEncontrado.filtros_padrao) {
          setFiltros(prev => ({
            ...prev,
            ...relatorioEncontrado.filtros_padrao,
            data_inicio: relatorioEncontrado.filtros_padrao.data_inicio || prev.data_inicio,
            data_fim: relatorioEncontrado.filtros_padrao.data_fim || prev.data_fim
          }));
        }
      }
    } else if (previewData) {
      // Modo preview
      setRelatorio({
        id: 'preview',
        nome: previewData.nome || 'Preview do Relatório',
        descricao: previewData.descricao,
        campos_selecionados: previewData.campos,
        filtros_padrao: previewData.filtros,
        setor: 'financeiro'
      } as RelatorioBi);

      // Aplicar filtros do preview
      if (previewData.filtros) {
        setFiltros(prev => ({
          ...prev,
          ...previewData.filtros
        }));
      }
    }
  }, [id, relatorios, previewData]);

  // Gerar colunas da DataTable
  const columns: Column<any>[] = useMemo(() => {
    if (!relatorio || !relatorio.campos_selecionados || relatorio.campos_selecionados.length === 0) {
      return [];
    }

    const colunas = relatorio.campos_selecionados.map((campo, index) => ({
      key: campo.campo, // Usar apenas o nome do campo, sem prefixo da tabela
      title: campo.alias || campo.campo,
      sortable: true,
      filterable: true,
      render: (value, row, rowIndex) => {
        if (value === null || value === undefined) {
          return <span className="text-muted-foreground">-</span>;
        }

        // Formatação por tipo
        switch (campo.tipo) {
          case 'currency':
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(Number(value) || 0);

          case 'date':
            try {
              return format(new Date(value), 'dd/MM/yyyy', { locale: ptBR });
            } catch {
              return value.toString();
            }

          case 'boolean':
            return (
              <Badge variant={value ? 'default' : 'secondary'}>
                {value ? 'Sim' : 'Não'}
              </Badge>
            );

          case 'number':
            return Number(value).toLocaleString('pt-BR');

          default:
            return value.toString();
        }
      }
    }));

    return colunas;
  }, [relatorio]);

  // Mapeamento de campos de data para cada tabela
  const CAMPOS_DATA_POR_TABELA = {
    'despesas': 'data_despesa',
    'despesas_variaveis': 'data_compra',
    'cartoes_credito': 'created_at',
    'formas_pagamento': 'created_at',
    'categorias': 'created_at',
    'clientes': 'created_at',
    'obras': 'data_inicio',
    'funcionarios': 'created_at',
    'requisicoes': 'data_vencimento'
  };

  // Função para buscar dados de uma tabela específica
  const buscarDadosTabelaUnica = async (tabela: string, camposSelecionados: CampoSelecionado[], filtrosAplicados: Record<string, any>) => {
    console.log(`📊 Buscando dados da tabela: ${tabela}`);

    // Campos a serem selecionados desta tabela
    const camposDaTabela = camposSelecionados
      .filter(campo => campo.tabela === tabela)
      .map(campo => campo.campo);

    if (camposDaTabela.length === 0) {
      console.log(`⚠️ Nenhum campo selecionado da tabela ${tabela}`);
      return [];
    }

    // Sempre incluir ID
    const camposParaBuscar = ['id', ...new Set(camposDaTabela)];
    console.log(`📋 Campos a buscar de ${tabela}:`, camposParaBuscar);

    // Montar query
    let query = supabase.from(tabela).select(camposParaBuscar.join(', '));

    // Aplicar filtros de data baseado no tipo de tabela
    if (filtrosAplicados.data_inicio && filtrosAplicados.data_fim) {
      const campoData = CAMPOS_DATA_POR_TABELA[tabela] || 'created_at';
      console.log(`📅 Aplicando filtro de data em ${tabela}.${campoData}: ${filtrosAplicados.data_inicio} até ${filtrosAplicados.data_fim}`);

      query = query
        .gte(campoData, filtrosAplicados.data_inicio)
        .lte(campoData, filtrosAplicados.data_fim);
    }

    // Aplicar filtros específicos da tabela
    if (filtrosAplicados.cliente_id && filtrosAplicados.cliente_id !== 'all') {
      // Tabelas que têm relacionamento com cliente
      if (['despesas', 'obras'].includes(tabela)) {
        query = query.eq('cliente_id', filtrosAplicados.cliente_id);
      }
    }

    if (filtrosAplicados.obra_id && filtrosAplicados.obra_id !== 'all') {
      // Tabelas que têm relacionamento com obra
      if (['despesas', 'despesas_variaveis', 'requisicoes'].includes(tabela)) {
        query = query.eq('obra_id', filtrosAplicados.obra_id);
      }
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error(`Erro na consulta da tabela ${tabela}:`, error);
      throw error;
    }

    console.log(`📁 Dados de ${tabela}:`, data?.length || 0, 'registros');
    if (data && data[0]) {
      console.log(`📁 Primeiro registro de ${tabela}:`, data[0]);
    }

    // Transformar dados para formato da DataTable
    const dadosFormatados = (data || []).map((item, index) => {
      const row: any = {
        id: item.id || `${tabela}-${index}`,
        _tabela_origem: tabela // Adicionar metadado da tabela origem
      };

      // Mapear apenas os campos selecionados desta tabela
      camposSelecionados
        .filter(campo => campo.tabela === tabela)
        .forEach(campo => {
          const key = campo.campo;
          const value = item[campo.campo];

          console.log(`🔗 ${tabela}.${campo.campo} -> ${key} = ${value}`);
          row[key] = value;
        });

      return row;
    });

    return dadosFormatados;
  };

  // Função para buscar dados reais do Supabase
  const buscarDadosReais = async (camposSelecionados: CampoSelecionado[], filtrosAplicados: Record<string, any>) => {
    try {
      // Identificar as tabelas usadas
      const tabelasUsadas = Array.from(new Set(camposSelecionados.map(campo => campo.tabela)));
      console.log('📋 Tabelas usadas:', tabelasUsadas);

      // Se apenas uma tabela, fazer busca simples
      if (tabelasUsadas.length === 1) {
        return await buscarDadosTabelaUnica(tabelasUsadas[0], camposSelecionados, filtrosAplicados);
      }

      // Se múltiplas tabelas, buscar de cada uma separadamente e combinar
      const resultados = await Promise.all(
        tabelasUsadas.map(async (tabela) => {
          return await buscarDadosTabelaUnica(tabela, camposSelecionados, filtrosAplicados);
        })
      );

      // Combinar resultados (union de todas as tabelas)
      return resultados.flat();

    } catch (error) {
      console.error('Erro ao buscar dados reais:', error);
      throw error;
    }
  };

  // Buscar dados do relatório
  const buscarDados = async () => {
    if (!relatorio || (!id && !previewData)) return;

    setLoading(true);
    try {
      // Buscar dados reais do Supabase baseado nos campos selecionados
      console.log('🔍 Campos selecionados:', relatorio.campos_selecionados);
      console.log('🔍 Filtros aplicados:', filtros);
      const dadosReais = await buscarDadosReais(relatorio.campos_selecionados, filtros);
      console.log('📊 Dados reais retornados:', dadosReais);
      console.log('📊 Primeira linha exemplo:', dadosReais[0]);
      console.log('📊 Estrutura das colunas esperadas:');
      relatorio.campos_selecionados.forEach(campo => {
        console.log(`   - Chave: ${campo.campo} | Alias: ${campo.alias} | Tabela: ${campo.tabela}`);
      });
      setDadosRelatorio(dadosReais);

      toast({
        title: "Dados carregados!",
        description: `${dadosReais.length} registros encontrados.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do relatório.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregamento inicial
  useEffect(() => {
    if (relatorio) {
      buscarDados();
    }
  }, [relatorio]);

  // Exportar relatório
  const handleExport = async (formato: 'xlsx' | 'pdf' | 'csv') => {
    if (!relatorio || dadosRelatorio.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Execute a consulta primeiro para gerar dados.",
        variant: "destructive",
      });
      return;
    }

    setExportando(formato);
    try {
      // Configuração profissional para exportação
      const configuracao: ConfiguracaoExportacao = {
        formato,
        incluir_logo: true, // Sempre incluir logo da SecEngenharia
        incluir_filtros: false, // Não incluir filtros por padrão para relatórios limpos
        incluir_totais: true, // Sempre incluir totais
        titulo_personalizado: relatorio.nome,
        orientacao_pdf: 'landscape'
      };

      // Preparar dados no formato correto - usar dados diretos do DataTable
      const dadosFormatados = dadosRelatorio;

      // Usar o serviço de exportação profissional
      switch (formato) {
        case 'xlsx':
          await exportService.exportarParaExcel(
            dadosFormatados,
            relatorio.campos_selecionados,
            configuracao,
            relatorio.nome,
            filtros,
            totais
          );
          break;
        case 'pdf':
          await exportService.exportarParaPDF(
            dadosFormatados,
            relatorio.campos_selecionados,
            configuracao,
            relatorio.nome,
            filtros,
            totais
          );
          break;
        case 'csv':
          await exportService.exportarParaCSV(
            dadosFormatados,
            relatorio.campos_selecionados,
            relatorio.nome
          );
          break;
      }

      toast({
        title: `Exportação ${formato.toUpperCase()} concluída!`,
        description: "O arquivo foi baixado com sucesso.",
      });

    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: "Erro na exportação",
        description: `Não foi possível exportar para ${formato.toUpperCase()}.`,
        variant: "destructive",
      });
    } finally {
      setExportando(null);
    }
  };

  // Imprimir relatório
  const handlePrint = () => {
    if (!relatorio || dadosRelatorio.length === 0) {
      toast({
        title: "Sem dados para imprimir",
        description: "Execute a consulta primeiro para gerar dados.",
        variant: "destructive",
      });
      return;
    }

    window.print();
  };

  // Salvar template do preview
  const handleSalvarTemplate = async () => {
    if (!previewData || !relatorio) {
      return;
    }

    const nomeTemplate = window.prompt('Nome do template:', relatorio.nome);
    if (!nomeTemplate?.trim()) {
      return;
    }

    try {
      const dadosTemplate = {
        nome: nomeTemplate.trim(),
        descricao: previewData.descricao || '',
        setor: 'financeiro' as const,
        campos_selecionados: previewData.campos,
        filtros_padrao: previewData.filtros,
        configuracoes: {},
        ativo: true
      };

      await add.mutateAsync(dadosTemplate);

      toast({
        title: "Template salvo!",
        description: "Template foi salvo com sucesso nos seus relatórios.",
      });
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o template.",
        variant: "destructive",
      });
    }
  };

  // Calcular totais - CORRIGIDO
  const totais = useMemo(() => {
    if (!relatorio || dadosRelatorio.length === 0) return {};

    const totaisCalculados: Record<string, number> = {};

    relatorio.campos_selecionados.forEach(campo => {
      if (campo.tipo === 'currency' || campo.tipo === 'number') {
        // Usar apenas o nome do campo, igual ao DataTable
        const key = campo.campo;
        const soma = dadosRelatorio.reduce((acc, row) => {
          const valor = Number(row[campo.campo]) || 0;
          return acc + valor;
        }, 0);
        totaisCalculados[key] = soma;
      }
    });

    return totaisCalculados;
  }, [relatorio, dadosRelatorio]);

  if (!relatorio) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Relatório não encontrado</h3>
          <p className="text-muted-foreground mb-4">
            O relatório solicitado não existe ou você não tem permissão para acessá-lo.
          </p>
          <Button onClick={() => navigate('/bi')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao BI
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 print:p-0 print:space-y-4">
      {/* Header - Oculto na impressão */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/bi')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{relatorio.nome}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{relatorio.campos_selecionados.length} campos selecionados</span>
              <span>•</span>
              <span>{dadosRelatorio.length} registros</span>
              {id !== 'preview' && (
                <>
                  <span>•</span>
                  <Badge variant="outline">Financeiro</Badge>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={buscarDados}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('xlsx')}
            disabled={exportando !== null}
            className="gap-2"
          >
            {exportando === 'xlsx' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={exportando !== null}
            className="gap-2"
          >
            {exportando === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exportando !== null}
            className="gap-2"
          >
            {exportando === 'csv' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          {previewData && (
            <Button
              onClick={handleSalvarTemplate}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar Template
            </Button>
          )}
        </div>
      </div>

      {/* Filtros - Oculto na impressão/exportação */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Configure os filtros para personalizar os dados do relatório
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro de período obrigatório */}
            <div className="lg:col-span-2">
              <Label className="text-sm font-medium">
                Período * <span className="text-red-500">Obrigatório</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <Label className="text-xs text-muted-foreground">Data Início</Label>
                  <Input
                    type="date"
                    value={filtros.data_inicio || ''}
                    onChange={(e) => setFiltros(prev => ({...prev, data_inicio: e.target.value}))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data Fim</Label>
                  <Input
                    type="date"
                    value={filtros.data_fim || ''}
                    onChange={(e) => setFiltros(prev => ({...prev, data_fim: e.target.value}))}
                  />
                </div>
              </div>
            </div>

            {/* Filtro por cliente */}
            <div>
              <Label className="text-sm font-medium">Cliente</Label>
              <Select
                value={filtros.cliente_id || 'all'}
                onValueChange={(value) => setFiltros(prev => ({...prev, cliente_id: value === 'all' ? '' : value}))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por obra */}
            <div>
              <Label className="text-sm font-medium">Obra</Label>
              <Select
                value={filtros.obra_id || 'all'}
                onValueChange={(value) => setFiltros(prev => ({...prev, obra_id: value === 'all' ? '' : value}))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todas as obras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as obras</SelectItem>
                  {obras.map((obra) => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={buscarDados} disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cabeçalho Profissional para Impressão */}
      <div className="hidden print:block mb-6">
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
          {/* Logo da SecEngenharia */}
          <div className="mb-3">
            <h1 className="text-2xl font-bold text-gray-900">SECENGENHARIA</h1>
            <p className="text-sm text-gray-600 uppercase tracking-wide">Sistema de Gestão Empresarial</p>
          </div>
          {/* Título do Relatório */}
          <h2 className="text-lg font-semibold text-gray-800 mb-1">{relatorio.nome}</h2>
          <p className="text-xs text-gray-500">
            Gerado em: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Dados do Relatório */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Dados do Relatório</CardTitle>
              <CardDescription>
                Resultados baseados nos filtros aplicados
              </CardDescription>
            </div>
            {Object.keys(totais).length > 0 && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Totais:</div>
                <div className="space-y-1">
                  {Object.entries(totais).map(([campo, total]) => {
                    const campoInfo = relatorio.campos_selecionados.find(
                      c => c.campo === campo
                    );
                    return (
                      <div key={campo} className="text-sm">
                        <span className="text-muted-foreground">{campoInfo?.alias || campo}: </span>
                        <span className="font-semibold">
                          {campoInfo?.tipo === 'currency'
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)
                            : total.toLocaleString('pt-BR')
                          }
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Totais para Impressão - Layout Profissional */}
        {Object.keys(totais).length > 0 && (
          <div className="hidden print:block mb-4 p-3 border border-gray-400 bg-gray-100">
            <h3 className="font-bold text-sm mb-2 text-center uppercase tracking-wide">TOTAIS DO RELATÓRIO</h3>
            <div className="space-y-1">
              {Object.entries(totais).map(([campo, total]) => {
                const campoInfo = relatorio.campos_selecionados.find(
                  c => c.campo === campo
                );
                return (
                  <div key={campo} className="flex justify-between py-1 border-b border-gray-300 last:border-b-0">
                    <span className="text-gray-700 font-medium">{campoInfo?.alias || campo}:</span>
                    <span className="font-bold text-gray-900">
                      {campoInfo?.tipo === 'currency'
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)
                        : total.toLocaleString('pt-BR')
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <CardContent>
          <DataTable
            data={dadosRelatorio}
            columns={columns}
            loading={loading}
            searchPlaceholder="Buscar nos resultados..."
            emptyMessage="Nenhum registro encontrado com os filtros aplicados."
            showSelection={false}
            showActions={false}
            globalSearch={true}
            hideFilters={false}
            pageSize={15}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BIVisualizer;