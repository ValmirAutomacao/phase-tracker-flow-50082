// 🤖 CLAUDE-NOTE: Página para gerenciar afastamentos - separada do controle de ponto
// 📅 Criado em: 2024-11-29
// 🎯 Propósito: CRUD completo de afastamentos com aprovação e status

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserMinus,
  Plus,
  Edit,
  Trash2,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { ModalAfastamento } from "@/components/RH/ModalAfastamento";
import {
  Afastamento,
  FuncionarioCompleto
} from "@/types/ponto";

export default function GerenciarAfastamentos() {
  const { toast } = useToast();
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [afastamentoEdit, setAfastamentoEdit] = useState<Afastamento | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);

      // Buscar afastamentos com relacionamentos
      const { data: afastamentosData, error: afastamentosError } = await supabase
        .from('afastamentos')
        .select(`
          *,
          funcionario:funcionario_id(id, nome, email),
          tipo_afastamento:tipo_afastamento_id(id, nome, categoria, cor, remunerado),
          solicitado_por:solicitado_por_id(id, nome),
          aprovado_por:aprovado_por_id(id, nome)
        `)
        .order('created_at', { ascending: false });

      if (afastamentosError) throw afastamentosError;
      setAfastamentos(afastamentosData || []);

      // Buscar funcionários ativos
      const { data: funcionariosData, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select(`
          *,
          funcao:funcao_id(id, nome, nivel),
          jornada:jornada_trabalho_id(id, nome)
        `)
        .eq('ativo', true)
        .order('nome');

      if (funcionariosError) throw funcionariosError;
      setFuncionarios(funcionariosData || []);


    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNovoAfastamento = () => {
    setAfastamentoEdit(null);
    setModalOpen(true);
  };

  const handleEditarAfastamento = (afastamento: Afastamento) => {
    setAfastamentoEdit(afastamento);
    setModalOpen(true);
  };

  const handleAprovarAfastamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('afastamentos')
        .update({
          status: 'aprovado',
          data_aprovacao: new Date().toISOString(),
          aprovado_por_id: 'current_user_id' // TODO: Pegar do contexto de auth
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Afastamento aprovado!",
        description: "O afastamento foi aprovado com sucesso.",
      });

      carregarDados();
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar",
        description: error.message || "Ocorreu um erro ao aprovar o afastamento",
        variant: "destructive",
      });
    }
  };

  const handleRejeitarAfastamento = async (id: string, motivo: string) => {
    try {
      const { error } = await supabase
        .from('afastamentos')
        .update({
          status: 'rejeitado',
          motivo_rejeicao: motivo,
          aprovado_por_id: 'current_user_id' // TODO: Pegar do contexto de auth
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Afastamento rejeitado",
        description: "O afastamento foi rejeitado.",
        variant: "destructive",
      });

      carregarDados();
    } catch (error: any) {
      toast({
        title: "Erro ao rejeitar",
        description: error.message || "Ocorreu um erro ao rejeitar o afastamento",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case 'cancelado':
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p>Carregando afastamentos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5" />
              Gerenciar Afastamentos
            </CardTitle>
            <Button onClick={handleNovoAfastamento} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Afastamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Solicitado por</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {afastamentos.map((afastamento) => (
                  <TableRow key={afastamento.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{afastamento.funcionario?.nome}</div>
                        <div className="text-sm text-gray-500">{afastamento.funcionario?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: (afastamento.tipo_afastamento as { cor?: string })?.cor }}
                        />
                        <span className="font-medium">{(afastamento.tipo_afastamento as { nome?: string })?.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {formatDate(afastamento.data_inicio)} - {formatDate(afastamento.data_fim)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {afastamento.total_dias} dias
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(afastamento.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{afastamento.solicitado_por?.nome}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditarAfastamento(afastamento)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {afastamento.status === 'pendente' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAprovarAfastamento(afastamento.id)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejeitarAfastamento(afastamento.id, 'Rejeitado pelo gestor')}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {afastamento.documento_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(afastamento.documento_url, '_blank')}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {afastamentos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Nenhum afastamento encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ModalAfastamento
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        funcionarios={funcionarios}
        onSubmit={async (data) => {
          try {
            const afastamentoData = {
              funcionario_id: data.funcionario_id,
              tipo_afastamento_id: data.tipo_afastamento_id,
              data_inicio: data.data_inicio,
              data_fim: data.data_fim,
              motivo: data.motivo,
              observacoes: data.observacoes,
              documento_url: data.arquivo ? 'arquivo_url_aqui' : null, // TODO: Implementar upload
              status: 'pendente',
              solicitado_por_id: 'current_user_id',
              total_dias: Math.ceil((new Date(data.data_fim).getTime() - new Date(data.data_inicio).getTime()) / (1000 * 60 * 60 * 24)) + 1,
            };

            if (afastamentoEdit) {
              const { error } = await supabase
                .from('afastamentos')
                .update(afastamentoData)
                .eq('id', afastamentoEdit.id);

              if (error) throw error;

              toast({
                title: "Afastamento atualizado!",
                description: "O afastamento foi atualizado com sucesso.",
              });
            } else {
              const { error } = await supabase
                .from('afastamentos')
                .insert([afastamentoData]);

              if (error) throw error;

              toast({
                title: "Afastamento criado!",
                description: "O afastamento foi registrado com sucesso.",
              });
            }

            carregarDados();
            setModalOpen(false);
            setAfastamentoEdit(null);
          } catch (error: any) {
            console.error('Erro ao salvar afastamento:', error);
            toast({
              title: "Erro ao salvar",
              description: error.message || "Ocorreu um erro ao salvar o afastamento",
              variant: "destructive",
            });
          }
        }}
        funcionarioSelecionado={afastamentoEdit?.funcionario_id}
      />
    </div>
  );
}