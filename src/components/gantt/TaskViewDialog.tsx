import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  User, 
  Pencil, 
  Users, 
  Trash2,
  Plus,
  Diamond,
  FolderTree,
  Link2,
  X
} from "lucide-react";
import { Tarefa } from "@/services/projectService";
import { useTarefaResponsaveis } from "@/hooks/useTarefaResponsaveis";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TaskViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Tarefa | null;
  allTasks: Tarefa[];
  onEdit: () => void;
  onDelete: (id: string) => void;
}

export function TaskViewDialog({ 
  open, 
  onOpenChange, 
  task, 
  allTasks,
  onEdit, 
  onDelete 
}: TaskViewDialogProps) {
  const [showAddResponsavel, setShowAddResponsavel] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState<string>("");

  const { responsaveis, isLoading: loadingResp, addResponsavel, removeResponsavel } = useTarefaResponsaveis(task?.id || null);

  // Buscar funcionários disponíveis
  const { data: funcionarios = [] } = useQuery({
    queryKey: ['funcionarios-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome, email, funcoes:funcao_id(nome)')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  if (!task) return null;

  const tipoLabels = {
    tarefa: "Tarefa",
    etapa: "Etapa/Fase",
    marco: "Marco"
  };

  const getStatusInfo = () => {
    if (task.percentual_concluido === 100) return { label: "Concluído", color: "bg-emerald-500" };
    if (task.percentual_concluido >= 50) return { label: "Em andamento", color: "bg-sky-500" };
    if (task.percentual_concluido > 0) return { label: "Iniciado", color: "bg-amber-400" };
    return { label: "Não iniciado", color: "bg-slate-400" };
  };

  const status = getStatusInfo();

  // Encontrar tarefa pai
  const parentTask = task.parent_id ? allTasks.find(t => t.id === task.parent_id) : null;

  // Encontrar predecessoras (dependências)
  const predecessoras = allTasks.filter(t => task.dependencias?.includes(t.id));

  // Funcionários já responsáveis (IDs)
  const responsaveisIds = responsaveis.map(r => r.funcionario_id);

  // Funcionários disponíveis para adicionar
  const funcionariosDisponiveis = funcionarios.filter(f => !responsaveisIds.includes(f.id));

  const handleAddResponsavel = () => {
    if (selectedFuncionario) {
      addResponsavel({ funcionarioId: selectedFuncionario });
      setSelectedFuncionario("");
      setShowAddResponsavel(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {task.tipo === "marco" && <Diamond className="h-5 w-5 text-amber-500" />}
              <DialogTitle className="text-xl">{task.nome}</DialogTitle>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline">{tipoLabels[task.tipo]}</Badge>
              <div className={`w-3 h-3 rounded-full ${status.color}`} />
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {/* Progresso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{task.percentual_concluido}%</span>
              </div>
              <Progress value={task.percentual_concluido} className="h-2" />
              <p className="text-sm text-muted-foreground">{status.label}</p>
            </div>

            <Separator />

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Início</p>
                  <p className="font-medium">
                    {task.data_inicio_planejada 
                      ? format(new Date(task.data_inicio_planejada), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Término</p>
                  <p className="font-medium">
                    {task.data_fim_planejada 
                      ? format(new Date(task.data_fim_planejada), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Duração */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Duração</p>
                <p className="font-medium">{task.duracao_dias || 1} dias</p>
              </div>
            </div>

            <Separator />

            {/* Hierarquia */}
            {parentTask && (
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Pertence a</p>
                  <p className="font-medium">{parentTask.nome}</p>
                </div>
              </div>
            )}

            {/* Dependências */}
            {predecessoras.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Depende de</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {predecessoras.map(pred => (
                    <Badge key={pred.id} variant="secondary" className="text-xs">
                      {pred.nome}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Responsáveis */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium text-sm">Responsáveis</p>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowAddResponsavel(!showAddResponsavel)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {showAddResponsavel && (
                <div className="flex gap-2 items-center bg-muted/50 p-2 rounded">
                  <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
                    <SelectTrigger className="flex-1 h-8">
                      <SelectValue placeholder="Selecione um funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionariosDisponiveis.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nome}
                          {f.funcoes?.nome && <span className="text-muted-foreground ml-1">({f.funcoes.nome})</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleAddResponsavel} disabled={!selectedFuncionario}>
                    Adicionar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddResponsavel(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {loadingResp ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : responsaveis.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum responsável atribuído</p>
              ) : (
                <div className="space-y-2">
                  {responsaveis.map(resp => (
                    <div key={resp.id} className="flex items-center justify-between bg-muted/30 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{resp.funcionario?.nome}</p>
                          {resp.funcionario?.funcao?.nome && (
                            <p className="text-xs text-muted-foreground">{resp.funcionario.funcao.nome}</p>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeResponsavel(resp.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Descrição */}
            {task.descricao && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Descrição</p>
                  <p className="text-sm">{task.descricao}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => {
              if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
                onDelete(task.id);
                onOpenChange(false);
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
          <Button onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1" />
            Editar Tarefa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
