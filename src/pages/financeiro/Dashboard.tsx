import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Receipt,
  CreditCard,
  AlertCircle,
  Plus,
  CalendarDays,
  Building2,
  BarChart3
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NavLink } from "react-router-dom";

interface DespesaData {
  id: string;
  valor: number;
  categoria?: string;
  created_at: string;
  obra_id?: string;
  status?: string;
  tipo?: 'requisicao' | 'variavel';
}

interface ObraData {
  id: string;
  nome: string;
  orcamento?: number;
}

const Dashboard = () => {
  // Queries para dados financeiros
  const { data: despesasRequisicao = [] } = useOptimizedSupabaseQuery<any>('DESPESAS');
  const { data: despesasVariaveis = [] } = useOptimizedSupabaseQuery<any>('DESPESAS_VARIAVEIS');
  const { data: obras = [] } = useOptimizedSupabaseQuery<any>('OBRAS');
  const { data: cartoes = [] } = useOptimizedSupabaseQuery<any>('CARTOES_CREDITO');

  // Função para converter valor string para number
  const parseValor = (valor: any): number => {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') {
      const parsed = parseFloat(valor);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Combinar todas as despesas e garantir conversão de valores
  const todasDespesas = [
    ...despesasRequisicao.map(d => ({
      ...d,
      tipo: 'requisicao' as const,
      valor: parseValor(d.valor)
    })),
    ...despesasVariaveis.map(d => ({
      ...d,
      tipo: 'variavel' as const,
      valor: parseValor(d.valor_compra) // despesas_variaveis usa valor_compra
    }))
  ];

  // Cálculos de KPIs
  const mesAtual = new Date();
  const mesPassado = subMonths(mesAtual, 1);

  const despesasMesAtual = todasDespesas.filter(d => {
    const data = new Date(d.created_at);
    return data >= startOfMonth(mesAtual) && data <= endOfMonth(mesAtual);
  });

  const despesasMesPassado = todasDespesas.filter(d => {
    const data = new Date(d.created_at);
    return data >= startOfMonth(mesPassado) && data <= endOfMonth(mesPassado);
  });

  const totalMesAtual = despesasMesAtual.reduce((acc, d) => acc + d.valor, 0);
  const totalMesPassado = despesasMesPassado.reduce((acc, d) => acc + d.valor, 0);
  const totalGeral = todasDespesas.reduce((acc, d) => acc + d.valor, 0);

  const variacao = totalMesPassado > 0 ? ((totalMesAtual - totalMesPassado) / totalMesPassado) * 100 : 0;

  // Despesas por categoria (top 5)
  const despesasPorCategoria = todasDespesas.reduce((acc, despesa) => {
    const categoria = despesa.categoria || despesa.categorias?.[0] || 'Sem categoria';
    acc[categoria] = (acc[categoria] || 0) + despesa.valor;
    return acc;
  }, {} as Record<string, number>);

  const topCategorias = Object.entries(despesasPorCategoria)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([categoria, valor]) => ({ categoria, valor }));

  // Despesas por obra (top 5)
  const despesasPorObra = todasDespesas.reduce((acc, despesa) => {
    if (despesa.obra_id) {
      const obra = obras.find(o => o.id === despesa.obra_id);
      const nomeObra = obra?.nome || `Obra ${despesa.obra_id.slice(0, 8)}`;
      acc[nomeObra] = (acc[nomeObra] || 0) + despesa.valor;
    }
    return acc;
  }, {} as Record<string, number>);

  const topObras = Object.entries(despesasPorObra)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([obra, valor]) => ({ obra, valor }));

  // Dados para gráfico de evolução mensal
  const ultimosSeisMeses = Array.from({ length: 6 }, (_, i) => {
    const data = subMonths(mesAtual, 5 - i);
    const despesasMes = todasDespesas.filter(d => {
      const despesaData = new Date(d.created_at);
      return despesaData >= startOfMonth(data) && despesaData <= endOfMonth(data);
    });

    const requisicoes = despesasMes.filter(d => d.tipo === 'requisicao');
    const variaveis = despesasMes.filter(d => d.tipo === 'variavel');

    return {
      mes: format(data, 'MMM/yy', { locale: ptBR }),
      requisicoes: requisicoes.reduce((acc, d) => acc + d.valor, 0),
      variaveis: variaveis.reduce((acc, d) => acc + d.valor, 0),
      total: despesasMes.reduce((acc, d) => acc + d.valor, 0)
    };
  });

  // Cores para os gráficos
  const cores = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
        <p className="text-muted-foreground">Visão geral dos gastos e indicadores financeiros</p>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mês Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalMesAtual)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {variacao > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">+{variacao.toFixed(1)}%</span>
                </>
              ) : variacao < 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">{variacao.toFixed(1)}%</span>
                </>
              ) : (
                <span>sem variação</span>
              )}
              <span>vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas por Requisição</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(despesasMesAtual.filter(d => d.tipo === 'requisicao').reduce((acc, d) => acc + (d.valor || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {despesasMesAtual.filter(d => d.tipo === 'requisicao').length} transações este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Variáveis</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(despesasMesAtual.filter(d => d.tipo === 'variavel').reduce((acc, d) => acc + (d.valor || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {despesasMesAtual.filter(d => d.tipo === 'variavel').length} transações este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartões Ativos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cartoes.filter(c => c.ativo).length}</div>
            <p className="text-xs text-muted-foreground">
              de {cartoes.length} cartões cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução das Despesas</CardTitle>
            <CardDescription>Últimos 6 meses por tipo de despesa</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ultimosSeisMeses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value: number) => [
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(value)
                ]} />
                <Bar dataKey="requisicoes" stackId="a" fill="#0088FE" name="Requisições" />
                <Bar dataKey="variaveis" stackId="a" fill="#00C49F" name="Variáveis" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Despesas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Categorias</CardTitle>
            <CardDescription>Categorias com mais gastos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topCategorias}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="valor"
                  label={({ categoria, percent }) => `${categoria} (${(percent * 100).toFixed(0)}%)`}
                >
                  {topCategorias.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(value)
                ]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Obras e Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Obras */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Obras por Gastos</CardTitle>
            <CardDescription>Obras com mais despesas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topObras.map((item, index) => (
                <div key={item.obra} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{item.obra}</p>
                      <p className="text-sm text-muted-foreground">#{index + 1}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(item.valor)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesse rapidamente as funcionalidades financeiras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <NavLink to="/financeiro/despesas-requisicao">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">Despesas por Requisição</span>
                </Button>
              </NavLink>

              <NavLink to="/financeiro/despesas-variaveis">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                  <Receipt className="h-6 w-6" />
                  <span className="text-sm">Nova Despesa Variável</span>
                </Button>
              </NavLink>

              <NavLink to="/financeiro/cartoes-credito">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  <span className="text-sm">Cartões de Crédito</span>
                </Button>
              </NavLink>

              <Button variant="outline" className="w-full h-20 flex flex-col items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">Relatórios</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Notificações */}
      {variacao > 20 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Atenção: Aumento significativo de gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              Os gastos deste mês aumentaram {variacao.toFixed(1)}% em relação ao mês anterior.
              Considere revisar as despesas e orçamentos das obras.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;