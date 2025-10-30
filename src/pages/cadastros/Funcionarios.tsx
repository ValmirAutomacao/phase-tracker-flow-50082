import { useState, useEffect } from "react";
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
import { Users, Plus, Search, Edit, Mail, Phone, Upload, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS, getFromStorage, addToStorage, updateInStorage, deleteFromStorage } from "@/lib/localStorage";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const funcionarioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  funcao: z.string().min(1, "Selecione uma função"),
  setor: z.string().min(1, "Selecione um setor"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type FuncionarioFormData = z.infer<typeof funcionarioSchema>;

interface Funcionario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  funcao: string;
  setor: string;
  status: string;
  dataAdmissao: string;
  foto?: string;
  senha?: string;
}

const Funcionarios = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const mockFuncoes = getFromStorage(STORAGE_KEYS.FUNCOES, [
    { id: "1", nome: "Gerente de Obras" },
    { id: "2", nome: "Engenheiro Civil" },
  ]).map(f => f.nome);

  const mockSetores = getFromStorage(STORAGE_KEYS.SETORES, [
    { id: "1", nome: "Gestão" },
    { id: "2", nome: "Operacional" },
  ]).map(s => s.nome);

  useEffect(() => {
    const stored = getFromStorage<Funcionario>(STORAGE_KEYS.FUNCIONARIOS);
    if (stored.length === 0) {
      const defaultFuncionarios: Funcionario[] = [
        {
          id: "1",
          nome: "João Silva",
          email: "joao.silva@engflow.com",
          telefone: "(11) 98765-4321",
          funcao: "Gerente de Obras",
          setor: "Gestão",
          status: "ativo",
          dataAdmissao: "2023-01-15"
        },
        {
          id: "2",
          nome: "Maria Santos",
          email: "maria.santos@engflow.com",
          telefone: "(21) 99876-5432",
          funcao: "Engenheira Civil",
          setor: "Engenharia",
          status: "ativo",
          dataAdmissao: "2023-03-20"
        },
      ];
      setFuncionarios(defaultFuncionarios);
      localStorage.setItem(STORAGE_KEYS.FUNCIONARIOS, JSON.stringify(defaultFuncionarios));
    } else {
      setFuncionarios(stored);
    }
  }, []);

  const form = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      funcao: "",
      setor: "",
      senha: "",
    },
  });

  useEffect(() => {
    if (editingFuncionario) {
      form.reset({
        nome: editingFuncionario.nome,
        email: editingFuncionario.email,
        telefone: editingFuncionario.telefone,
        funcao: editingFuncionario.funcao,
        setor: editingFuncionario.setor,
        senha: editingFuncionario.senha || "",
      });
      setFotoPreview(editingFuncionario.foto || "");
    } else {
      form.reset({
        nome: "",
        email: "",
        telefone: "",
        funcao: "",
        setor: "",
        senha: "",
      });
      setFotoPreview("");
    }
  }, [editingFuncionario, form]);

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
      const updated = updateInStorage<Funcionario>(STORAGE_KEYS.FUNCIONARIOS, editingFuncionario.id, {
        ...data,
        foto: fotoPreview,
      });
      setFuncionarios(updated as Funcionario[]);
      toast({
        title: "Funcionário atualizado!",
        description: `${data.nome} foi atualizado com sucesso.`,
      });
    } else {
      const novoFuncionario: Funcionario = {
        id: Date.now().toString(),
        ...data,
        status: "ativo",
        dataAdmissao: new Date().toISOString().split('T')[0],
        foto: fotoPreview,
      };
      const updated = addToStorage(STORAGE_KEYS.FUNCIONARIOS, novoFuncionario);
      setFuncionarios(updated);
      toast({
        title: "Funcionário cadastrado!",
        description: `${data.nome} foi adicionado com sucesso.`,
      });
    }
    setOpen(false);
    form.reset();
    setFotoPreview("");
    setEditingFuncionario(null);
  };

  const handleEdit = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario);
    setOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      const updated = deleteFromStorage<Funcionario>(STORAGE_KEYS.FUNCIONARIOS, deleteId);
      setFuncionarios(updated as Funcionario[]);
      toast({
        title: "Funcionário excluído!",
        description: "O funcionário foi removido com sucesso.",
      });
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
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
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cadastro de Funcionários</h1>
          <p className="text-muted-foreground">Gerenciamento de colaboradores</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setEditingFuncionario(null);
            setFotoPreview("");
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent">
              <Plus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingFuncionario ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
              <DialogDescription>
                {editingFuncionario ? "Atualize as informações do funcionário" : "Adicione um novo funcionário ao sistema"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <FormField
                    control={form.control}
                    name="funcao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Função</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a função" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockFuncoes.map(funcao => (
                              <SelectItem key={funcao} value={funcao}>{funcao}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="setor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setor</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o setor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockSetores.map(setor => (
                              <SelectItem key={setor} value={setor}>{setor}</SelectItem>
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

                <div className="flex justify-end gap-3">
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
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">funcionários cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">4</div>
            <p className="text-xs text-muted-foreground mt-1">trabalhando atualmente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Por Setor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">setores diferentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">0</div>
            <p className="text-xs text-muted-foreground mt-1">novos colaboradores</p>
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
            {funcionarios.map((funcionario) => (
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
                      {getStatusBadge(funcionario.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {funcionario.funcao} • {funcionario.setor}
                    </p>
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
            ))}
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
