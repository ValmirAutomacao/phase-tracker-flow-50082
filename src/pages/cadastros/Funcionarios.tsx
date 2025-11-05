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
import { Users, Plus, Search, Edit, Mail, Phone, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import "@/styles/responsive.css";

const funcionarioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  funcao_id: z.string().min(1, "Selecione uma função"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type FuncionarioFormData = z.infer<typeof funcionarioSchema>;

interface Funcionario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  funcao_id: string; // FK para funções
  senha?: string;
  foto?: string;
  status?: string;
  dataAdmissao?: string;
  observacoes?: string;
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

  const form = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      funcao_id: "",
      senha: "",
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
        funcao_id: editingFuncionario.funcao_id,
        senha: editingFuncionario.senha || "",
      });
      setFotoPreview(editingFuncionario.foto || "");
    } else {
      form.reset({
        nome: "",
        email: "",
        telefone: "",
        funcao_id: "",
        senha: "",
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

  const onSubmit = (data: FuncionarioFormData) => {
    if (editingFuncionario) {
      const updates = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        funcao_id: data.funcao_id,
        senha: data.senha,
        foto: fotoPreview,
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
      const novoFuncionario = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        funcao_id: data.funcao_id,
        senha: data.senha,
        foto: fotoPreview,
        status: "ativo",
        dataAdmissao: new Date().toISOString().split('T')[0],
      };

      add.mutate(novoFuncionario, {
        onSuccess: () => {
          toast({
            title: "Funcionário cadastrado!",
            description: `${data.nome} foi adicionado com sucesso.`,
          });
          setOpen(false);
          form.reset();
          setFotoPreview("");
          setSelectedSetor("");
        },
        onError: (error) => {
          toast({
            title: "Erro ao cadastrar",
            description: error.message || "Ocorreu um erro ao cadastrar o funcionário.",
            variant: "destructive",
          });
        }
      });
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cadastro de Funcionários</h1>
          <p className="text-muted-foreground">Gerenciamento de colaboradores</p>
        </div>
        <Dialog open={open} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent">
              <Plus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl dialog-content-mobile">
            <DialogHeader>
              <DialogTitle>{editingFuncionario ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
              <DialogDescription>
                {editingFuncionario ? "Atualize as informações do funcionário" : "Adicione um novo funcionário ao sistema"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <div className="dialog-form-container space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={fotoPreview} />
                    <AvatarFallback><Users className="h-12 w-12" /></AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                      className="hidden"
                      id="foto-upload"
                    />
                    <label htmlFor="foto-upload">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Foto
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

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

                </div>
                
                <div className="flex justify-end gap-3 form-actions mobile-stack">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingFuncionario ? "Atualizar" : "Cadastrar"}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
                      <AvatarImage src={funcionario.foto} />
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
                      {funcionario.funcao?.nivel && (
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {funcionario.funcao.nivel}
                          </Badge>
                        </div>
                      )}
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {funcionario.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {funcionario.telefone}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(funcionario)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteId(funcionario.id)}>
                      <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                      Excluir
                    </Button>
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