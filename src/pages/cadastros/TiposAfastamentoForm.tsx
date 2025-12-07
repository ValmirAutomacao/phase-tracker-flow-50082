// 🤖 CLAUDE-NOTE: Formulário para tipos de afastamentos com validações específicas
// 📅 Criado em: 2024-11-28
// 🎯 Propósito: Formulário com validações de negócio para tipos de afastamentos
// ⚠️ IMPORTANTE: Validações específicas por categoria (ex: férias até 30 dias)

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
import { Loader2, AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Cores padrão fixas para cada categoria de afastamento
const CORES_PADRAO_AFASTAMENTO = {
  ferias: '#22C55E',        // Verde
  licenca_medica: '#3B82F6',     // Azul
  licenca_maternidade: '#EC4899', // Rosa
  licenca_paternidade: '#A855F7', // Roxo
  atestado: '#F59E0B',           // Laranja
  falta_justificada: '#EAB308',   // Amarelo
  outros: '#6B7280'              // Cinza
} as const;

const CATEGORIA_VALUES = ['ferias', 'licenca_medica', 'licenca_maternidade', 'licenca_paternidade', 'atestado', 'falta_justificada', 'outros'] as const;

const tipoAfastamentoSchema = z.object({
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
  categoria: z.enum(CATEGORIA_VALUES, {
    required_error: "Categoria é obrigatória",
  }),
  cor: z.string().min(1, "Cor é obrigatória").default('#6B7280'),
  dias_max_permitidos: z
    .number()
    .int("Deve ser um número inteiro")
    .min(1, "Deve ser pelo menos 1 dia")
    .max(365, "Não pode exceder 365 dias")
    .nullable()
    .optional(),
  remunerado: z.boolean().default(true),
  obriga_documentacao: z.boolean().default(false),
  ativo: z.boolean().default(true),
}).refine((data) => {
  // 🤖 CLAUDE-NOTE: Validações específicas por categoria
  if (data.categoria === 'ferias' && data.dias_max_permitidos && data.dias_max_permitidos > 30) {
    return false;
  }
  if (data.categoria === 'licenca_paternidade' && data.dias_max_permitidos && data.dias_max_permitidos > 20) {
    return false;
  }
  if (data.categoria === 'atestado' && data.dias_max_permitidos && data.dias_max_permitidos > 15) {
    return false;
  }
  return true;
}, {
  message: "Limite de dias inválido para esta categoria",
  path: ["dias_max_permitidos"]
});

export type TipoAfastamentoFormData = z.infer<typeof tipoAfastamentoSchema>;

interface TiposAfastamentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TipoAfastamentoFormData) => void;
  initialData?: any;
  isLoading?: boolean;
}

const CATEGORIAS = [
  {
    value: 'ferias',
    label: 'Férias',
    description: 'Período de descanso anual (máx. 30 dias)',
    cor: CORES_PADRAO_AFASTAMENTO.ferias,
    maxDias: 30,
    remuneradoPadrao: true,
    documentacaoPadrao: false
  },
  {
    value: 'licenca_medica',
    label: 'Licença Médica',
    description: 'Licença médica acima de 15 dias (INSS)',
    cor: CORES_PADRAO_AFASTAMENTO.licenca_medica,
    remuneradoPadrao: false,
    documentacaoPadrao: true
  },
  {
    value: 'licenca_maternidade',
    label: 'Licença Maternidade',
    description: 'Licença maternidade (120 dias)',
    cor: CORES_PADRAO_AFASTAMENTO.licenca_maternidade,
    maxDias: 120,
    remuneradoPadrao: true,
    documentacaoPadrao: true
  },
  {
    value: 'licenca_paternidade',
    label: 'Licença Paternidade',
    description: 'Licença paternidade (máx. 20 dias)',
    cor: CORES_PADRAO_AFASTAMENTO.licenca_paternidade,
    maxDias: 20,
    remuneradoPadrao: true,
    documentacaoPadrao: true
  },
  {
    value: 'atestado',
    label: 'Atestado Médico',
    description: 'Atestado médico até 15 dias',
    cor: CORES_PADRAO_AFASTAMENTO.atestado,
    maxDias: 15,
    remuneradoPadrao: true,
    documentacaoPadrao: true
  },
  {
    value: 'falta_justificada',
    label: 'Falta Justificada',
    description: 'Falta por motivo justificado',
    cor: CORES_PADRAO_AFASTAMENTO.falta_justificada,
    remuneradoPadrao: false,
    documentacaoPadrao: true
  },
  {
    value: 'outros',
    label: 'Outros',
    description: 'Outros tipos não listados acima',
    cor: CORES_PADRAO_AFASTAMENTO.outros,
    remuneradoPadrao: false,
    documentacaoPadrao: false
  }
];

export function TiposAfastamentoForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false
}: TiposAfastamentoFormProps) {
  const form = useForm<TipoAfastamentoFormData>({
    resolver: zodResolver(tipoAfastamentoSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      categoria: "outros",
      cor: CORES_PADRAO_AFASTAMENTO.outros,
      dias_max_permitidos: null,
      remunerado: true,
      obriga_documentacao: false,
      ativo: true,
    }
  });

  const categoriaAtual = form.watch("categoria");
  const categoriaConfig = CATEGORIAS.find(c => c.value === categoriaAtual);

  // 🤖 CLAUDE-NOTE: Reset form e aplicar configurações padrão da categoria
  React.useEffect(() => {
    if (initialData) {
      form.reset({
        nome: initialData.nome || "",
        descricao: initialData.descricao || "",
        categoria: initialData.categoria || "outros",
        cor: initialData.cor || CORES_PADRAO_AFASTAMENTO[initialData.categoria as keyof typeof CORES_PADRAO_AFASTAMENTO] || CORES_PADRAO_AFASTAMENTO.outros,
        dias_max_permitidos: initialData.dias_max_permitidos || null,
        remunerado: initialData.remunerado ?? true,
        obriga_documentacao: initialData.obriga_documentacao ?? false,
        ativo: initialData.ativo ?? true,
      });
    } else {
      form.reset({
        nome: "",
        descricao: "",
        categoria: "outros",
        cor: CORES_PADRAO_AFASTAMENTO.outros,
        dias_max_permitidos: null,
        remunerado: true,
        obriga_documentacao: false,
        ativo: true,
      });
    }
  }, [initialData, form]);

  // 🤖 CLAUDE-NOTE: Aplicar configurações padrão quando categoria muda
  React.useEffect(() => {
    if (!initialData && categoriaConfig) {
      form.setValue("cor", categoriaConfig.cor);
      form.setValue("remunerado", categoriaConfig.remuneradoPadrao);
      form.setValue("obriga_documentacao", categoriaConfig.documentacaoPadrao);
      if (categoriaConfig.maxDias) {
        form.setValue("dias_max_permitidos", categoriaConfig.maxDias);
      }
    }
  }, [categoriaAtual, categoriaConfig, form, initialData]);

  const handleSubmit = (data: TipoAfastamentoFormData) => {
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
            {initialData ? "Editar Tipo de Afastamento" : "Novo Tipo de Afastamento"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Modifique as informações do tipo de afastamento."
              : "Adicione um novo tipo de afastamento com suas regras específicas."}
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
                      placeholder="Ex: Férias Anuais"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Nome identificador do tipo de afastamento
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
                  {categoriaConfig && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{categoriaConfig.label}:</strong> {categoriaConfig.description}
                        {categoriaConfig.maxDias && ` (Limite sugerido: ${categoriaConfig.maxDias} dias)`}
                      </AlertDescription>
                    </Alert>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Descrição */}
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição detalhada do tipo de afastamento..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Descrição opcional com detalhes sobre quando usar este tipo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dias Máximos */}
              <FormField
                control={form.control}
                name="dias_max_permitidos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias Máximos Permitidos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 30"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseInt(value) : null);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Deixe em branco para ilimitado
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Switches */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="remunerado"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Remunerado
                      </FormLabel>
                      <FormDescription>
                        Funcionário recebe salário
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
                name="obriga_documentacao"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Documentação Obrigatória
                      </FormLabel>
                      <FormDescription>
                        Exigir anexo de documentos
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
                        Disponível para uso
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

            {/* Alerta de Validação */}
            {categoriaConfig?.maxDias && form.watch("dias_max_permitidos") &&
             form.watch("dias_max_permitidos")! > categoriaConfig.maxDias && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Atenção:</strong> Para {categoriaConfig.label}, o limite recomendado é de {categoriaConfig.maxDias} dias.
                  Verifique a legislação trabalhista aplicável.
                </AlertDescription>
              </Alert>
            )}

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