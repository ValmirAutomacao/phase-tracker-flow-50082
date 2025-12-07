// 🤖 CLAUDE-NOTE: Formulário para tipos de justificativas com validação
// 📅 Criado em: 2024-11-28
// 🎯 Propósito: Formulário completo com React Hook Form + Zod
// ⚠️ IMPORTANTE: Validações de negócio para garantir consistência dos dados

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

type CategoriaJustificativa = 'erro_sistema' | 'problema_localizacao' | 'esquecimento' | 'outros';

const tipoJustificativaSchema = z.object({
  nome: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(255, "Nome deve ter no máximo 255 caracteres")
    .trim(),
  descricao: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  categoria: z.string().refine((val): val is CategoriaJustificativa => 
    ['erro_sistema', 'problema_localizacao', 'esquecimento', 'outros'].includes(val),
    { message: "Categoria é obrigatória" }
  ),
  cor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor deve ser um código hexadecimal válido"),
  ativo: z.boolean(),
  obriga_documentacao: z.boolean(),
});

export type TipoJustificativaFormData = z.infer<typeof tipoJustificativaSchema>;

interface TiposJustificativasFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TipoJustificativaFormData) => void;
  initialData?: any;
  isLoading?: boolean;
}

const CATEGORIAS = [
  {
    value: 'erro_sistema',
    label: 'Erro de Sistema',
    description: 'Falhas técnicas no sistema de ponto'
  },
  {
    value: 'problema_localizacao',
    label: 'Problema de Localização',
    description: 'Questões relacionadas a GPS ou localização'
  },
  {
    value: 'esquecimento',
    label: 'Esquecimento',
    description: 'Funcionário esqueceu de bater ponto'
  },
  {
    value: 'outros',
    label: 'Outros',
    description: 'Outros motivos não listados'
  }
];

export function TiposJustificativasForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false
}: TiposJustificativasFormProps) {
  const form = useForm<TipoJustificativaFormData>({
    resolver: zodResolver(tipoJustificativaSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      categoria: "outros",
      cor: "#3B82F6",
      ativo: true,
      obriga_documentacao: false,
    }
  });

  // 🤖 CLAUDE-NOTE: Reset form quando initialData mudar (edição vs novo)
  React.useEffect(() => {
    if (initialData) {
      form.reset({
        nome: initialData.nome || "",
        descricao: initialData.descricao || "",
        categoria: initialData.categoria || "outros",
        cor: initialData.cor || "#3B82F6",
        ativo: initialData.ativo ?? true,
        obriga_documentacao: initialData.obriga_documentacao ?? false,
      });
    } else {
      form.reset({
        nome: "",
        descricao: "",
        categoria: "outros",
        cor: "#3B82F6",
        ativo: true,
        obriga_documentacao: false,
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: TipoJustificativaFormData) => {
    onSubmit(data);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Tipo de Justificativa" : "Novo Tipo de Justificativa"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Modifique as informações do tipo de justificativa."
              : "Adicione um novo tipo de justificativa para ajustes de ponto."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Nome */}
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Erro de Sistema"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Nome identificador do tipo de justificativa
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categoria */}
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIAS.map((categoria) => (
                        <SelectItem key={categoria.value} value={categoria.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{categoria.label}</span>
                            <span className="text-xs text-gray-500">{categoria.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Categoria que agrupa tipos similares de justificativas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cor */}
            <FormField
              control={form.control}
              name="cor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor de Identificação *</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        className="w-16 h-10 p-1 border border-gray-300 rounded cursor-pointer"
                        {...field}
                      />
                      <Input
                        type="text"
                        placeholder="#3B82F6"
                        className="flex-1"
                        {...field}
                      />
                      <div
                        className="w-10 h-10 rounded border border-gray-300"
                        style={{ backgroundColor: field.value }}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Cor que identificará este tipo no controle de ponto
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição detalhada do tipo de justificativa..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Descrição opcional para esclarecer quando usar esta justificativa
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Switches */}
            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="obriga_documentacao"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Documentação Obrigatória
                      </FormLabel>
                      <FormDescription>
                        Exigir anexo de documentos para esta justificativa
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Ativo
                      </FormLabel>
                      <FormDescription>
                        Tipo disponível para seleção nos ajustes
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}