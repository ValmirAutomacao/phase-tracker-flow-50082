import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Eye,
  Search,
  Filter,
  Settings,
  ChevronRight,
  Database,
  Table,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import type { RelatorioBi, CampoSelecionado, FiltrosPadrao } from "@/types/bi";
import { CAMPOS_FINANCEIRO } from "@/types/bi";

const BIBuilder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  // Estados do formulário
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [camposSelecionados, setCamposSelecionados] = useState<CampoSelecionado[]>([]);
  const [tabelaSelecionada, setTabelaSelecionada] = useState<string>('despesas');
  const [searchTerm, setSearchTerm] = useState("");
  const [filtros, setFiltros] = useState(() => {
    // Usar período amplo para capturar dados de diferentes épocas
    // Como temos dados de 2019 (OCR) e 2025 (novos), vamos usar um período abrangente
    const dataInicio = new Date('2019-01-01');
    const dataFim = new Date('2025-12-31');

    return {
      data_inicio: dataInicio.toISOString().split('T')[0],
      data_fim: dataFim.toISOString().split('T')[0],
      cliente_id: '',
      obra_id: ''
    };
  });

  // Hooks do Supabase
  const { data: relatorios = [] } = useOptimizedSupabaseQuery<RelatorioBi>('RELATORIOS_BI');
  const { add, update } = useSupabaseCRUD<RelatorioBi>('RELATORIOS_BI');

  // Carregar dados para edição
  useEffect(() => {
    if (editId && relatorios.length > 0) {
      const relatorio = relatorios.find(r => r.id === editId);
      if (relatorio) {
        setNome(relatorio.nome);
        setDescricao(relatorio.descricao || "");
        setCamposSelecionados(relatorio.campos_selecionados);
      }
    }
  }, [editId, relatorios]);

  // Tabelas disponíveis
  const tabelasDisponiveis = [
    { key: 'despesas', label: 'Despesas por Requisição', icon: BarChart3 },
    { key: 'despesas_variaveis', label: 'Despesas Variáveis', icon: BarChart3 },
    { key: 'cartoes_credito', label: 'Cartões de Crédito', icon: Database },
    { key: 'categorias', label: 'Categorias', icon: Table },
    { key: 'clientes', label: 'Clientes', icon: Database },
    { key: 'obras', label: 'Obras', icon: Database },
    { key: 'funcionarios', label: 'Funcionários', icon: Database },
    { key: 'requisicoes', label: 'Requisições', icon: Table }
  ];

  // Filtrar campos da tabela selecionada
  const camposTabela = useMemo(() => {
    const campos = CAMPOS_FINANCEIRO[tabelaSelecionada] || [];
    if (!searchTerm) return campos;

    return campos.filter(campo =>
      campo.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campo.key.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tabelaSelecionada, searchTerm]);

  // Verificar se campo está selecionado
  const isCampoSelecionado = (tabela: string, campo: string) => {
    return camposSelecionados.some(c => c.tabela === tabela && c.campo === campo);
  };

  // Toggle seleção de campo
  const toggleCampo = (tabela: string, campoKey: string) => {
    const campoInfo = CAMPOS_FINANCEIRO[tabela]?.find(c => c.key === campoKey);
    if (!campoInfo) return;

    setCamposSelecionados(prev => {
      const jaSelecionado = prev.some(c => c.tabela === tabela && c.campo === campoKey);

      if (jaSelecionado) {
        return prev.filter(c => !(c.tabela === tabela && c.campo === campoKey));
      } else {
        const novoCampo: CampoSelecionado = {
          tabela,
          campo: campoKey,
          alias: campoInfo.label,
          tipo: campoInfo.tipo
        };
        return [...prev, novoCampo];
      }
    });
  };

  // Remover campo selecionado
  const removerCampo = (tabela: string, campo: string) => {
    setCamposSelecionados(prev =>
      prev.filter(c => !(c.tabela === tabela && c.campo === campo))
    );
  };


  // Salvar template (opcional)
  const handleSave = async () => {
    if (!nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para salvar o template.",
        variant: "destructive",
      });
      return;
    }

    if (camposSelecionados.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione pelo menos um campo para salvar o template.",
        variant: "destructive",
      });
      return;
    }

    const dadosRelatorio = {
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      setor: 'financeiro' as const,
      campos_selecionados: camposSelecionados,
      filtros_padrao: { periodo_obrigatorio: true },
      configuracoes: {},
      ativo: true
    };

    try {
      if (editId) {
        await update.mutateAsync({ id: editId, updates: dadosRelatorio });
        toast({
          title: "Relatório atualizado!",
          description: "Suas alterações foram salvas com sucesso.",
        });
      } else {
        await add.mutateAsync(dadosRelatorio);
        toast({
          title: "Relatório criado!",
          description: "Seu relatório foi salvo com sucesso.",
        });
      }
      navigate('/bi');
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o relatório.",
        variant: "destructive",
      });
    }
  };

  // Ir para visualização completa
  const handleGoToVisualizer = () => {
    // Validação de campos selecionados
    if (camposSelecionados.length === 0) {
      toast({
        title: "Nenhum campo selecionado",
        description: "Selecione campos para visualizar o BI completo.",
        variant: "destructive",
      });
      return;
    }

    // Validação de filtros obrigatórios
    if (!filtros.data_inicio || !filtros.data_fim) {
      toast({
        title: "Período obrigatório",
        description: "Informe as datas de início e fim.",
        variant: "destructive",
      });
      return;
    }

    // Validação da lógica das datas
    if (new Date(filtros.data_inicio) > new Date(filtros.data_fim)) {
      toast({
        title: "Período inválido",
        description: "A data de início deve ser anterior à data de fim.",
        variant: "destructive",
      });
      return;
    }

    const previewData = {
      campos: camposSelecionados,
      filtros: {
        ...filtros,
        periodo_obrigatorio: true
      },
      nome: nome || 'Relatório sem nome',
      descricao: descricao
    };

    const params = new URLSearchParams();
    params.set('preview', 'true');
    params.set('data', JSON.stringify(previewData));

    navigate(`/bi/visualizer/preview?${params.toString()}`);
  };

  const getTabelaLabel = (tabela: string) => {
    const tabelaInfo = tabelasDisponiveis.find(t => t.key === tabela);
    return tabelaInfo?.label || tabela;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/bi')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl font-semibold">
              {editId ? 'Editar Relatório' : 'Novo Relatório BI'}
            </h1>
            <p className="text-sm text-gray-600">
              Configure campos e filtros do setor financeiro
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGoToVisualizer} className="gap-2">
            <Eye className="h-4 w-4" />
            Gerar BI
          </Button>
          <Button variant="outline" onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            {editId ? 'Atualizar Template' : 'Salvar Template'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Esquerda - Navegação de Tabelas */}
        <div className="w-64 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900 mb-3">Tabelas Disponíveis</h3>
            <div className="space-y-1">
              {tabelasDisponiveis.map(tabela => (
                <button
                  key={tabela.key}
                  onClick={() => setTabelaSelecionada(tabela.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                    tabelaSelecionada === tabela.key
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <tabela.icon className="h-4 w-4" />
                  <span className="text-left">{tabela.label}</span>
                  <ChevronRight className="h-3 w-3 ml-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Informações do Relatório */}
          <div className="flex-1 p-4">
            <h4 className="font-medium text-gray-900 mb-3">Informações</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="nome" className="text-sm">Nome do Relatório*</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do relatório"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="descricao" className="text-sm">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição opcional..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Filtros</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="data_inicio" className="text-sm">Data Início*</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={filtros.data_inicio}
                    onChange={(e) => setFiltros(prev => ({...prev, data_inicio: e.target.value}))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="data_fim" className="text-sm">Data Fim*</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={filtros.data_fim}
                    onChange={(e) => setFiltros(prev => ({...prev, data_fim: e.target.value}))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Resumo</h5>
              <div className="text-sm text-gray-600">
                <div>Campos selecionados: <span className="font-medium">{camposSelecionados.length}</span></div>
                <div>Tabelas: <span className="font-medium">{new Set(camposSelecionados.map(c => c.tabela)).size}</span></div>
                <div>Período: <span className="font-medium">
                  {filtros.data_inicio && filtros.data_fim
                    ? `${filtros.data_inicio} até ${filtros.data_fim}`
                    : 'Não definido'}
                </span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Área Central - Campos da Tabela */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-gray-900">
                  Campos - {getTabelaLabel(tabelaSelecionada)}
                </h3>
                <p className="text-sm text-gray-600">
                  Selecione os campos que deseja incluir no relatório
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar campos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {camposTabela.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Database className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum campo encontrado</p>
                  <p className="text-sm">Tente ajustar os termos da busca</p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {camposTabela.map((campo) => {
                    const isSelected = isCampoSelecionado(tabelaSelecionada, campo.key);
                    return (
                      <div
                        key={`${tabelaSelecionada}-${campo.key}`}
                        className={`group relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50/30'
                        }`}
                        onClick={() => toggleCampo(tabelaSelecionada, campo.key)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 group-hover:border-blue-400'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-sm leading-tight">{campo.label}</div>
                            <div className="text-xs text-gray-500 mt-1 font-mono">
                              {campo.key}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                campo.tipo === 'currency'
                                  ? 'bg-green-100 text-green-800'
                                  : campo.tipo === 'date'
                                  ? 'bg-blue-100 text-blue-800'
                                  : campo.tipo === 'boolean'
                                  ? 'bg-purple-100 text-purple-800'
                                  : campo.tipo === 'number'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {campo.tipo}
                              </span>
                              {campo.agrupavel && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  Agrupável
                                </span>
                              )}
                              {campo.totalizavel && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                  Totalizável
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Direita - Campos Selecionados */}
        <div className="w-80 bg-white border-l flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Campos do Relatório</h3>
              <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {camposSelecionados.length}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {camposSelecionados.length === 0
                ? 'Selecione campos para começar'
                : `${camposSelecionados.length} campo${camposSelecionados.length === 1 ? '' : 's'} selecionado${camposSelecionados.length === 1 ? '' : 's'}`
              }
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {camposSelecionados.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center px-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Settings className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Nenhum campo selecionado</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Selecione campos na área central para montar seu relatório
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {camposSelecionados.map((campo, index) => {
                  const tabelaInfo = tabelasDisponiveis.find(t => t.key === campo.tabela);
                  const Icon = tabelaInfo?.icon || Table;

                  return (
                    <div
                      key={`${campo.tabela}-${campo.campo}-${index}`}
                      className="group relative bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg p-3 transition-all duration-150"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {campo.alias || campo.campo}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {getTabelaLabel(campo.tabela)}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              campo.tipo === 'currency'
                                ? 'bg-green-100 text-green-700'
                                : campo.tipo === 'date'
                                ? 'bg-blue-100 text-blue-700'
                                : campo.tipo === 'boolean'
                                ? 'bg-purple-100 text-purple-700'
                                : campo.tipo === 'number'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {campo.tipo}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removerCampo(campo.tabela, campo.campo)}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md hover:bg-red-100 flex items-center justify-center text-red-600 hover:text-red-700 transition-all duration-150"
                          title="Remover campo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {camposSelecionados.length > 0 && (
                  <div className="pt-2 mt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Tabelas utilizadas:</span>
                      <span className="font-medium">
                        {new Set(camposSelecionados.map(c => c.tabela)).size}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default BIBuilder;