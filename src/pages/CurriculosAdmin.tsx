import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Eye,
  Filter,
  Search,
  Calendar,
  User,
  Mail,
  Phone,
  FileText,
  Trash2,
  Edit3
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Curriculo, STATUS_COLORS, STATUS_LABELS } from "@/types/curriculo";


export default function CurriculosAdmin() {
  const [curriculos, setCurriculos] = useState<Curriculo[]>([]);
  const [filteredCurriculos, setFilteredCurriculos] = useState<Curriculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [cargoFilter, setCargoFilter] = useState("todos");
  const [selectedCurriculo, setSelectedCurriculo] = useState<Curriculo | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newObservacoes, setNewObservacoes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchCurriculos();
  }, []);

  useEffect(() => {
    filterCurriculos();
  }, [curriculos, searchTerm, statusFilter, cargoFilter]);

  const fetchCurriculos = async () => {
    try {
      const { data, error } = await supabase
        .from('curriculos')
        .select('*')
        .order('data_envio', { ascending: false });

      if (error) throw error;

      setCurriculos(data || []);
    } catch (error) {
      console.error('Erro ao carregar currículos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os currículos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCurriculos = () => {
    let filtered = curriculos;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(curriculo =>
        curriculo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        curriculo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        curriculo.cargo_interesse.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== "todos") {
      filtered = filtered.filter(curriculo => curriculo.status === statusFilter);
    }

    // Filtro por cargo
    if (cargoFilter !== "todos") {
      filtered = filtered.filter(curriculo => curriculo.cargo_interesse === cargoFilter);
    }

    setFilteredCurriculos(filtered);
  };

  const downloadArquivo = async (curriculo: Curriculo) => {
    try {
      const { data, error } = await supabase.storage
        .from('curriculos')
        .download(curriculo.arquivo_url);

      if (error) throw error;

      // Criar URL para download
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = curriculo.arquivo_nome;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o arquivo",
        variant: "destructive",
      });
    }
  };

  const atualizarCurriculo = async () => {
    if (!selectedCurriculo) return;

    try {
      const { error } = await supabase
        .from('curriculos')
        .update({
          status: newStatus,
          observacoes: newObservacoes
        })
        .eq('id', selectedCurriculo.id);

      if (error) throw error;

      toast({
        title: "Currículo atualizado",
        description: "Status e observações foram atualizados",
      });

      setIsEditModalOpen(false);
      fetchCurriculos();

    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o currículo",
        variant: "destructive",
      });
    }
  };

  const excluirCurriculo = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este currículo?")) return;

    try {
      const { error } = await supabase
        .from('curriculos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Currículo excluído",
        description: "O currículo foi removido com sucesso",
      });

      fetchCurriculos();

    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o currículo",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const cargosUnicos = [...new Set(curriculos.map(c => c.cargo_interesse))];

  const openDetailModal = (curriculo: Curriculo) => {
    setSelectedCurriculo(curriculo);
    setIsDetailModalOpen(true);
  };

  const openEditModal = (curriculo: Curriculo) => {
    setSelectedCurriculo(curriculo);
    setNewStatus(curriculo.status);
    setNewObservacoes(curriculo.observacoes || "");
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Carregando currículos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Currículos Recebidos ({filteredCurriculos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar por nome, email ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="analisando">Analisando</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cargoFilter} onValueChange={setCargoFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Cargos</SelectItem>
                {cargosUnicos.map((cargo) => (
                  <SelectItem key={cargo} value={cargo}>
                    {cargo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Currículos */}
          <div className="space-y-4">
            {filteredCurriculos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum currículo encontrado
              </div>
            ) : (
              filteredCurriculos.map((curriculo) => (
                <Card key={curriculo.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <strong>{curriculo.nome}</strong>
                        </div>
                        <Badge className={STATUS_COLORS[curriculo.status]}>
                          {STATUS_LABELS[curriculo.status]}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {curriculo.email}
                        </div>
                        {curriculo.telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {curriculo.telefone}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(curriculo.data_envio)}
                        </div>
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">Cargo:</span> {curriculo.cargo_interesse}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailModal(curriculo)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadArquivo(curriculo)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(curriculo)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => excluirCurriculo(curriculo.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Currículo</DialogTitle>
          </DialogHeader>
          {selectedCurriculo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium">Nome:</label>
                  <p>{selectedCurriculo.nome}</p>
                </div>
                <div>
                  <label className="font-medium">Email:</label>
                  <p>{selectedCurriculo.email}</p>
                </div>
                <div>
                  <label className="font-medium">Telefone:</label>
                  <p>{selectedCurriculo.telefone || "Não informado"}</p>
                </div>
                <div>
                  <label className="font-medium">Cargo:</label>
                  <p>{selectedCurriculo.cargo_interesse}</p>
                </div>
                <div>
                  <label className="font-medium">Status:</label>
                  <Badge className={STATUS_COLORS[selectedCurriculo.status]}>
                    {STATUS_LABELS[selectedCurriculo.status]}
                  </Badge>
                </div>
                <div>
                  <label className="font-medium">Data de Envio:</label>
                  <p>{formatDate(selectedCurriculo.data_envio)}</p>
                </div>
              </div>

              <div>
                <label className="font-medium">Experiência:</label>
                <p className="mt-1 text-sm">{selectedCurriculo.experiencia || "Não informado"}</p>
              </div>

              <div>
                <label className="font-medium">Observações:</label>
                <p className="mt-1 text-sm">{selectedCurriculo.observacoes || "Nenhuma observação"}</p>
              </div>

              <div>
                <label className="font-medium">Arquivo:</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm">{selectedCurriculo.arquivo_nome}</span>
                  <span className="text-sm text-gray-500">
                    ({formatFileSize(selectedCurriculo.arquivo_tamanho)})
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadArquivo(selectedCurriculo)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Currículo</DialogTitle>
          </DialogHeader>
          {selectedCurriculo && (
            <div className="space-y-4">
              <div>
                <label className="font-medium">Candidato:</label>
                <p className="text-sm text-gray-600">{selectedCurriculo.nome}</p>
              </div>

              <div>
                <label className="font-medium">Status:</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="analisando">Analisando</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-medium">Observações:</label>
                <Textarea
                  value={newObservacoes}
                  onChange={(e) => setNewObservacoes(e.target.value)}
                  placeholder="Adicione observações sobre o currículo..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={atualizarCurriculo}>
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}