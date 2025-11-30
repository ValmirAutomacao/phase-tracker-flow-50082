// 🤖 CLAUDE-NOTE: Modal para consulta histórica de ajustes realizados
// 📅 Criado em: 2024-11-29
// 🎯 Propósito: Mostrar histórico completo de ajustes com filtros e paginação
// ⚠️ IMPORTANTE: Auditoria completa - quem, quando, o que e por que ajustou
// 🔗 Usado por: ControlePonto.tsx

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Clock,
  User
} from "lucide-react";
import {
  AjustePonto,
  Afastamento,
  FuncionarioCompleto,
  TIPO_AJUSTE_LABELS,
  TIPO_AFASTAMENTO_LABELS
} from "@/types/ponto";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ModalHistoricoAjustesProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  funcionarios: FuncionarioCompleto[];
  onExportarRelatorio: (filtros: FiltrosHistorico) => Promise<void>;
}

interface FiltrosHistorico {
  funcionario_id?: string;
  data_inicio?: string;
  data_fim?: string;
  tipo_operacao?: 'ajuste' | 'afastamento' | 'todos';
  usuario_ajuste?: string;
}

interface HistoricoItem {
  id: string;
  tipo: 'ajuste' | 'afastamento';
  funcionario_nome: string;
  data_operacao: string;
  descricao: string;
  usuario_responsavel: string;
  detalhes: string;
  justificativa?: string;
}

export function ModalHistoricoAjustes({
  isOpen,
  onOpenChange,
  funcionarios,
  onExportarRelatorio,
}: ModalHistoricoAjustesProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [filtros, setFiltros] = useState<FiltrosHistorico>({
    tipo_operacao: 'todos'
  });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [detalhesAjuste, setDetalhesAjuste] = useState<HistoricoItem | null>(null);

  const itensPorPagina = 10;

  const carregarHistorico = async () => {
    setIsLoading(true);
    try {
      // Construir filtros SQL dinamicamente
      const whereConditions: string[] = [];
      const params: any[] = [];

      if (filtros.funcionario_id) {
        whereConditions.push(`funcionario_id = $${params.length + 1}`);
        params.push(filtros.funcionario_id);
      }

      if (filtros.data_inicio) {
        whereConditions.push(`(data_ajuste >= $${params.length + 1} OR data_inicio >= $${params.length + 1})`);
        params.push(filtros.data_inicio);
      }

      if (filtros.data_fim) {
        whereConditions.push(`(data_ajuste <= $${params.length + 1} OR data_fim <= $${params.length + 1})`);
        params.push(filtros.data_fim);
      }

      if (filtros.usuario_ajuste) {
        whereConditions.push(`(usuario_ajuste_nome ILIKE $${params.length + 1} OR usuario_cadastro_nome ILIKE $${params.length + 1})`);
        params.push(`%${filtros.usuario_ajuste}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Construir query baseada no tipo de operação
      let query = '';

      if (filtros.tipo_operacao === 'ajuste' || filtros.tipo_operacao === 'todos') {
        query += `
          SELECT
            'ajuste' as tipo,
            id,
            funcionario_nome,
            data_ajuste as data_operacao,
            CASE
              WHEN tipo_ajuste = 'entrada' THEN 'Ajuste de Entrada - ' || COALESCE(hora_original, 'N/A') || ' para ' || hora_ajustada
              WHEN tipo_ajuste = 'saida' THEN 'Ajuste de Saída - ' || COALESCE(hora_original, 'N/A') || ' para ' || hora_ajustada
              WHEN tipo_ajuste = 'intervalo_entrada' THEN 'Ajuste Entrada Intervalo - ' || COALESCE(hora_original, 'N/A') || ' para ' || hora_ajustada
              WHEN tipo_ajuste = 'intervalo_saida' THEN 'Ajuste Saída Intervalo - ' || COALESCE(hora_original, 'N/A') || ' para ' || hora_ajustada
              WHEN tipo_ajuste = 'exclusao' THEN 'Exclusão de Registro - ' || COALESCE(hora_original, 'N/A')
              WHEN tipo_ajuste = 'adicao' THEN 'Adição de Registro - ' || hora_ajustada
              ELSE 'Ajuste de Ponto'
            END as descricao,
            usuario_ajuste_nome as usuario_responsavel,
            'Tipo: ' || tipo_ajuste ||
            CASE WHEN tipo_registro IS NOT NULL THEN ' | Registro: ' || tipo_registro ELSE '' END ||
            CASE WHEN observacoes IS NOT NULL THEN ' | Obs: ' || observacoes ELSE '' END as detalhes,
            justificativa,
            created_at
          FROM ajustes_ponto
          ${whereClause.replace(/data_inicio|data_fim/g, 'data_ajuste').replace(/usuario_cadastro_nome/g, 'usuario_ajuste_nome')}
        `;
      }

      if (filtros.tipo_operacao === 'afastamento' || filtros.tipo_operacao === 'todos') {
        if (query) query += ' UNION ALL ';

        query += `
          SELECT
            'afastamento' as tipo,
            id,
            funcionario_nome,
            data_inicio as data_operacao,
            CASE
              WHEN tipo_afastamento = 'atestado' THEN 'Atestado Médico'
              WHEN tipo_afastamento = 'ferias' THEN 'Férias'
              WHEN tipo_afastamento = 'licenca_maternidade' THEN 'Licença Maternidade'
              WHEN tipo_afastamento = 'licenca_paternidade' THEN 'Licença Paternidade'
              WHEN tipo_afastamento = 'licenca_sem_vencimento' THEN 'Licença sem Vencimento'
              WHEN tipo_afastamento = 'falta_justificada' THEN 'Falta Justificada'
              WHEN tipo_afastamento = 'falta_injustificada' THEN 'Falta Injustificada'
              WHEN tipo_afastamento = 'suspensao' THEN 'Suspensão'
              ELSE 'Afastamento'
            END || ' - ' || total_dias || ' dia(s)' as descricao,
            usuario_cadastro_nome as usuario_responsavel,
            'Período: ' || TO_CHAR(data_inicio, 'DD/MM/YYYY') || ' a ' || TO_CHAR(data_fim, 'DD/MM/YYYY') ||
            CASE WHEN documento_anexo_nome IS NOT NULL THEN ' | Anexo: ' || documento_anexo_nome ELSE '' END ||
            CASE WHEN observacoes IS NOT NULL THEN ' | Obs: ' || observacoes ELSE '' END as detalhes,
            motivo as justificativa,
            created_at
          FROM afastamentos
          ${whereClause.replace(/data_ajuste/g, 'data_inicio')}
          AND ativo = true
        `;
      }

      // Adicionar ordenação e paginação
      const offset = (paginaAtual - 1) * itensPorPagina;
      query += ` ORDER BY data_operacao DESC, created_at DESC LIMIT ${itensPorPagina} OFFSET ${offset}`;

      // Query separada para contar total
      let countQuery = '';
      if (filtros.tipo_operacao === 'ajuste' || filtros.tipo_operacao === 'todos') {
        countQuery += `SELECT COUNT(*) as count FROM ajustes_ponto ${whereClause.replace(/data_inicio|data_fim/g, 'data_ajuste').replace(/usuario_cadastro_nome/g, 'usuario_ajuste_nome')}`;
      }

      if (filtros.tipo_operacao === 'afastamento' || filtros.tipo_operacao === 'todos') {
        if (countQuery) countQuery += ' UNION ALL ';
        countQuery += `SELECT COUNT(*) as count FROM afastamentos ${whereClause.replace(/data_ajuste/g, 'data_inicio')} AND ativo = true`;
      }

      if (filtros.tipo_operacao === 'todos') {
        countQuery = `SELECT SUM(count) as total_count FROM (${countQuery}) combined`;
      }

      // Executar queries via MCP
      const [historicResult, countResult] = await Promise.all([
        (globalThis as any).mcp__supabase__execute_sql({ query }),
        (globalThis as any).mcp__supabase__execute_sql({ query: countQuery })
      ]);

      const historicoData: HistoricoItem[] = historicResult?.map((row: any) => ({
        id: row.id,
        tipo: row.tipo,
        funcionario_nome: row.funcionario_nome,
        data_operacao: row.data_operacao,
        descricao: row.descricao,
        usuario_responsavel: row.usuario_responsavel,
        detalhes: row.detalhes,
        justificativa: row.justificativa
      })) || [];

      const totalRegistros = filtros.tipo_operacao === 'todos'
        ? countResult?.[0]?.total_count || 0
        : countResult?.[0]?.count || 0;

      setHistorico(historicoData);
      setTotalPaginas(Math.ceil(totalRegistros / itensPorPagina));

    } catch (error) {
      console.error("Erro ao carregar histórico via MCP:", error);
      setHistorico([]);
      setTotalPaginas(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarHistorico();
    }
  }, [isOpen, filtros, paginaAtual]);

  const handleFiltroChange = (campo: keyof FiltrosHistorico, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor || undefined
    }));
    setPaginaAtual(1);
  };

  const limparFiltros = () => {
    setFiltros({ tipo_operacao: 'todos' });
    setPaginaAtual(1);
  };

  const handleExportar = async () => {
    try {
      // Buscar todos os dados sem paginação para exportação
      const whereConditions: string[] = [];

      if (filtros.funcionario_id) {
        whereConditions.push(`funcionario_id = '${filtros.funcionario_id}'`);
      }

      if (filtros.data_inicio) {
        whereConditions.push(`(data_ajuste >= '${filtros.data_inicio}' OR data_inicio >= '${filtros.data_inicio}')`);
      }

      if (filtros.data_fim) {
        whereConditions.push(`(data_ajuste <= '${filtros.data_fim}' OR data_fim <= '${filtros.data_fim}')`);
      }

      if (filtros.usuario_ajuste) {
        whereConditions.push(`(usuario_ajuste_nome ILIKE '%${filtros.usuario_ajuste}%' OR usuario_cadastro_nome ILIKE '%${filtros.usuario_ajuste}%')`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      let exportQuery = '';

      if (filtros.tipo_operacao === 'ajuste' || filtros.tipo_operacao === 'todos') {
        exportQuery += `
          SELECT
            'Ajuste' as tipo_operacao,
            funcionario_nome,
            TO_CHAR(data_ajuste, 'DD/MM/YYYY') as data,
            CASE
              WHEN tipo_ajuste = 'entrada' THEN 'Entrada'
              WHEN tipo_ajuste = 'saida' THEN 'Saída'
              WHEN tipo_ajuste = 'intervalo_entrada' THEN 'Entrada Intervalo'
              WHEN tipo_ajuste = 'intervalo_saida' THEN 'Saída Intervalo'
              WHEN tipo_ajuste = 'exclusao' THEN 'Exclusão'
              WHEN tipo_ajuste = 'adicao' THEN 'Adição'
              ELSE tipo_ajuste
            END as tipo_ajuste,
            COALESCE(hora_original, 'N/A') as hora_original,
            hora_ajustada,
            justificativa,
            usuario_ajuste_nome as responsavel,
            TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as data_operacao
          FROM ajustes_ponto
          ${whereClause.replace(/data_inicio|data_fim/g, 'data_ajuste').replace(/usuario_cadastro_nome/g, 'usuario_ajuste_nome')}
        `;
      }

      if (filtros.tipo_operacao === 'afastamento' || filtros.tipo_operacao === 'todos') {
        if (exportQuery) exportQuery += ' UNION ALL ';

        exportQuery += `
          SELECT
            'Afastamento' as tipo_operacao,
            funcionario_nome,
            TO_CHAR(data_inicio, 'DD/MM/YYYY') as data,
            CASE
              WHEN tipo_afastamento = 'atestado' THEN 'Atestado Médico'
              WHEN tipo_afastamento = 'ferias' THEN 'Férias'
              WHEN tipo_afastamento = 'licenca_maternidade' THEN 'Lic. Maternidade'
              WHEN tipo_afastamento = 'licenca_paternidade' THEN 'Lic. Paternidade'
              WHEN tipo_afastamento = 'licenca_sem_vencimento' THEN 'Lic. s/ Vencimento'
              WHEN tipo_afastamento = 'falta_justificada' THEN 'Falta Justificada'
              WHEN tipo_afastamento = 'falta_injustificada' THEN 'Falta Injustificada'
              WHEN tipo_afastamento = 'suspensao' THEN 'Suspensão'
              ELSE tipo_afastamento
            END as tipo_ajuste,
            TO_CHAR(data_inicio, 'DD/MM/YYYY') as hora_original,
            TO_CHAR(data_fim, 'DD/MM/YYYY') as hora_ajustada,
            motivo as justificativa,
            usuario_cadastro_nome as responsavel,
            TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as data_operacao
          FROM afastamentos
          ${whereClause.replace(/data_ajuste/g, 'data_inicio')}
          AND ativo = true
        `;
      }

      exportQuery += ' ORDER BY data_operacao DESC';

      const exportResult = await (globalThis as any).mcp__supabase__execute_sql({ query: exportQuery });

      // Converter para CSV
      const headers = [
        'Tipo de Operação',
        'Funcionário',
        'Data',
        'Tipo',
        'Hora/Data Inicial',
        'Hora/Data Final',
        'Justificativa/Motivo',
        'Responsável',
        'Data da Operação'
      ];

      const csvData = exportResult?.map((row: any) => [
        row.tipo_operacao,
        row.funcionario_nome,
        row.data,
        row.tipo_ajuste,
        row.hora_original,
        row.hora_ajustada,
        row.justificativa,
        row.responsavel,
        row.data_operacao
      ]) || [];

      const csvContent = [
        headers.join(','),
        ...csvData.map((row: string[]) =>
          row.map(field => `"${field?.toString().replace(/"/g, '""') || ''}"`).join(',')
        )
      ].join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historico-ajustes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Erro ao exportar relatório:", error);
      alert("Erro ao exportar relatório. Tente novamente.");
    }
  };

  const formatarDataHora = (dataISO: string) => {
    try {
      return format(new Date(dataISO), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dataISO;
    }
  };

  const obterCorTipo = (tipo: 'ajuste' | 'afastamento') => {
    return tipo === 'ajuste'
      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      : 'bg-green-100 text-green-800 hover:bg-green-200';
  };

  const historicoPaginado = historico.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Ajustes e Afastamentos
          </DialogTitle>
          <DialogDescription>
            Consulte todos os ajustes de ponto e registros de afastamento realizados.
          </DialogDescription>
        </DialogHeader>

        {/* Filtros */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {/* Linha 1: Funcionário, Tipo, Responsável */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              value={filtros.funcionario_id || "todos"}
              onValueChange={(value) => handleFiltroChange('funcionario_id', value === 'todos' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os funcionários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os funcionários</SelectItem>
                {funcionarios.map((func) => (
                  <SelectItem key={func.id} value={func.id}>
                    {func.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filtros.tipo_operacao || "todos"}
              onValueChange={(value) => handleFiltroChange('tipo_operacao', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de operação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="ajuste">Ajustes de Ponto</SelectItem>
                <SelectItem value="afastamento">Afastamentos</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="text"
              placeholder="Buscar por responsável..."
              value={filtros.usuario_ajuste || ''}
              onChange={(e) => handleFiltroChange('usuario_ajuste', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Linha 2: Datas e Ações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <Input
                type="date"
                value={filtros.data_inicio || ''}
                onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <Input
                type="date"
                value={filtros.data_fim || ''}
                onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={limparFiltros}
                className="flex-1"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
              <Button
                variant="outline"
                onClick={carregarHistorico}
                disabled={isLoading}
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>

          {/* Resumo dos filtros ativos */}
          {(filtros.funcionario_id || filtros.tipo_operacao !== 'todos' || filtros.data_inicio || filtros.data_fim || filtros.usuario_ajuste) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">Filtros ativos:</span>
              {filtros.funcionario_id && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  Funcionário: {funcionarios.find(f => f.id === filtros.funcionario_id)?.nome}
                </span>
              )}
              {filtros.tipo_operacao && filtros.tipo_operacao !== 'todos' && (
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  Tipo: {filtros.tipo_operacao === 'ajuste' ? 'Ajustes' : 'Afastamentos'}
                </span>
              )}
              {filtros.data_inicio && (
                <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                  Início: {new Date(filtros.data_inicio).toLocaleDateString('pt-BR')}
                </span>
              )}
              {filtros.data_fim && (
                <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                  Fim: {new Date(filtros.data_fim).toLocaleDateString('pt-BR')}
                </span>
              )}
              {filtros.usuario_ajuste && (
                <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                  Responsável: {filtros.usuario_ajuste}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabela de Histórico */}
        <ScrollArea className="max-h-[400px] border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Funcionário</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando histórico...
                  </TableCell>
                </TableRow>
              ) : historicoPaginado.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                historicoPaginado.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge className={obterCorTipo(item.tipo)}>
                        {item.tipo === 'ajuste' ? 'Ajuste' : 'Afastamento'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.funcionario_nome}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatarDataHora(item.data_operacao)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.descricao}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.usuario_responsavel}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetalhesAjuste(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Paginação e Ações */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
          <div className="flex flex-col gap-1">
            <div className="text-sm text-gray-600">
              {historico.length > 0 ? (
                <>
                  Exibindo {((paginaAtual - 1) * itensPorPagina) + 1} a{' '}
                  {Math.min(paginaAtual * itensPorPagina, historico.length)} de{' '}
                  {historico.length} registros encontrados
                </>
              ) : (
                'Nenhum registro encontrado'
              )}
            </div>
            {totalPaginas > 1 && (
              <div className="text-xs text-gray-500">
                Página {paginaAtual} de {totalPaginas} ({itensPorPagina} itens por página)
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Navegação de páginas */}
            {totalPaginas > 1 && (
              <div className="flex gap-1 mr-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(1)}
                  disabled={paginaAtual === 1 || isLoading}
                  title="Primeira página"
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                  disabled={paginaAtual === 1 || isLoading}
                  title="Página anterior"
                >
                  ‹
                </Button>

                {/* Números de páginas */}
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let pageNum;
                  if (totalPaginas <= 5) {
                    pageNum = i + 1;
                  } else if (paginaAtual <= 3) {
                    pageNum = i + 1;
                  } else if (paginaAtual >= totalPaginas - 2) {
                    pageNum = totalPaginas - 4 + i;
                  } else {
                    pageNum = paginaAtual - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={paginaAtual === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaginaAtual(pageNum)}
                      disabled={isLoading}
                      className={paginaAtual === pageNum ? "bg-primary text-primary-foreground" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaAtual === totalPaginas || isLoading}
                  title="Próxima página"
                >
                  ›
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(totalPaginas)}
                  disabled={paginaAtual === totalPaginas || isLoading}
                  title="Última página"
                >
                  »
                </Button>
              </div>
            )}

            {/* Ações */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportar}
              disabled={isLoading}
              title="Exportar dados filtrados para CSV"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Modal de Detalhes */}
        {detalhesAjuste && (
          <Dialog open={!!detalhesAjuste} onOpenChange={() => setDetalhesAjuste(null)}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Detalhes do Registro</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tipo</label>
                    <p className="text-sm">{detalhesAjuste.tipo === 'ajuste' ? 'Ajuste de Ponto' : 'Afastamento'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Funcionário</label>
                    <p className="text-sm">{detalhesAjuste.funcionario_nome}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Data/Hora</label>
                  <p className="text-sm">{formatarDataHora(detalhesAjuste.data_operacao)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Responsável</label>
                  <p className="text-sm">{detalhesAjuste.usuario_responsavel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Descrição</label>
                  <p className="text-sm">{detalhesAjuste.descricao}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Detalhes</label>
                  <p className="text-sm">{detalhesAjuste.detalhes}</p>
                </div>
                {detalhesAjuste.justificativa && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Justificativa</label>
                    <p className="text-sm">{detalhesAjuste.justificativa}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}