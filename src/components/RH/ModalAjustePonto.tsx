// 🤖 CLAUDE-NOTE: Modal para ajustes manuais de ponto com justificativas obrigatórias
// 📅 Criado em: 2024-11-28
// 🎯 Propósito: Permitir ajustes manuais preservando dados originais + auditoria
// ⚠️ IMPORTANTE: Sempre exigir justificativa e manter registro original intacto
// 🔗 Usado por: ControlePonto.tsx

import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, AlertTriangle, FileText, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { TIPO_REGISTRO_LABELS, TipoRegistroPonto } from "@/types/ponto";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const ajustePontoSchema = z.object({
  tipo_registro_novo: z.string().min(1, "Tipo de registro é obrigatório"),
  hora_nova: z
    .string()
    .min(5, "Hora deve estar no formato HH:MM")
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Formato inválido. Use HH:MM"),
  data_nova: z
    .string()
    .min(10, "Data é obrigatória"),
  justificativa_id: z
    .string()
    .min(1, "Justificativa é obrigatória"),
  justificativa_texto: z
    .string()
    .min(10, "Justificativa deve ter pelo menos 10 caracteres")
    .max(500, "Justificativa deve ter no máximo 500 caracteres"),
  documento_url: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal("")),
});

export type AjustePontoFormData = z.infer<typeof ajustePontoSchema>;

interface ModalAjustePontoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registroOriginal: {
    funcionario_id: string;
    funcionario_nome: string;
    data_registro: string;
    tipo_registro_original?: TipoRegistroPonto;
    hora_original?: string;
    registro_ponto_id?: string;
  } | null;
  onSuccess?: () => void;
}

interface TipoJustificativa {
  id: string;
  nome: string;
  categoria: string;
  obriga_documentacao: boolean;
  ativo: boolean;
}

export function ModalAjustePonto({
  open,
  onOpenChange,
  registroOriginal,
  onSuccess
}: ModalAjustePontoProps) {
  const [documentoObrigatorio, setDocumentoObrigatorio] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<AjustePontoFormData>({
    resolver: zodResolver(ajustePontoSchema),
    defaultValues: {
      tipo_registro_novo: "PE",
      hora_nova: "",
      data_nova: "",
      justificativa_id: "",
      justificativa_texto: "",
      documento_url: "",
    }
  });

  // 🤖 CLAUDE-NOTE: Buscar tipos de justificativas disponíveis ordenados por nome
  const { data: justificativas = [] } = useQuery({
    queryKey: ['tipos-justificativas-ponto', 'ativo'],
    queryFn: async (): Promise<TipoJustificativa[]> => {
      const { data, error } = await supabase
        .from('tipos_justificativas_ponto')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar tipos de justificativas:', error);
        return [];
      }

      return (data || []) as TipoJustificativa[];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Mutation para criar ajuste
  const addAjusteMutation = useMutation({
    mutationFn: async (ajusteData: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('ajustes_ponto')
        .insert([ajusteData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ajustes-ponto'] });
      queryClient.invalidateQueries({ queryKey: ['registros-ponto'] });
      onSuccess?.();
      onOpenChange(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Ajuste de ponto registrado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar ajuste:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o ajuste.",
        variant: "destructive",
      });
    }
  });

  // 🤖 CLAUDE-NOTE: Configurar formulário quando dados originais mudarem
  useEffect(() => {
    if (registroOriginal && open) {
      form.reset({
        tipo_registro_novo: registroOriginal.tipo_registro_original || "PE",
        hora_nova: registroOriginal.hora_original || "",
        data_nova: registroOriginal.data_registro || "",
        justificativa_id: "",
        justificativa_texto: "",
        documento_url: "",
      });
    }
  }, [registroOriginal, open, form]);

  // 🤖 CLAUDE-NOTE: Verificar se justificativa obriga documentação
  useEffect(() => {
    const justificativaId = form.watch("justificativa_id");
    if (justificativaId) {
      const justificativa = justificativas.find(j => j.id === justificativaId);
      setDocumentoObrigatorio(justificativa?.obriga_documentacao || false);

      if (!justificativa?.obriga_documentacao) {
        form.setValue("documento_url", "");
      }
    }
  }, [form.watch("justificativa_id"), justificativas, form]);

  const handleSubmit = async (data: AjustePontoFormData) => {
    if (!registroOriginal) return;
    
    if (!user?.id) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return;
    }

    if (documentoObrigatorio && !data.documento_url) {
      form.setError("documento_url", {
        message: "Documentação é obrigatória para esta justificativa"
      });
      return;
    }

    const dataHoraAjuste = new Date(`${data.data_nova}T${data.hora_nova}`);
    if (dataHoraAjuste > new Date()) {
      form.setError("hora_nova", {
        message: "Não é possível ajustar para horário futuro"
      });
      return;
    }

    // Buscar funcionário vinculado ao usuário para usar como usuario_ajuste_id
    const { data: funcionarioData } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const ajusteData = {
      registro_ponto_id: registroOriginal.registro_ponto_id || null,
      funcionario_id: registroOriginal.funcionario_id,
      tipo_registro_original: registroOriginal.tipo_registro_original || null,
      hora_original: registroOriginal.hora_original || null,
      data_original: registroOriginal.data_registro,
      tipo_registro_novo: data.tipo_registro_novo,
      hora_nova: data.hora_nova,
      data_nova: data.data_nova,
      justificativa_id: data.justificativa_id,
      justificativa_texto: data.justificativa_texto,
      documento_url: data.documento_url || null,
      usuario_ajuste_id: funcionarioData?.id || registroOriginal.funcionario_id,
      status: 'ativo'
    };

    addAjusteMutation.mutate(ajusteData);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!registroOriginal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ajustar Ponto Manual
          </DialogTitle>
          <DialogDescription>
            Realize ajuste manual preservando o registro original para auditoria.
            <strong className="text-orange-600"> Justificativa é obrigatória.</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Informações do Funcionário */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-gray-600" />
            <span className="font-medium">{registroOriginal.funcionario_nome}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Data:</span>
              <span className="ml-2">
                {new Date(registroOriginal.data_registro + 'T00:00:00').toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Registro Original:</span>
              <span className="ml-2">
                {registroOriginal.tipo_registro_original ?
                  TIPO_REGISTRO_LABELS[registroOriginal.tipo_registro_original] :
                  'Novo Registro'
                }
                {registroOriginal.hora_original && ` às ${registroOriginal.hora_original.slice(0, 5)}`}
              </span>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Tipo de Registro e Horário */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_registro_novo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Registro *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TIPO_REGISTRO_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            <Badge className="mr-2">{key}</Badge>
                            {label}
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
                name="hora_nova"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Novo Horário *</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Horário correto do registro
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Data */}
            <FormField
              control={form.control}
              name="data_nova"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Data do registro (normalmente não deve ser alterada)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Justificativa */}
            <FormField
              control={form.control}
              name="justificativa_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Justificativa *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motivo do ajuste" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {justificativas.map((justificativa) => (
                        <SelectItem key={justificativa.id} value={justificativa.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{justificativa.nome}</span>
                            {justificativa.obriga_documentacao && (
                              <span className="text-xs text-orange-600">📎 Requer documentação</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Justificativa Texto */}
            <FormField
              control={form.control}
              name="justificativa_texto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa Detalhada *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhadamente o motivo do ajuste..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Explique claramente o motivo do ajuste para auditoria
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Documentação (se obrigatória) */}
            {documentoObrigatorio && (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Documentação obrigatória!</strong> Esta justificativa requer anexo de documento comprobatório.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="documento_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do Documento *</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <FileText className="h-5 w-5 mt-2 text-gray-500" />
                          <Input
                            placeholder="https://exemplo.com/documento.pdf"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        URL do documento que comprova a necessidade do ajuste
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Botões */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={addAjusteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={addAjusteMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {addAjusteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Ajuste
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}