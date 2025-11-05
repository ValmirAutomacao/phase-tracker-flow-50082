import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "@/styles/responsive.css";

const funcaoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  setor_id: z.string().min(1, "Selecione um setor"),
  nivel: z.string().min(1, "Selecione um nível"),
  permissoes: z.array(z.string()).min(1, "Selecione pelo menos uma permissão"),
});

export type FuncaoFormData = z.infer<typeof funcaoSchema>;

interface Setor {
  id: string;
  nome: string;
}

interface FuncoesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FuncaoFormData) => void;
  editData?: FuncaoFormData & { id: string };
  setores?: Setor[];
}

export function FuncoesForm({ open, onOpenChange, onSubmit, editData, setores = [] }: FuncoesFormProps) {
  const permissoesDisponiveis = [
    { id: "visualizar_obras", label: "Visualizar Obras" },
    { id: "editar_obras", label: "Editar Obras" },
    { id: "aprovar_compras", label: "Aprovar Compras" },
    { id: "gerenciar_equipe", label: "Gerenciar Equipe" },
    { id: "visualizar_financeiro", label: "Visualizar Financeiro" },
    { id: "editar_financeiro", label: "Editar Financeiro" },
  ];

  const niveisDisponiveis = [
    { id: "Gestão", label: "Gestão" },
    { id: "Técnico", label: "Técnico" },
    { id: "Operacional", label: "Operacional" },
  ];

  const form = useForm<FuncaoFormData>({
    resolver: zodResolver(funcaoSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      setor_id: "",
      nivel: "",
      permissoes: [],
    },
  });

  useEffect(() => {
    if (editData) {
      form.reset(editData);
    } else {
      form.reset({
        nome: "",
        descricao: "",
        setor_id: "",
        nivel: "",
        permissoes: [],
      });
    }
  }, [editData, form]);

  const handleSubmit = (data: FuncaoFormData) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="dialog-content-mobile">
            <DialogHeader className="dialog-header">
          <DialogTitle>{editData ? "Editar Função" : "Nova Função"}</DialogTitle>
          <DialogDescription>
            {editData ? "Atualize a função e suas permissões" : "Crie uma nova função e defina suas permissões"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full">
            <div className="dialog-form-container space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Função</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Gerente de Obras" {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descreva as responsabilidades" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4 mobile-stack">
              <FormField
                control={form.control}
                name="setor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nivel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {niveisDisponiveis.map(nivel => (
                          <SelectItem key={nivel.id} value={nivel.id}>{nivel.label}</SelectItem>
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
              name="permissoes"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Permissões</FormLabel>
                    <FormDescription>
                      Selecione as permissões para esta função
                    </FormDescription>
                  </div>
                  {permissoesDisponiveis.map((permissao) => (
                    <FormField
                      key={permissao.id}
                      control={form.control}
                      name="permissoes"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={permissao.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(permissao.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, permissao.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== permissao.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {permissao.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>

            <div className="form-actions">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editData ? "Atualizar" : "Cadastrar"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
