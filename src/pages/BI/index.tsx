import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Plus,
  FileText,
  Edit,
  Trash2,
  Calendar,
  User,
  Download,
  Eye,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import type { RelatorioBi } from "@/types/bi";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const BIDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Buscar relatórios do usuário
  const { data: relatorios = [], isLoading } = useOptimizedSupabaseQuery<RelatorioBi>('RELATORIOS_BI');
  const { delete: deleteRelatorio } = useSupabaseCRUD<RelatorioBi>('RELATORIOS_BI');

  // Estatísticas rápidas
  const totalRelatorios = relatorios.length;
  const relatoriosAtivos = relatorios.filter(r => r.ativo).length;
  const ultimoAcesso = relatorios.length > 0
    ? relatorios.reduce((latest, current) =>
        new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest
      ).updated_at
    : null;

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteRelatorio.mutateAsync(deleteId);
        toast({
          title: "Relatório excluído!",
          description: "O relatório foi removido com sucesso.",
        });
        setDeleteId(null);
      } catch (error) {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o relatório.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = (relatorioId: string) => {
    navigate(`/bi/builder?edit=${relatorioId}`);
  };

  const handleView = (relatorioId: string) => {
    navigate(`/bi/visualizer/${relatorioId}`);
  };

  const getSetorlabel = (setor: string) => {
    const setores = {
      'financeiro': 'Financeiro',
      'obras': 'Obras',
      'rh': 'RH',
      'geral': 'Geral'
    };
    return setores[setor as keyof typeof setores] || setor;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Business Intelligence
          </h1>
          <p className="page-description">
            Crie e gerencie relatórios personalizados com dados do setor financeiro
          </p>
        </div>
        <Button onClick={() => navigate('/bi/builder')} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Relatório
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Relatórios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRelatorios}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>{relatoriosAtivos} ativos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Setor Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Financeiro</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Foco atual do BI</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Último Acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ultimoAcesso
                ? format(new Date(ultimoAcesso), 'dd/MM', { locale: ptBR })
                : '--'
              }
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {ultimoAcesso
                  ? format(new Date(ultimoAcesso), 'HH:mm', { locale: ptBR })
                  : 'Nenhum acesso'
                }
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Relatórios Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{relatoriosAtivos}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>Seus relatórios</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle>Seus Relatórios</CardTitle>
          <CardDescription>
            Relatórios personalizados criados por você
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Loading State
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-60 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : relatorios.length === 0 ? (
            // Empty State
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum relatório criado ainda</h3>
              <p className="text-muted-foreground mb-6">
                Crie seu primeiro relatório personalizado para começar a analisar dados financeiros
              </p>
              <Button onClick={() => navigate('/bi/builder')} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeiro Relatório
              </Button>
            </div>
          ) : (
            // Lista de Relatórios
            <div className="space-y-3">
              {relatorios.map((relatorio) => (
                <div
                  key={relatorio.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{relatorio.nome}</h4>
                        <Badge variant="outline">
                          {getSetorlabel(relatorio.setor)}
                        </Badge>
                        {!relatorio.ativo && (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {relatorio.descricao && (
                          <p>{relatorio.descricao}</p>
                        )}
                        <div className="flex items-center gap-4">
                          <span>
                            {relatorio.campos_selecionados.length} campos selecionados
                          </span>
                          <span>
                            Criado em {format(new Date(relatorio.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          {relatorio.updated_at !== relatorio.created_at && (
                            <span>
                              Editado em {format(new Date(relatorio.updated_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(relatorio.id)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(relatorio.id)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(relatorio.id)}
                      className="gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de confirmação de exclusão */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteId(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BIDashboard;