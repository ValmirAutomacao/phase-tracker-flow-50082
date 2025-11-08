import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  FileText,
  Package,
  Calendar,
  Building,
  User,
  Receipt,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { formatCurrency } from "@/lib/utils";

const DespesasDetalhes = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const obraParam = searchParams.get('obra');
  const despesaParam = searchParams.get('despesa');

  // Buscar dados
  const { data: despesas = [] } = useSupabaseQuery<any>('DESPESAS');
  const { data: itensRequisicao = [] } = useSupabaseQuery<any>('ITENS_REQUISICAO');
  const { data: clientes = [] } = useSupabaseQuery<any>('CLIENTES');
  const { data: obras = [] } = useSupabaseQuery<any>('OBRAS');

  // Filtrar despesas por obra ou despesa específica
  const despesasFiltradas = useMemo(() => {
    if (despesaParam) {
      return despesas.filter(d => d.id === despesaParam);
    }
    if (obraParam) {
      return despesas.filter(d => d.obra?.nome === obraParam);
    }
    return despesas;
  }, [despesas, obraParam, despesaParam]);

  // Enriquecer despesas com dados de relacionamento
  const despesasEnriquecidas = useMemo(() => {
    return despesasFiltradas.map(despesa => {
      const cliente = clientes.find(c => c.id === despesa.cliente_id);
      const obra = obras.find(o => o.id === despesa.obra_id);

      // Buscar itens da requisição
      const itens = itensRequisicao.filter(item => item.requisicao_id === despesa.requisicao_id);

      return {
        ...despesa,
        cliente,
        obra,
        itens
      };
    });
  }, [despesasFiltradas, clientes, obras, itensRequisicao]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pendente" },
      validado: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Validado" },
      rejeitado: { color: "bg-red-100 text-red-800", icon: AlertTriangle, label: "Rejeitado" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const calcularValorItens = (itens: any[]) => {
    return itens.reduce((total, item) => {
      const quantidade = Number(item.quantidade) || 0;
      const valorUnitario = Number(item.valor_unitario) || 0;
      return total + (quantidade * valorUnitario);
    }, 0);
  };

  if (despesasEnriquecidas.length === 0) {
    return (
      <div className="flex-1 p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/financeiro')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Detalhes de Despesas</h1>
        </div>

        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma despesa encontrada para os filtros aplicados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate('/financeiro')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">
          Detalhes de Despesas
          {obraParam && ` - ${obraParam}`}
        </h1>
      </div>

      <div className="space-y-6">
        {despesasEnriquecidas.map((despesa) => (
          <Card key={despesa.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Despesa - {despesa.categoria || 'Sem categoria'}
                  </CardTitle>
                  <CardDescription>
                    Criada em {new Date(despesa.created_at || despesa.data_despesa || '').toLocaleDateString('pt-BR')}
                  </CardDescription>
                </div>
                <div className="text-right">
                  {getStatusBadge(despesa.status || 'pendente')}
                  <div className="text-2xl font-bold mt-2">
                    {formatCurrency(despesa.valor)}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Cliente:</span>
                    <span>{despesa.cliente?.nome || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Obra:</span>
                    <span>{despesa.obra?.nome || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Data:</span>
                    <span>{new Date(despesa.data_despesa).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {despesa.fornecedor_cnpj && (
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">CNPJ Fornecedor:</span>
                      <span>{despesa.fornecedor_cnpj}</span>
                    </div>
                  )}
                  {despesa.numero_documento && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Documento:</span>
                      <span>{despesa.numero_documento}</span>
                    </div>
                  )}
                  {despesa.observacao && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="font-medium">Observação:</span>
                      <span className="text-sm">{despesa.observacao}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Comprovante */}
              {despesa.comprovante_url && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Comprovante
                    </h3>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <a
                        href={despesa.comprovante_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Ver comprovante
                      </a>
                    </div>
                  </div>
                </>
              )}

              {/* Itens da Requisição */}
              {despesa.itens && despesa.itens.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Itens da Requisição ({despesa.itens.length})
                    </h3>
                    <div className="space-y-2">
                      {despesa.itens.map((item: any, index: number) => (
                        <div key={item.id || index} className="border rounded-lg p-4 bg-muted/50">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Número</p>
                              <p className="font-medium">{item.numero}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                              <p className="font-medium">{item.descricao}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Qtd.</p>
                                <p className="font-medium">{item.quantidade} {item.unidade_medida}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Valor Unit.</p>
                                <p className="font-medium">{formatCurrency(item.valor_unitario)}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Total</p>
                              <p className="font-bold text-lg">
                                {formatCurrency(Number(item.quantidade) * Number(item.valor_unitario))}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Total dos Itens */}
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total dos Itens:</span>
                          <span className="text-xl font-bold">
                            {formatCurrency(calcularValorItens(despesa.itens))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DespesasDetalhes;