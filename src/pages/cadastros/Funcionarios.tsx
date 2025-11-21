import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Users, Plus, Search, Edit, Mail, Phone, Upload, Trash2, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import "@/styles/responsive.css";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

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
  const [searchTerm, setSearchTerm] = useState("");
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

  // Filtro de busca memoizado para performance
  const filteredFuncionarios = useMemo(() => {
    if (!searchTerm.trim()) return funcionarios;

    const searchLower = searchTerm.toLowerCase();
    return funcionarios.filter(funcionario =>
      funcionario.nome.toLowerCase().includes(searchLower) ||
      funcionario.email.toLowerCase().includes(searchLower) ||
      (funcionario.funcao?.nome && funcionario.funcao.nome.toLowerCase().includes(searchLower)) ||
      (funcionario.funcao?.setor?.nome && funcionario.funcao.setor.nome.toLowerCase().includes(searchLower))
    );
  }, [funcionarios, searchTerm]);

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

  // Status badge memoizado para performance
  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      ativo: { label: "Ativo", className: "bg-green-100 text-green-700" },
      inativo: { label: "Inativo", className: "bg-gray-100 text-gray-700" },
      ferias: { label: "Férias", className: "bg-blue-100 text-blue-700" },
    };

    return (
      <Badge className={variants[status]?.className || ""}>
        {variants[status]?.label || status}
      </Badge>
    );
  }, []);

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

      {/* List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Funcionários</CardTitle>
              <CardDescription>Todos os colaboradores cadastrados</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar funcionário..."
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
                    <div className="flex items-start gap-4 flex-1">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-4 w-48" />
                        <div className="flex gap-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      </div>
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
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Erro ao carregar funcionários: {error.message}</p>
                <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                  Tentar novamente
                </Button>
              </div>
            ) : filteredFuncionarios.length === 0 ? (
              // Empty state
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "Nenhum funcionário encontrado para a pesquisa." : "Nenhum funcionário cadastrado ainda."}
                </p>
                {!searchTerm && (
                  <Button
                    className="mt-4"
                    onClick={() => setOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar primeiro funcionário
                  </Button>
                )}
              </div>
            ) : (
              filteredFuncionarios.map((funcionario) => (
                <div
                  key={funcionario.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        <Users className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{funcionario.nome}</h4>
                        {getStatusBadge(funcionario.status || "ativo")}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {funcionario.funcao?.nome || 'Função não definida'} • {funcionario.funcao?.setor?.nome || 'Setor não definido'}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        {funcionario.funcao?.nivel && (
                          <Badge variant="outline" className="text-xs">
                            {funcionario.funcao.nivel}
                          </Badge>
                        )}
                        {funcionario.jornada && (
                          <Badge variant="secondary" className="text-xs">
                            {funcionario.jornada.nome}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {funcionario.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {funcionario.telefone}
                        </div>
                        {funcionario.cpf && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            CPF: {funcionario.cpf}
                          </div>
                        )}
                        {funcionario.data_admissao && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Admissão: {new Date(funcionario.data_admissao).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <PermissionGuard permissions={['gerenciar_equipe']}>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(funcionario)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(funcionario.id)}>
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