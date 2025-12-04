import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Calendar as CalendarIcon, Indent, Outdent } from "lucide-react";
import { useProject } from "@/hooks/useProject";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TaskEditDialog } from "@/components/gantt/TaskEditDialog";
import { Tarefa } from "@/services/projectService";

export default function PlanejamentoObra() {
  const { id: obraId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cronograma, tarefas, isLoading, createTarefa, updateTarefa, deleteTarefa } = useProject(obraId!);
  
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tarefa | null>(null);

  const ganttTasks: Task[] = useMemo(() => {
    if (!tarefas.length) return [];
    
    // Ordenar por índice/ordem para garantir hierarquia visual correta
    const sortedTasks = [...tarefas].sort((a, b) => (a.indice || 0) - (b.indice || 0));

    return sortedTasks.map(t => ({
      start: new Date(t.data_inicio_planejada),
      end: new Date(t.data_fim_planejada),
      name: t.nome,
      id: t.id,
      type: t.tipo === 'etapa' ? 'project' : t.tipo === 'marco' ? 'milestone' : 'task',
      progress: t.percentual_concluido,
      isDisabled: false,
      styles: { progressColor: '#ffbb54', progressSelectedColor: '#ff9e0d', backgroundSelectedColor: '#ff9e0d' },
      project: t.parent_id || undefined,
      dependencies: t.dependencias,
      // Custom properties that might be used by custom renderers
      displayOrder: t.indice
    }));
  }, [tarefas]);

  const handleTaskChange = (task: Task) => {
    updateTarefa({
      id: task.id,
      updates: {
        data_inicio_planejada: task.start.toISOString(),
        data_fim_planejada: task.end.toISOString(),
        percentual_concluido: task.progress
      }
    });
  };

  const handleProgressChange = async (task: Task) => {
    updateTarefa({
      id: task.id,
      updates: { percentual_concluido: task.progress }
    });
  };

  const handleDblClick = (task: Task) => {
    const fullTask = tarefas.find(t => t.id === task.id);
    if (fullTask) {
      setSelectedTask(fullTask);
      setIsEditOpen(true);
    }
  };

  const onAddTask = () => {
    if (!cronograma) return;
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    createTarefa({
      cronograma_id: cronograma.id,
      nome: newTaskName || "Nova Tarefa",
      tipo: 'tarefa',
      data_inicio_planejada: now.toISOString(),
      data_fim_planejada: nextWeek.toISOString(),
      percentual_concluido: 0,
      status: 'nao_iniciado',
      indice: tarefas.length + 1
    });
    
    setNewTaskName("");
    setIsCreateOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Toolbar Estilo MS Project */}
      <div className="border-b p-2 flex items-center justify-between gap-4 bg-muted/20">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cadastros/obras')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="border-r pr-4 mr-2">
            <h1 className="font-semibold text-lg">{cronograma?.nome}</h1>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nova Tarefa
            </Button>
            {/* Futuro: Implementar Indent/Outdent actions */}
            <Button variant="ghost" size="icon" title="Recuar (Subtarefa)" disabled>
              <Indent className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Avançar (Tarefa Principal)" disabled>
              <Outdent className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select 
            value={viewMode} 
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Visualização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ViewMode.Day}>Dia</SelectItem>
              <SelectItem value={ViewMode.Week}>Semana</SelectItem>
              <SelectItem value={ViewMode.Month}>Mês</SelectItem>
              <SelectItem value={ViewMode.Year}>Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Área Principal Full Screen */}
      <div className="flex-1 overflow-hidden relative">
        {ganttTasks.length > 0 ? (
          <Gantt
            tasks={ganttTasks}
            viewMode={viewMode}
            onDateChange={handleTaskChange}
            onDelete={(task) => {
              if (confirm("Excluir esta tarefa?")) deleteTarefa(task.id);
            }}
            onProgressChange={handleProgressChange}
            onDoubleClick={handleDblClick}
            listCellWidth="155px" // Estreito para focar no gráfico
            columnWidth={viewMode === ViewMode.Month ? 300 : 65}
            locale="pt-BR"
            barFill={70}
            ganttHeight={800} // Altura fixa grande ou calc
            // Customização visual das colunas seria aqui via props avançadas se necessário
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <CalendarIcon className="h-16 w-16 mb-4 opacity-10" />
            <h3 className="text-xl font-medium">Cronograma Vazio</h3>
            <p className="mb-6">Adicione tarefas para começar o planejamento.</p>
            <Button onClick={() => setIsCreateOpen(true)}>Criar Primeira Tarefa</Button>
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label>Nome da Tarefa</Label>
            <Input value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} className="mt-2" autoFocus />
          </div>
          <DialogFooter><Button onClick={onAddTask}>Adicionar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <TaskEditDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        task={selectedTask} 
        allTasks={tarefas}
        onSave={(id, updates) => updateTarefa({ id, updates })}
        onDelete={deleteTarefa}
      />
    </div>
  );
}
