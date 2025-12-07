import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Calendar as CalendarIcon, Indent, ZoomIn, ZoomOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MSProjectGantt, ViewMode, DependencyInfo } from "@/components/gantt/MSProjectGantt";
import { TaskCreateDialog } from "@/components/gantt/TaskCreateDialog";
import { TaskEditDialog } from "@/components/gantt/TaskEditDialog";
import { TaskViewDialog } from "@/components/gantt/TaskViewDialog";
import { Tarefa } from "@/services/projectService";
import { TarefaGantt } from "@/services/cronogramaGanttService";
import { useCronogramaGantt } from "@/hooks/useCronogramaGantt";
import { Badge } from "@/components/ui/badge";

export default function CronogramaGanttView() {
  const { id: cronogramaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    cronograma, 
    tarefas, 
    dependencies, 
    isLoading,
    createTarefa,
    updateTarefa,
    deleteTarefa,
    createDependency,
    deleteDependency
  } = useCronogramaGantt(cronogramaId!);
  
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TarefaGantt | null>(null);
  const [parentIdForCreate, setParentIdForCreate] = useState<string | null>(null);

  // Clique simples abre visualização
  const handleTaskClick = (task: TarefaGantt) => {
    setSelectedTask(task);
    setIsViewOpen(true);
  };

  // Duplo clique abre edição diretamente
  const handleTaskDoubleClick = (task: TarefaGantt) => {
    setSelectedTask(task);
    setIsViewOpen(false);
    setIsEditOpen(true);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<TarefaGantt>) => {
    updateTarefa({ id: taskId, updates });
  };

  const handleTaskCreate = (parentId: string | null) => {
    setParentIdForCreate(parentId);
    setIsCreateOpen(true);
  };

  const handleTaskDelete = (taskId: string) => {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      deleteTarefa(taskId);
      setSelectedTask(null);
    }
  };

  const handleDependencyCreate = (fromId: string, toId: string, type: string) => {
    createDependency({ fromId, toId, type });
  };

  const handleDependencyDelete = (depId: string) => {
    if (confirm("Remover esta dependência?")) {
      deleteDependency(depId);
    }
  };

  const handleCreateTaskSubmit = async (taskData: Partial<TarefaGantt>) => {
    if (!cronogramaId) return;
    createTarefa({
      cronograma_id: cronogramaId,
      ...taskData
    } as TarefaGantt);
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/cronogramas')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="border-r pr-4 mr-2">
            <h1 className="font-semibold text-lg truncate max-w-[300px]">
              {cronograma?.nome || "Cronograma"}
            </h1>
            {cronograma?.obras?.nome && (
              <span className="text-xs text-muted-foreground">
                Obra: {cronograma.obras.nome}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => handleTaskCreate(null)}>
              <Plus className="h-4 w-4 mr-2" /> Nova Tarefa
            </Button>
            {selectedTask && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleTaskCreate(selectedTask.id)}
                  title="Criar Subtarefa"
                >
                  <Indent className="h-4 w-4 mr-1" /> Subtarefa
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditOpen(true)}
                  title="Editar Tarefa"
                >
                  Editar
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {tarefas.length} tarefas
          </Badge>
          <Badge variant="outline" className="text-xs">
            {dependencies.length} vínculos
          </Badge>
          
          {/* Zoom controls */}
          <div className="flex items-center border rounded-md">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => {
                const modes: ViewMode[] = ["day", "week", "month", "quarter"];
                const idx = modes.indexOf(viewMode);
                if (idx > 0) setViewMode(modes[idx - 1]);
              }}
              disabled={viewMode === "day"}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => {
                const modes: ViewMode[] = ["day", "week", "month", "quarter"];
                const idx = modes.indexOf(viewMode);
                if (idx < modes.length - 1) setViewMode(modes[idx + 1]);
              }}
              disabled={viewMode === "quarter"}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>

          <Select 
            value={viewMode} 
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Visualização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Área Principal - Gantt */}
      <div className="flex-1 overflow-hidden">
        {tarefas.length > 0 || dependencies.length > 0 ? (
          <MSProjectGantt
            tasks={tarefas}
            dependencies={dependencies as DependencyInfo[]}
            viewMode={viewMode}
            editable={true}
            onTaskClick={handleTaskClick}
            onTaskDoubleClick={handleTaskDoubleClick}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleTaskCreate}
            onTaskDelete={handleTaskDelete}
            onDependencyCreate={handleDependencyCreate}
            onDependencyDelete={handleDependencyDelete}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <CalendarIcon className="h-16 w-16 mb-4 opacity-10" />
            <h3 className="text-xl font-medium">Cronograma Vazio</h3>
            <p className="mb-6 text-center max-w-md">
              Este cronograma ainda não possui tarefas. Clique no botão abaixo para criar sua primeira tarefa.
            </p>
            <Button onClick={() => handleTaskCreate(null)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Criar Primeira Tarefa
            </Button>
          </div>
        )}
      </div>

      {/* Dialog de criação */}
      {cronogramaId && (
        <TaskCreateDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          cronogramaId={cronogramaId}
          allTasks={tarefas}
          defaultParentId={parentIdForCreate}
          onSave={handleCreateTaskSubmit}
        />
      )}
      
      {/* Dialog de visualização - abre ao clicar */}
      <TaskViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        task={selectedTask}
        allTasks={tarefas}
        onEdit={() => {
          setIsViewOpen(false);
          setIsEditOpen(true);
        }}
        onDelete={(id) => {
          deleteTarefa(id);
          setIsViewOpen(false);
        }}
      />
      
      {/* Dialog de edição */}
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
