import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Link2, X } from "lucide-react";
import { Tarefa } from "@/services/projectService";

const DEPENDENCY_TYPES = [
  { value: "FS", label: "Término-Início (FS)", description: "Tarefa começa após término da predecessora" },
  { value: "SS", label: "Início-Início (SS)", description: "Tarefas começam juntas" },
  { value: "FF", label: "Término-Término (FF)", description: "Tarefas terminam juntas" },
  { value: "SF", label: "Início-Término (SF)", description: "Tarefa termina após início da predecessora" },
];

const taskCreateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  tipo: z.enum(["tarefa", "etapa", "marco"]),
  data_inicio_planejada: z.string().min(1, "Data de início é obrigatória"),
  data_fim_planejada: z.string().min(1, "Data de fim é obrigatória"),
  parent_id: z.string().optional().nullable(),
  status: z.string(),
});

type TaskCreateFormData = z.infer<typeof taskCreateSchema>;

interface DependencyInput {
  predecessorId: string;
  type: string;
  lag: number;
}

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cronogramaId: string;
  allTasks: Tarefa[];
  onSave: (data: Partial<Tarefa>, dependencies: DependencyInput[]) => void;
  defaultParentId?: string | null;
}

export function TaskCreateDialog({
  open,
  onOpenChange,
  cronogramaId,
  allTasks,
  onSave,
  defaultParentId,
}: TaskCreateDialogProps) {
  const [dependencies, setDependencies] = useState<DependencyInput[]>([]);
  
  const form = useForm<TaskCreateFormData>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      tipo: "tarefa",
      data_inicio_planejada: new Date().toISOString().slice(0, 16),
      data_fim_planejada: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      parent_id: defaultParentId || null,
      status: "nao_iniciado",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nome: "",
        descricao: "",
        tipo: "tarefa",
        data_inicio_planejada: new Date().toISOString().slice(0, 16),
        data_fim_planejada: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        parent_id: defaultParentId || null,
        status: "nao_iniciado",
      });
      setDependencies([]);
    }
  }, [open, defaultParentId, form]);

  const addDependency = () => {
    setDependencies([...dependencies, { predecessorId: "", type: "FS", lag: 0 }]);
  };

  const removeDependency = (index: number) => {
    setDependencies(dependencies.filter((_, i) => i !== index));
  };

  const updateDependency = (index: number, field: keyof DependencyInput, value: string | number) => {
    const updated = [...dependencies];
    updated[index] = { ...updated[index], [field]: value };
    setDependencies(updated);
  };

  const handleSubmit = (data: TaskCreateFormData) => {
    const taskData: Partial<Tarefa> = {
      cronograma_id: cronogramaId,
      nome: data.nome,
      descricao: data.descricao,
      tipo: data.tipo,
      data_inicio_planejada: new Date(data.data_inicio_planejada).toISOString(),
      data_fim_planejada: new Date(data.data_fim_planejada).toISOString(),
      parent_id: data.parent_id === "none" ? null : data.parent_id,
      status: data.status,
      percentual_concluido: 0,
      indice: allTasks.length + 1,
      nivel: data.parent_id ? 1 : 0,
    };

    // Filter valid dependencies
    const validDeps = dependencies.filter((d) => d.predecessorId && d.predecessorId !== "none");

    onSave(taskData, validDeps);
    onOpenChange(false);
  };

  // Filter tasks that can be parents (not marcos, not self)
  const availableParents = allTasks.filter((t) => t.tipo !== "marco");
  
  // Filter tasks that can be predecessors
  const availablePredecessors = allTasks;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>
            Configure todos os detalhes da tarefa, incluindo dependências.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Tarefa *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Fundação - Concretagem" {...field} autoFocus />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tarefa">Tarefa</SelectItem>
                            <SelectItem value="etapa">Etapa / Fase (Grupo)</SelectItem>
                            <SelectItem value="marco">Marco</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-[10px]">
                          {field.value === "etapa" && "Agrupa subtarefas"}
                          {field.value === "marco" && "Ponto de controle sem duração"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parent_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tarefa Pai (Hierarquia)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Raiz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma (Raiz)</SelectItem>
                            {availableParents.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {"  ".repeat(t.nivel || 0)}{t.nome}
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
                    name="data_inicio_planejada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início *</FormLabel>
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
                        <FormLabel>Data de Término *</FormLabel>
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
                        <Textarea placeholder="Detalhes adicionais sobre a tarefa..." className="resize-none" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dependencies Section */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Dependências (Predecessoras)</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Defina quais tarefas devem ser concluídas antes desta
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addDependency}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                {dependencies.length === 0 ? (
                  <div className="text-center py-4 border border-dashed rounded-lg text-sm text-muted-foreground">
                    <Link2 className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    Nenhuma dependência configurada
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dependencies.map((dep, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div className="col-span-1">
                            <Label className="text-[10px] text-muted-foreground">Predecessora</Label>
                            <Select
                              value={dep.predecessorId || "none"}
                              onValueChange={(v) => updateDependency(index, "predecessorId", v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Selecione...</SelectItem>
                                {availablePredecessors.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>
                                    {t.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-1">
                            <Label className="text-[10px] text-muted-foreground">Tipo Vínculo</Label>
                            <Select value={dep.type} onValueChange={(v) => updateDependency(index, "type", v)}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DEPENDENCY_TYPES.map((dt) => (
                                  <SelectItem key={dt.value} value={dt.value}>
                                    {dt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-1">
                            <Label className="text-[10px] text-muted-foreground">Defasagem (dias)</Label>
                            <Input
                              type="number"
                              className="h-8 text-xs"
                              value={dep.lag}
                              onChange={(e) => updateDependency(index, "lag", parseInt(e.target.value) || 0)}
                              min={-365}
                              max={365}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => removeDependency(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Tarefa</Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
