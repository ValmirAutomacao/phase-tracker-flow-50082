import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Clock, Plus, Search, Edit, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import "@/styles/responsive.css";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

const jornadaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  pe_esperado: z.string().optional(),
  ps_esperado: z.string().optional(),
  se_esperado: z.string().optional(),
  ss_esperado: z.string().optional(),
  carga_horaria_diaria: z.number().min(1, "Carga horária deve ser maior que 0").max(24, "Carga horária deve ser menor que 24h"),
  tem_intervalo: z.boolean(),
  duracao_intervalo: z.number().min(0, "Duração do intervalo deve ser positiva"),
});

type JornadaFormData = z.infer<typeof jornadaSchema>;

interface JornadaTrabalho {
  id: string;
  nome: string;
  descricao?: string;
  pe_esperado?: string; // TIME format HH:MM
  ps_esperado?: string;
  se_esperado?: string;
  ss_esperado?: string;
  carga_horaria_diaria: number;
  tem_intervalo: boolean;
  duracao_intervalo: number; // em minutos
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  funcionarios_count?: number; // Para mostrar quantos funcionários usam esta jornada
}

const Jornadas = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingJornada, setEditingJornada] = useState<JornadaTrabalho | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Hooks Supabase
  const { data: jornadas = [], isLoading, error } = useOptimizedSupabaseQuery<any>('JORNADAS_TRABALHO');
  const { add, update, delete: deleteJornada } = useSupabaseCRUD<any>('JORNADAS_TRABALHO');

  const form = useForm<JornadaFormData>({
    resolver: zodResolver(jornadaSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      pe_esperado: "08:00",
      ps_esperado: "12:00",
      se_esperado: "13:00",
      ss_esperado: "18:00",
      carga_horaria_diaria: 8,
      tem_intervalo: true,
      duracao_intervalo: 60,
    },
  });

  // Filtro de busca memoizado
  const filteredJornadas = useMemo(() => {
    if (!searchTerm.trim()) return jornadas;

    const searchLower = searchTerm.toLowerCase();
    return jornadas.filter(jornada =>
      jornada.nome.toLowerCase().includes(searchLower) ||
      (jornada.descricao && jornada.descricao.toLowerCase().includes(searchLower))
    );
  }, [jornadas, searchTerm]);

  useEffect(() => {
    if (editingJornada) {
      form.reset({
        nome: editingJornada.nome,
        descricao: editingJornada.descricao || "",
        pe_esperado: editingJornada.pe_esperado || "08:00",
        ps_esperado: editingJornada.ps_esperado || "12:00",
        se_esperado: editingJornada.se_esperado || "13:00",
        ss_esperado: editingJornada.ss_esperado || "18:00",
        carga_horaria_diaria: editingJornada.carga_horaria_diaria,
        tem_intervalo: editingJornada.tem_intervalo,
        duracao_intervalo: editingJornada.duracao_intervalo,
      });
    } else {
      form.reset({
        nome: "",
        descricao: "",
        pe_esperado: "08:00",
        ps_esperado: "12:00",
        se_esperado: "13:00",
        ss_esperado: "18:00",
        carga_horaria_diaria: 8,
        tem_intervalo: true,
        duracao_intervalo: 60,
      });
    }
  }, [editingJornada, form]);

  const onSubmit = async (data: JornadaFormData) => {
    if (editingJornada) {
      // Editar jornada existente
      const updates = {
        nome: data.nome,
        descricao: data.descricao,
        pe_esperado: data.pe_esperado,
        ps_esperado: data.ps_esperado,
        se_esperado: data.se_esperado,
        ss_esperado: data.ss_esperado,
        carga_horaria_diaria: data.carga_horaria_diaria,
        tem_intervalo: data.tem_intervalo,
        duracao_intervalo: data.duracao_intervalo,
      };

      update.mutate(
        { id: editingJornada.id, updates },
        {
          onSuccess: () => {
            toast({
              title: "Jornada atualizada!",
              description: `${data.nome} foi atualizada com sucesso.`,
            });
            setOpen(false);
            setEditingJornada(null);
          },
          onError: (error) => {
            toast({
              title: "Erro ao atualizar",
              description: error.message || "Ocorreu um erro ao atualizar a jornada.",
              variant: "destructive",
            });
          }
        }
      );
    } else {
      // Criar nova jornada
      const novaJornada = {
        nome: data.nome,
        descricao: data.descricao,
        pe_esperado: data.pe_esperado,
        ps_esperado: data.ps_esperado,
        se_esperado: data.se_esperado,
        ss_esperado: data.ss_esperado,
        carga_horaria_diaria: data.carga_horaria_diaria,
        tem_intervalo: data.tem_intervalo,
        duracao_intervalo: data.duracao_intervalo,
        ativo: true,
      };

      add.mutate(novaJornada, {
        onSuccess: () => {
          toast({
            title: "Jornada cadastrada!",
            description: `${data.nome} foi adicionada com sucesso.`,
          });
          setOpen(false);
          form.reset();
        },
        onError: (error) => {
          toast({
            title: "Erro ao cadastrar",
            description: error.message || "Ocorreu um erro ao cadastrar a jornada.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleEdit = (jornada: JornadaTrabalho) => {
    setEditingJornada(jornada);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteJornada.mutate(deleteId, {
        onSuccess: () => {
          toast({
            title: "Jornada excluída!",
            description: "A jornada foi removida com sucesso.",
          });
          setDeleteId(null);
        },
        onError: (error) => {
          toast({
            title: "Erro ao excluir",
            description: error.message || "Ocorreu um erro ao excluir a jornada.",
            variant: "destructive",
          });
        }
      });
    }
  };

  // Status badge memoizado
  const getStatusBadge = useCallback((ativo: boolean, funcionarios_count?: number) => {
    if (!ativo) {
      return <Badge className="bg-gray-100 text-gray-700">Inativa</Badge>;
    }

    if (funcionarios_count && funcionarios_count > 0) {
      return <Badge className="bg-green-100 text-green-700">Em uso ({funcionarios_count})</Badge>;
    }

    return <Badge className="bg-blue-100 text-blue-700">Ativa</Badge>;
  }, []);

  // Função para formatar horários
  const formatHorarioJornada = (pe?: string, ps?: string, se?: string, ss?: string) => {
    const horarios = [];
    if (pe && ps) horarios.push(`${pe}-${ps}`);
    if (se && ss) horarios.push(`${se}-${ss}`);
    return horarios.join(" | ") || "Horários não definidos";
  };

  // Função para limpar formulário quando fechar dialog
  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingJornada(null);
      form.reset();
    }
  };

  return (
    <div className="responsive-container p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Jornadas de Trabalho</h1>
          <p className="page-description">Configuração de horários e cargas horárias</p>
        </div>
        <PermissionGuard permissions={['configurar_jornadas']}>
          <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Jornada
              </Button>
            </DialogTrigger>
            <DialogContent className="dialog-content-mobile max-w-2xl">
              <DialogHeader className="dialog-header">
                <DialogTitle>{editingJornada ? "Editar Jornada" : "Nova Jornada de Trabalho"}</DialogTitle>
                <DialogDescription>
                  {editingJornada ? "Atualize as informações da jornada" : "Configure uma nova jornada de trabalho para os funcionários"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                  <div className="dialog-form-container space-y-4 max-h-[60vh] overflow-y-auto">

                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Jornada</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Jornada Padrão 8h" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição (Opcional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descreva as características desta jornada..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="carga_horaria_diaria"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Carga Horária Diária (horas)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.5"
                                min="1"
                                max="24"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tem_intervalo"
                        render={({ field }) => (
                          <FormItem className="flex flex-col space-y-2">
                            <FormLabel>Tem intervalo?</FormLabel>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {field.value ? "Sim" : "Não"}
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch('tem_intervalo') && (
                      <FormField
                        control={form.control}
                        name="duracao_intervalo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duração do Intervalo (minutos)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="15"
                                placeholder="60"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Horários Esperados</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="pe_esperado"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primeira Entrada</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="ps_esperado"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primeira Saída</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {form.watch('tem_intervalo') && (
                          <>
                            <FormField
                              control={form.control}
                              name="se_esperado"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Segunda Entrada</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="ss_esperado"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Segunda Saída</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">{editingJornada ? "Atualizar" : "Cadastrar"}</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </PermissionGuard>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jornadas.length}</div>
            <p className="text-xs text-muted-foreground mt-1">jornadas cadastradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {useMemo(() => jornadas.filter(j => j.ativo).length, [jornadas])}
            </div>
            <p className="text-xs text-muted-foreground mt-1">em uso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Em Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {useMemo(() => jornadas.filter(j => j.funcionarios_count && j.funcionarios_count > 0).length, [jornadas])}
            </div>
            <p className="text-xs text-muted-foreground mt-1">por funcionários</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Jornadas</CardTitle>
              <CardDescription>Todas as jornadas de trabalho configuradas</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar jornada..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </div>
              ))
            ) : error ? (
              // Error state
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Erro ao carregar jornadas: {error.message}</p>
                <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                  Tentar novamente
                </Button>
              </div>
            ) : filteredJornadas.length === 0 ? (
              // Empty state
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhuma jornada encontrada para a pesquisa." : "Nenhuma jornada cadastrada ainda."}
                </p>
                {!searchTerm && (
                  <Button
                    className="mt-4"
                    onClick={() => setOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar primeira jornada
                  </Button>
                )}
              </div>
            ) : (
              filteredJornadas.map((jornada) => (
                <div
                  key={jornada.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{jornada.nome}</h4>
                      {getStatusBadge(jornada.ativo, jornada.funcionarios_count)}
                    </div>
                    {jornada.descricao && (
                      <p className="text-sm text-muted-foreground mb-2">{jornada.descricao}</p>
                    )}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {jornada.carga_horaria_diaria}h/dia
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {formatHorarioJornada(jornada.pe_esperado, jornada.ps_esperado, jornada.se_esperado, jornada.ss_esperado)}
                      </div>
                      {jornada.tem_intervalo && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs">Intervalo: {jornada.duracao_intervalo}min</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <PermissionGuard permissions={['configurar_jornadas']}>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(jornada)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(jornada.id)}>
                        <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                        Excluir
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta jornada? Esta ação não pode ser desfeita.
              Funcionários que usam esta jornada ficarão sem jornada definida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Jornadas;