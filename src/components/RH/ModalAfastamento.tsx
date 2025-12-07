// 🤖 CLAUDE-NOTE: Modal para registro de afastamentos com upload de documentos
// 📅 Criado em: 2024-11-29
// 🎯 Propósito: Registrar afastamentos (atestados, férias, licenças) com documentação
// ⚠️ IMPORTANTE: Upload para Supabase Storage + validação de datas sobreposição
// 🔗 Usado por: ControlePonto.tsx

import React, { useState } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Upload, FileText } from "lucide-react";
import {
  TipoAfastamento,
  TIPO_AFASTAMENTO_LABELS,
  AfastamentoInsert,
  FuncionarioCompleto
} from "@/types/ponto";
import { useQuery } from "@tanstack/react-query";

// Interface para tipos de afastamento do Supabase
interface TipoAfastamentoDb {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  dias_max_permitidos?: number;
  remunerado: boolean;
  obriga_documentacao: boolean;
  ativo: boolean;
}

const afastamentoSchema = z.object({
  funcionario_id: z.string().min(1, "Funcionário é obrigatório"),
  tipo_afastamento_id: z.string().min(1, "Tipo de afastamento é obrigatório"),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim: z.string().min(1, "Data de fim é obrigatória"),
  motivo: z.string().min(10, "Motivo deve ter pelo menos 10 caracteres"),
  observacoes: z.string().optional(),
}).refine((data) => {
  return new Date(data.data_fim) >= new Date(data.data_inicio);
}, {
  message: "Data de fim deve ser posterior à data de início",
  path: ["data_fim"],
});

type AfastamentoForm = z.infer<typeof afastamentoSchema>;

interface ModalAfastamentoProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  funcionarios: FuncionarioCompleto[];
  onSubmit: (data: AfastamentoInsert & { arquivo?: File }) => Promise<void>;
  funcionarioSelecionado?: string;
}

// Função para buscar tipos de afastamento usando SupabaseService
const buscarTiposAfastamento = async (): Promise<TipoAfastamentoDb[]> => {
  try {
    const { SupabaseService } = await import('@/lib/supabaseService');
    const supabaseService = new SupabaseService();
    const response = await supabaseService.getFromSupabase('tipos_afastamento_ponto');
    return (response?.filter((tipo: TipoAfastamentoDb) => tipo.ativo) || []) as TipoAfastamentoDb[];
  } catch (error) {
    console.error('Erro ao buscar tipos de afastamento:', error);
    return [];
  }
};

// Função para verificar sobreposições de afastamento simplificada
const verificarSobreposicaoAfastamento = async (
  funcionarioId: string,
  dataInicio: string,
  dataFim: string
): Promise<boolean> => {
  try {
    const { SupabaseService } = await import('@/lib/supabaseService');
    const supabaseService = new SupabaseService();
    const afastamentos = await supabaseService.getFromSupabase('afastamentos');

    if (!afastamentos) return false;

    return afastamentos.some((afastamento: any) => {
      if (afastamento.funcionario_id !== funcionarioId) return false;
      if (!['pendente', 'aprovado'].includes(afastamento.status)) return false;

      const inicioExistente = new Date(afastamento.data_inicio);
      const fimExistente = new Date(afastamento.data_fim);
      const novoInicio = new Date(dataInicio);
      const novoFim = new Date(dataFim);

      return (novoInicio <= fimExistente && novoFim >= inicioExistente);
    });
  } catch (error) {
    console.error('Erro ao verificar sobreposição:', error);
    throw new Error('Falha ao verificar conflitos de afastamento');
  }
};

export function ModalAfastamento({
  isOpen,
  onOpenChange,
  funcionarios,
  onSubmit,
  funcionarioSelecionado,
}: ModalAfastamentoProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoAfastamentoDb | null>(null);

  // Buscar tipos de afastamento do Supabase
  const { data: tiposAfastamento = [], isLoading: carregandoTipos } = useQuery({
    queryKey: ['tipos-afastamento'],
    queryFn: buscarTiposAfastamento,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  const form = useForm<AfastamentoForm>({
    resolver: zodResolver(afastamentoSchema),
    defaultValues: {
      funcionario_id: funcionarioSelecionado || "",
      tipo_afastamento_id: "",
      data_inicio: "",
      data_fim: "",
      motivo: "",
      observacoes: "",
    },
  });

  // Atualizar tipo selecionado quando mudar
  const handleTipoChange = (tipoId: string) => {
    form.setValue("tipo_afastamento_id", tipoId);
    const tipo = tiposAfastamento.find(t => t.id === tipoId);
    setTipoSelecionado(tipo || null);

    // Limpar arquivo se não for obrigatório
    if (tipo && !tipo.obriga_documentacao) {
      setArquivoSelecionado(null);
    }
  };

  const handleSubmit = async (data: AfastamentoForm) => {
    setIsLoading(true);
    try {
      // Validações adicionais
      if (tipoSelecionado?.obriga_documentacao && !arquivoSelecionado) {
        form.setError("tipo_afastamento_id", {
          message: "Este tipo de afastamento requer documentação anexa"
        });
        setIsLoading(false);
        return;
      }

      // Validar limite de dias se especificado
      const dataInicio = new Date(data.data_inicio);
      const dataFim = new Date(data.data_fim);
      const totalDias = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (tipoSelecionado?.dias_max_permitidos && totalDias > tipoSelecionado.dias_max_permitidos) {
        form.setError("data_fim", {
          message: `Este tipo de afastamento permite no máximo ${tipoSelecionado.dias_max_permitidos} dias`
        });
        setIsLoading(false);
        return;
      }

      // Verificar sobreposições com outros afastamentos
      const temSobreposicao = await verificarSobreposicaoAfastamento(
        data.funcionario_id,
        data.data_inicio,
        data.data_fim
      );

      if (temSobreposicao) {
        form.setError("data_inicio", {
          message: "Existe conflito com outro afastamento no período selecionado"
        });
        form.setError("data_fim", {
          message: "Existe conflito com outro afastamento no período selecionado"
        });
        setIsLoading(false);
        return;
      }

      // Preparar dados para submissão
      const submitData: AfastamentoInsert & { arquivo?: File } = {
        funcionario_id: data.funcionario_id,
        tipo_afastamento_id: data.tipo_afastamento_id,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        motivo: data.motivo,
        observacoes: data.observacoes,
        usuario_cadastro_id: "current_user_id", // TODO: pegar do contexto de auth
        arquivo: arquivoSelecionado || undefined,
      };

      await onSubmit(submitData);
      form.reset();
      setArquivoSelecionado(null);
      setTipoSelecionado(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao registrar afastamento:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArquivoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (arquivo) {
      // Validar tipo de arquivo (PDF, DOC, DOCX, JPG, PNG)
      const tiposPermitidos = ['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/png'];

      if (!tiposPermitidos.includes(arquivo.type)) {
        alert('Tipo de arquivo não permitido. Use PDF, DOC, DOCX, JPG ou PNG.');
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (arquivo.size > 5 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 5MB permitido.');
        return;
      }

      setArquivoSelecionado(arquivo);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Registrar Afastamento
          </DialogTitle>
          <DialogDescription>
            Registre afastamentos como atestados, férias ou licenças com documentação anexa.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="funcionario_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funcionário</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {funcionarios.map((func) => (
                        <SelectItem key={func.id} value={func.id}>
                          {func.nome} - {func.funcao?.nome}
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
              name="tipo_afastamento_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Afastamento</FormLabel>
                  <Select
                    onValueChange={handleTipoChange}
                    value={field.value}
                    disabled={carregandoTipos}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          carregandoTipos ? "Carregando tipos..." : "Selecione o tipo"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposAfastamento.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{tipo.nome}</span>
                            <div className="flex gap-2 text-xs text-gray-500">
                              {tipo.dias_max_permitidos && (
                                <span>Máx: {tipo.dias_max_permitidos} dias</span>
                              )}
                              {tipo.remunerado ? (
                                <span className="text-green-600">Remunerado</span>
                              ) : (
                                <span className="text-orange-600">Não remunerado</span>
                              )}
                              {tipo.obriga_documentacao && (
                                <span className="text-blue-600">📎 Doc. obrigatória</span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Informações do tipo selecionado */}
            {tipoSelecionado && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-medium text-blue-800 mb-1">{tipoSelecionado.nome}</h4>
                {tipoSelecionado.descricao && (
                  <p className="text-sm text-blue-700 mb-2">{tipoSelecionado.descricao}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {tipoSelecionado.dias_max_permitidos && (
                    <div>
                      <span className="font-medium">Limite:</span> {tipoSelecionado.dias_max_permitidos} dias
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Remuneração:</span> {
                      tipoSelecionado.remunerado ? 'Sim' : 'Não'
                    }
                  </div>
                </div>
                {tipoSelecionado.obriga_documentacao && (
                  <div className="mt-2 text-xs text-orange-600 font-medium">
                    ⚠️ Documentação obrigatória para este tipo de afastamento
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fim</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Calculadora de dias */}
            {form.watch("data_inicio") && form.watch("data_fim") && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total de dias:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {(() => {
                      const inicio = new Date(form.watch("data_inicio"));
                      const fim = new Date(form.watch("data_fim"));
                      if (fim >= inicio) {
                        return Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      }
                      return 0;
                    })()} dias
                  </span>
                </div>
                {tipoSelecionado?.dias_max_permitidos && (
                  <div className="mt-1 text-xs text-gray-500">
                    Limite máximo: {tipoSelecionado.dias_max_permitidos} dias
                  </div>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o motivo do afastamento (mínimo 10 caracteres)"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload de documento - mostrar sempre, mas marcar quando obrigatório */}
            <div className="space-y-2">
              <FormLabel>
                Documento Anexo
                {tipoSelecionado?.obriga_documentacao ? (
                  <span className="text-red-500 ml-1">*</span>
                ) : (
                  <span className="text-gray-500 ml-1">(Opcional)</span>
                )}
              </FormLabel>

              {tipoSelecionado?.obriga_documentacao && (
                <div className="p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
                  <strong>Atenção:</strong> Este tipo de afastamento requer documentação comprobatória.
                </div>
              )}

              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleArquivoChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                  required={tipoSelecionado?.obriga_documentacao}
                />
                <Upload className="h-5 w-5 text-gray-400" />
              </div>

              {arquivoSelecionado && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FileText className="h-4 w-4" />
                  <span>{arquivoSelecionado.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(arquivoSelecionado.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setArquivoSelecionado(null)}
                    className="text-red-500 hover:text-red-700 text-xs ml-2"
                  >
                    Remover
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máximo 5MB)
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Registrando..." : "Registrar Afastamento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}