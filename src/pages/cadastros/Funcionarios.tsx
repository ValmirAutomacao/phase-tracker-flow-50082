import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Users, Plus, Edit, Mail, Phone, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import "@/styles/responsive.css";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { DataTable, Column } from "@/components/ui/DataTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const funcionarioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  cpf: z.string().min(11, "CPF é obrigatório").regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve ter formato válido"),
  ctps: z.string().min(1, "CTPS é obrigatório"),
  data_admissao: z.string().min(1, "Data de admissão é obrigatória"),
  funcao_id: z.string().min(1, "Selecione uma função"),
  jornada_trabalho_id: z.string().optional(),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional().or(z.literal("")),
});

type FuncionarioFormData = z.infer<typeof funcionarioSchema>;

interface Funcionario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf?: string;
  ctps?: string;
  data_admissao?: string;
  funcao_id: string; // FK para funções
  jornada_trabalho_id?: string; // FK para jornadas
  senha?: string;
  foto?: string;
  status?: string;
  observacoes?: string;
  ativo?: boolean;
  // Campos de relacionamento
  funcao?: {
    id: string;
    nome: string;
    nivel?: string;
    setor_id: string;
    setor?: {
      id: string;
      nome: string;
    };
  };
  jornada?: {
    id: string;
    nome: string;
    carga_horaria_diaria: number;
  };
  created_at?: string;
  updated_at?: string;
}

interface Funcao {
  id: string;
  nome: string;
  setor_id: string;
  nivel?: string;
  setor?: {
    id: string;
    nome: string;
  };
}

interface Setor {
  id: string;
  nome: string;
}

const Funcionarios = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedSetor, setSelectedSetor] = useState<string>("");

  // Hooks Supabase para substituir localStorage
  const { data: funcionarios = [], isLoading, error } = useOptimizedSupabaseQuery<any>('FUNCIONARIOS');
  const { add, update, delete: deleteFuncionario } = useSupabaseCRUD<any>('FUNCIONARIOS');

  // Hooks para carregar dados hierárquicos
  const { data: funcoes = [] } = useOptimizedSupabaseQuery<any>('FUNCOES');
  const { data: setores = [] } = useOptimizedSupabaseQuery<any>('SETORES');
  const { data: jornadas = [] } = useOptimizedSupabaseQuery<any>('JORNADAS_TRABALHO');

  const form = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      cpf: "",
      ctps: "",
      data_admissao: "",
      funcao_id: "",
      jornada_trabalho_id: "sem_jornada",
      senha: undefined,
    },
  });

  // Filtrar funções por setor selecionado
  const funcoesFiltradas = useMemo(() => {
    if (!selectedSetor) return funcoes;
    return funcoes.filter(funcao => funcao.setor_id === selectedSetor);
  }, [funcoes, selectedSetor]);

  useEffect(() => {
    if (editingFuncionario) {
      // Encontrar o setor da função atual para mostrar no dropdown
      const funcaoAtual = funcoes.find(f => f.id === editingFuncionario.funcao_id);
      if (funcaoAtual) {
        setSelectedSetor(funcaoAtual.setor_id);
      }

      form.reset({
        nome: editingFuncionario.nome,
        email: editingFuncionario.email,
        telefone: editingFuncionario.telefone,
        cpf: editingFuncionario.cpf || "",
        ctps: editingFuncionario.ctps || "",
        data_admissao: editingFuncionario.data_admissao || "",
        funcao_id: editingFuncionario.funcao_id,
        jornada_trabalho_id: editingFuncionario.jornada_trabalho_id || "sem_jornada",
        senha: undefined,
      });
      setFotoPreview(editingFuncionario.foto || "");
    } else {
      form.reset({
        nome: "",
        email: "",
        telefone: "",
        cpf: "",
        ctps: "",
        data_admissao: "",
        funcao_id: "",
        jornada_trabalho_id: "sem_jornada",
        senha: undefined,
      });
      setFotoPreview("");
      setSelectedSetor("");
    }
  }, [editingFuncionario, form, funcoes]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FuncionarioFormData) => {
    if (editingFuncionario) {
      // Ao editar, apenas atualiza dados do funcionário
      const updates = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        cpf: data.cpf,
        ctps: data.ctps,
        data_admissao: data.data_admissao,
        funcao_id: data.funcao_id,
        jornada_trabalho_id: data.jornada_trabalho_id === "sem_jornada" ? null : data.jornada_trabalho_id || null,
        // foto: fotoPreview, // Campo removido - não existe na tabela do banco
      };

      update.mutate(
        { id: editingFuncionario.id, updates },
        {
          onSuccess: () => {
            toast({
              title: "Funcionário atualizado!",
              description: `${data.nome} foi atualizado com sucesso.`,
            });
            setOpen(false);
            setEditingFuncionario(null);
            setFotoPreview("");
            setSelectedSetor("");
          },
          onError: (error) => {
            toast({
              title: "Erro ao atualizar",
              description: error.message || "Ocorreu um erro ao atualizar o funcionário.",
              variant: "destructive",
            });
          }
        }
      );
    } else {
      // Validar senha ao criar
      if (!data.senha || data.senha.length < 6) {
        toast({
          title: "Senha obrigatória",
          description: "Digite uma senha com no mínimo 6 caracteres.",
          variant: "destructive",
        });
        return;
      }

      // Ao criar, primeiro cria usuário no Supabase Auth SEM fazer login
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { createClient } = await import('@supabase/supabase-js');

        // CLAUDE-NOTE: Criar cliente temporário para evitar interferência na sessão atual
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        // Cliente temporário apenas para criação de usuário
        const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false, // Não persistir sessão
          }
        });

        // Criar usuário no cliente temporário (não afeta sessão principal)
        const { data: authData, error: authError } = await tempClient.auth.signUp({
          email: data.email,
          password: data.senha,
          options: {
            data: {
              nome: data.nome,
            }
          }
        });

        if (authError) {
          toast({
            title: "Erro ao criar usuário",
            description: authError.message,
            variant: "destructive",
          });
          return;
        }

        if (!authData.user) {
          toast({
            title: "Erro ao criar usuário",
            description: "Não foi possível criar o usuário no sistema.",
            variant: "destructive",
          });
          return;
        }

        // Criar funcionário vinculado ao usuário
        const novoFuncionario = {
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          cpf: data.cpf,
          ctps: data.ctps,
          data_admissao: data.data_admissao,
          funcao_id: data.funcao_id,
          jornada_trabalho_id: data.jornada_trabalho_id === "sem_jornada" ? null : data.jornada_trabalho_id || null,
          user_id: authData.user.id,
          ativo: true,
        };

        add.mutate(novoFuncionario, {
          onSuccess: () => {
            toast({
              title: "Funcionário cadastrado!",
              description: `${data.nome} foi adicionado com sucesso e pode fazer login no sistema.`,
            });
            setOpen(false);
            form.reset();
            setFotoPreview("");
            setSelectedSetor("");
          },
          onError: async (error) => {
            toast({
              title: "Erro ao cadastrar",
              description: error.message || "Ocorreu um erro ao cadastrar o funcionário.",
              variant: "destructive",
            });
          }
        });
      } catch (error: any) {
        toast({
          title: "Erro ao cadastrar",
          description: error.message || "Ocorreu um erro ao cadastrar o funcionário.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteFuncionario.mutate(deleteId, {
        onSuccess: () => {
          toast({
            title: "Funcionário excluído!",
            description: "O funcionário foi removido com sucesso.",
          });
          setDeleteId(null);
        },
        onError: (error) => {
          toast({
            title: "Erro ao excluir",
            description: error.message || "Ocorreu um erro ao excluir o funcionário.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, { label: string; variant: any }> = {
      ativo: { label: "Ativo", variant: "default" },
      inativo: { label: "Inativo", variant: "secondary" },
      ferias: { label: "Férias", variant: "outline" },
    };

    const config = variants[status] || { label: status, variant: "outline" };
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  }, []);

  // Definir colunas da tabela
  const columns: Column<Funcionario>[] = [
    {
      key: 'nome',
      title: 'Funcionário',
      sortable: true,
      filterable: true,
      filterType: 'text',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">
              {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'funcao.nome',
      title: 'Função/Setor',
      sortable: true,
      filterable: true,
      filterType: 'text',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value || 'Função não definida'}</div>
          <div className="text-xs text-muted-foreground">
            {row.funcao?.setor?.nome || 'Setor não definido'}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'ativo', label: 'Ativo' },
        { value: 'inativo', label: 'Inativo' },
        { value: 'ferias', label: 'Férias' }
      ],
      render: (value) => getStatusBadge(value || 'ativo')
    },
    {
      key: 'telefone',
      title: 'Contato',
      filterable: true,
      filterType: 'text',
      render: (telefone, row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{telefone}</span>
          </div>
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'data_admissao',
      title: 'Data Admissão',
      sortable: true,
      filterable: true,
      filterType: 'date',
      render: (value) => value ? (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
    {
      key: 'jornada.nome',
      title: 'Jornada',
      filterable: true,
      filterType: 'text',
      render: (value, row) => value ? (
        <div>
          <div className="text-sm">{value}</div>
          <div className="text-xs text-muted-foreground">
            {row.jornada?.carga_horaria_diaria}h/dia
          </div>
        </div>
      ) : (
        <span className="text-muted-foreground">Não definida</span>
      )
    }
  ];

  const handleDeleteConfirm = (funcionario: Funcionario) => {
    setDeleteId(funcionario.id);
  };

  // Função para limpar formulário quando fechar dialog
  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingFuncionario(null);
      setFotoPreview("");
      setSelectedSetor("");
      form.reset();
    }
  };

  return (
    <div className="responsive-container p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cadastro de Funcionários</h1>
          <p className="page-description">Gerenciamento de colaboradores</p>
        </div>
        <PermissionGuard permissions={['gerenciar_equipe']}>
          <Dialog open={open} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
          <DialogContent className="dialog-content-mobile">
            <DialogHeader className="dialog-header">
              <DialogTitle>{editingFuncionario ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
              <DialogDescription>
                {editingFuncionario ? "Atualize as informações do funcionário" : "Adicione um novo funcionário ao sistema"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <div className="dialog-form-container space-y-4">
                {/* Avatar/Foto removido temporariamente - coluna não existe no banco */}

                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="joao@engflow.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 98765-4321" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ctps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CTPS</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="data_admissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Admissão</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel>Setor</FormLabel>
                    <Select value={selectedSetor} onValueChange={setSelectedSetor}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {setores.map(setor => (
                          <SelectItem key={setor.id} value={setor.id}>{setor.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="funcao_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Função</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedSetor}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={selectedSetor ? "Selecione a função" : "Primeiro selecione o setor"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {funcoesFiltradas.map(funcao => (
                              <SelectItem key={funcao.id} value={funcao.id}>
                                {funcao.nome}
                                {funcao.nivel && ` (${funcao.nivel})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="jornada_trabalho_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jornada de Trabalho (Opcional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a jornada de trabalho" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sem_jornada">Sem jornada definida</SelectItem>
                          {jornadas.filter(j => j.ativo).map(jornada => (
                            <SelectItem key={jornada.id} value={jornada.id}>
                              {jornada.nome} ({jornada.carga_horaria_diaria}h/dia)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!editingFuncionario && (
                  <FormField
                    control={form.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha de Acesso</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                </div>
                
                <div className="form-actions">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingFuncionario ? "Atualizar" : "Cadastrar"}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </PermissionGuard>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funcionarios.length}</div>
            <p className="text-xs text-muted-foreground mt-1">funcionários cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {useMemo(() => funcionarios.filter(f => f.status === 'ativo').length, [funcionarios])}
            </div>
            <p className="text-xs text-muted-foreground mt-1">trabalhando atualmente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Funções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {useMemo(() => {
                const funcoesUnicas = new Set(funcionarios.map(f => f.funcao?.nome).filter(Boolean));
                return funcoesUnicas.size;
              }, [funcionarios])}
            </div>
            <p className="text-xs text-muted-foreground mt-1">funções diferentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Setores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {useMemo(() => {
                const setoresUnicos = new Set(funcionarios.map(f => f.funcao?.setor?.nome).filter(Boolean));
                return setoresUnicos.size;
              }, [funcionarios])}
            </div>
            <p className="text-xs text-muted-foreground mt-1">setores diferentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Funcionários com DataTable */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Lista de Funcionários</CardTitle>
            <CardDescription>Todos os colaboradores cadastrados no sistema</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={funcionarios}
            columns={columns}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteConfirm}
            searchPlaceholder="Buscar por nome, função, setor, email..."
            emptyMessage="Nenhum funcionário cadastrado ainda."
            showSelection={false}
            showActions={true}
            globalSearch={true}
            hideFilters={false}
          />
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.
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

export default Funcionarios;