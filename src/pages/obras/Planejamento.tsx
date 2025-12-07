import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Calendar as CalendarIcon, Indent, Outdent, ZoomIn, ZoomOut } from "lucide-react";
import { useProject } from "@/hooks/useProject";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MSProjectGantt, ViewMode } from "@/components/gantt/MSProjectGantt";
import { TaskCreateDialog } from "@/components/gantt/TaskCreateDialog";
import { TaskEditDialog } from "@/components/gantt/TaskEditDialog";
import { Tarefa, projectService } from "@/services/projectService";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function PlanejamentoObra() {
  const { id: obraId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cronograma, tarefas, isLoading, createTarefa, updateTarefa, deleteTarefa } = useProject(obraId!);
  
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tarefa | null>(null);

  // Fetch dependencies
  const { data: dependencies = [] } = useQuery({
    queryKey: ["dependencies", cronograma?.id],
    queryFn: async () => {
      if (!cronograma?.id) return [];
      const deps = await projectService.getDependencias(cronograma.id);
      return deps.map(d => ({
        id: d.id,
        fromTaskId: d.tarefa_origem_id,
        toTaskId: d.tarefa_destino_id,
        type: d.tipo_vinculo,
        lag: d.lag_dias || 0
      }));
    },
    enabled: !!cronograma?.id,
  });

  const handleTaskClick = (task: Tarefa) => {
    setSelectedTask(task);
  };

  const handleTaskDoubleClick = (task: Tarefa) => {
    setSelectedTask(task);
    setIsEditOpen(true);
  };

  const handleDateChange = (taskId: string, start: Date, end: Date) => {
    updateTarefa({
      id: taskId,
      updates: {
        data_inicio_planejada: start.toISOString(),
        data_fim_planejada: end.toISOString(),
      }
    });
  };

  const handleCreateTask = async (taskData: Partial<Tarefa>, deps: { predecessorId: string; type: string; lag: number }[]) => {
    if (!cronograma) return;

    // First create the task
    createTarefa({
      cronograma_id: cronograma.id,
      ...taskData
    });
    
    // Note: Dependencies will be handled separately after task creation
    // This is a simplified version - full dependency creation would need the task ID from the mutation result
    toast.success("Tarefa criada com sucesso!");
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
            <h1 className="font-semibold text-lg">{cronograma?.nome || "Planejamento"}</h1>
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

      {/* Área Principal Full Screen - Novo MSProjectGantt */}
      <div className="flex-1 overflow-hidden">
        {tarefas.length > 0 ? (
          <MSProjectGantt
            tasks={tarefas}
            dependencies={dependencies}
            viewMode={viewMode}
            onTaskClick={handleTaskClick}
            onTaskDoubleClick={handleTaskDoubleClick}
            onDateChange={handleDateChange}
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

      {/* Dialog de criação completa */}
      {cronograma && (
        <TaskCreateDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          cronogramaId={cronograma.id}
          allTasks={tarefas}
          onSave={handleCreateTask}
        />
      )}
      
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
