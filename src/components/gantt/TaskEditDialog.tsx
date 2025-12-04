import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tarefa } from "@/services/projectService";
import { TaskResourcesTab } from "./TaskResourcesTab";

const taskSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  tipo: z.enum(["tarefa", "etapa", "marco"]),
  data_inicio_planejada: z.string().min(1, "Data de início é obrigatória"),
  data_fim_planejada: z.string().min(1, "Data de fim é obrigatória"),
  percentual_concluido: z.number().min(0).max(100),
  parent_id: z.string().optional().nullable(),
  // Simplificação MVP: Apenas uma predecessora por enquanto no form
  predecessor_id: z.string().optional().nullable(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Tarefa | null;
  allTasks: Tarefa[]; // Nova prop
  onSave: (id: string, data: Partial<Tarefa>) => void;
  onDelete: (id: string) => void;
}

export function TaskEditDialog({ open, onOpenChange, task, allTasks, onSave, onDelete }: TaskEditDialogProps) {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      tipo: "tarefa",
      data_inicio_planejada: "",
      data_fim_planejada: "",
      percentual_concluido: 0,
      parent_id: null,
      predecessor_id: null,
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        nome: task.nome,
        descricao: task.descricao || "",
        tipo: task.tipo,
        data_inicio_planejada: task.data_inicio_planejada ? new Date(task.data_inicio_planejada).toISOString().slice(0, 16) : "",
        data_fim_planejada: task.data_fim_planejada ? new Date(task.data_fim_planejada).toISOString().slice(0, 16) : "",
        percentual_concluido: task.percentual_concluido,
        parent_id: task.parent_id || "none",
        // Pega a primeira dependência se existir
        predecessor_id: task.dependencias && task.dependencias.length > 0 ? task.dependencias[0] : "none",
      });
    }
  }, [task, form]);

  const handleSubmit = (data: TaskFormData) => {
    if (!task) return;
    
    const updates: any = {
      ...data,
      data_inicio_planejada: new Date(data.data_inicio_planejada).toISOString(),
      data_fim_planejada: new Date(data.data_fim_planejada).toISOString(),
      parent_id: data.parent_id === "none" ? null : data.parent_id,
    };
    
    // Tratamento especial para dependências (convertendo de single select para array)
    if (data.predecessor_id && data.predecessor_id !== "none") {
      updates.dependencias = [data.predecessor_id];
    } else {
      updates.dependencias = [];
    }
    
    // Remover campo temporário
    delete updates.predecessor_id;

    onSave(task.id, updates);
    onOpenChange(false);
  };

  // Filtrar tarefas para evitar auto-referência
  const availableTasks = allTasks.filter(t => t.id !== task?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
          <DialogDescription>
            Gerencie os detalhes, prazos e recursos da tarefa.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalhes & Vínculos</TabsTrigger>
            <TabsTrigger value="resources">Recursos & Custos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Tarefa</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da tarefa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="parent_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtarefa de (Pai)</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Nenhuma (Raíz)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma (Raíz)</SelectItem>
                            {availableTasks.map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="predecessor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Depende de (Anterior)</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Nenhuma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {availableTasks.map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tarefa">Tarefa</SelectItem>
                            <SelectItem value="etapa">Etapa (Grupo)</SelectItem>
                            <SelectItem value="marco">Marco</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="percentual_concluido"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Progresso ({field.value}%)</FormLabel>
                        <FormControl>
                          <div className="pt-2">
                            <Slider
                              min={0}
                              max={100}
                              step={5}
                              value={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_inicio_planejada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Início</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_fim_planejada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fim</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detalhes adicionais..." 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2 sm:gap-0 mt-6">
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => {
                      if (task && confirm("Tem certeza? Isso não pode ser desfeito.")) {
                        onDelete(task.id);
                        onOpenChange(false);
                      }
                    }}
                  >
                    Excluir Tarefa
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Salvar Alterações</Button>
                  </div>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="resources">
            {task && <TaskResourcesTab tarefaId={task.id} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
