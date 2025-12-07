import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

// Types baseados nas tabelas do banco
type TipoItemWBS = Database["public"]["Enums"]["tipo_item_wbs"];
type StatusAtividade = Database["public"]["Enums"]["status_atividade"];
type TipoDependencia = Database["public"]["Enums"]["tipo_dependencia"];

export interface EapItem {
  id: string;
  cronograma_id: string;
  item_pai_id?: string | null;
  codigo_wbs: string;
  nome: string;
  descricao?: string | null;
  tipo: TipoItemWBS;
  nivel_hierarquia: number;
  posicao_irmao: number;
  data_inicio_planejada?: string | null;
  data_fim_planejada?: string | null;
  duracao_planejada?: number | null;
  status?: StatusAtividade | null;
  percentual_conclusao?: number | null;
  e_marco?: boolean | null;
  notas?: string | null;
  prioridade?: number | null;
}

export interface DependenciaAtividade {
  id: string;
  atividade_predecessora_id: string;
  atividade_sucessora_id: string;
  tipo: TipoDependencia;
  defasagem_horas?: number | null;
}

// Converter EapItem para formato compatível com Tarefa do MSProjectGantt
export interface TarefaGantt {
  id: string;
  cronograma_id: string;
  parent_id?: string | null;
  nome: string;
  descricao?: string;
  tipo: "tarefa" | "etapa" | "marco";
  data_inicio_planejada: string;
  data_fim_planejada: string;
  duracao_dias: number;
  percentual_concluido: number;
  status: string;
  ordem_wbs?: string;
  indice: number;
  nivel: number;
  dependencias?: string[];
}

const mapTipoToGantt = (tipo: TipoItemWBS, e_marco?: boolean | null): "tarefa" | "etapa" | "marco" => {
  if (e_marco) return "marco";
  if (tipo === "fase") return "etapa";
  if (tipo === "atividade") return "tarefa";
  if (tipo === "marco") return "marco";
  if (tipo === "projeto") return "etapa";
  return "tarefa";
};

const mapStatusToString = (status: StatusAtividade | null): string => {
  if (!status) return "nao_iniciado";
  return status;
};

export const cronogramaGanttService = {
  // Buscar tarefas (eap_itens) de um cronograma
  async getTarefas(cronogramaId: string): Promise<TarefaGantt[]> {
    const { data, error } = await supabase
      .from("eap_itens")
      .select("*")
      .eq("cronograma_id", cronogramaId)
      .order("posicao_irmao", { ascending: true });

    if (error) throw error;

    // Buscar dependências
    const taskIds = (data || []).map(t => t.id);
    const { data: deps } = await supabase
      .from("dependencias_atividades")
      .select("*")
      .in("atividade_sucessora_id", taskIds);

    // Mapear dependências
    const depsMap = new Map<string, string[]>();
    deps?.forEach((d) => {
      if (!depsMap.has(d.atividade_sucessora_id)) {
        depsMap.set(d.atividade_sucessora_id, []);
      }
      depsMap.get(d.atividade_sucessora_id)!.push(d.atividade_predecessora_id);
    });

    return (data || []).map((item, index) => ({
      id: item.id,
      cronograma_id: item.cronograma_id,
      parent_id: item.item_pai_id,
      nome: item.nome,
      descricao: item.descricao || undefined,
      tipo: mapTipoToGantt(item.tipo as TipoItemWBS, item.e_marco),
      data_inicio_planejada: item.data_inicio_planejada || new Date().toISOString(),
      data_fim_planejada: item.data_fim_planejada || new Date().toISOString(),
      duracao_dias: item.duracao_planejada || 1,
      percentual_concluido: item.percentual_conclusao || 0,
      status: mapStatusToString(item.status as StatusAtividade | null),
      ordem_wbs: item.codigo_wbs,
      indice: index + 1,
      nivel: item.nivel_hierarquia,
      dependencias: depsMap.get(item.id) || [],
    }));
  },

  // Buscar dependências
  async getDependencias(cronogramaId: string): Promise<DependenciaAtividade[]> {
    // Primeiro buscar os IDs das tarefas deste cronograma
    const { data: tarefas } = await supabase
      .from("eap_itens")
      .select("id")
      .eq("cronograma_id", cronogramaId);

    if (!tarefas || tarefas.length === 0) return [];

    const taskIds = tarefas.map(t => t.id);

    const { data, error } = await supabase
      .from("dependencias_atividades")
      .select("*")
      .in("atividade_predecessora_id", taskIds);

    if (error) throw error;
    return (data || []) as DependenciaAtividade[];
  },

  // Criar tarefa
  async createTarefa(tarefa: Partial<TarefaGantt>): Promise<TarefaGantt> {
    if (!tarefa.cronograma_id || !tarefa.nome) {
      throw new Error("cronograma_id e nome são obrigatórios");
    }

    // Calcular próximo posicao_irmao
    const { data: existing } = await supabase
      .from("eap_itens")
      .select("posicao_irmao")
      .eq("cronograma_id", tarefa.cronograma_id)
      .eq("item_pai_id", tarefa.parent_id || null)
      .order("posicao_irmao", { ascending: false })
      .limit(1);

    const nextPosition = existing && existing.length > 0 ? (existing[0].posicao_irmao || 0) + 1 : 1;

    // Gerar código WBS
    let codigoWbs = String(nextPosition);
    if (tarefa.parent_id) {
      const { data: parent } = await supabase
        .from("eap_itens")
        .select("codigo_wbs")
        .eq("id", tarefa.parent_id)
        .single();
      if (parent) {
        codigoWbs = `${parent.codigo_wbs}.${nextPosition}`;
      }
    }

    // Mapear tipo
    let tipoDb: TipoItemWBS = "atividade";
    let e_marco = false;
    if (tarefa.tipo === "marco") {
      tipoDb = "marco";
      e_marco = true;
    } else if (tarefa.tipo === "etapa") {
      tipoDb = "fase";
    }

    const { data, error } = await supabase
      .from("eap_itens")
      .insert({
        cronograma_id: tarefa.cronograma_id,
        item_pai_id: tarefa.parent_id || null,
        codigo_wbs: codigoWbs,
        nome: tarefa.nome,
        descricao: tarefa.descricao || null,
        tipo: tipoDb,
        nivel_hierarquia: tarefa.nivel || 0,
        posicao_irmao: nextPosition,
        data_inicio_planejada: tarefa.data_inicio_planejada,
        data_fim_planejada: tarefa.data_fim_planejada,
        duracao_planejada: tarefa.duracao_dias || 1,
        status: "nao_iniciada" as StatusAtividade,
        percentual_conclusao: 0,
        e_marco,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      cronograma_id: data.cronograma_id,
      parent_id: data.item_pai_id,
      nome: data.nome,
      descricao: data.descricao || undefined,
      tipo: mapTipoToGantt(data.tipo as TipoItemWBS, data.e_marco),
      data_inicio_planejada: data.data_inicio_planejada || new Date().toISOString(),
      data_fim_planejada: data.data_fim_planejada || new Date().toISOString(),
      duracao_dias: data.duracao_planejada || 1,
      percentual_concluido: data.percentual_conclusao || 0,
      status: mapStatusToString(data.status as StatusAtividade | null),
      ordem_wbs: data.codigo_wbs,
      indice: nextPosition,
      nivel: data.nivel_hierarquia,
    };
  },

  // Atualizar tarefa
  async updateTarefa(id: string, updates: Partial<TarefaGantt>): Promise<TarefaGantt> {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
    if (updates.descricao !== undefined) dbUpdates.descricao = updates.descricao;
    if (updates.data_inicio_planejada !== undefined) dbUpdates.data_inicio_planejada = updates.data_inicio_planejada;
    if (updates.data_fim_planejada !== undefined) dbUpdates.data_fim_planejada = updates.data_fim_planejada;
    if (updates.duracao_dias !== undefined) dbUpdates.duracao_planejada = updates.duracao_dias;
    if (updates.percentual_concluido !== undefined) dbUpdates.percentual_conclusao = updates.percentual_concluido;
    if (updates.parent_id !== undefined) dbUpdates.item_pai_id = updates.parent_id;
    if (updates.nivel !== undefined) dbUpdates.nivel_hierarquia = updates.nivel;
    
    if (updates.tipo !== undefined) {
      if (updates.tipo === "marco") {
        dbUpdates.tipo = "marco";
        dbUpdates.e_marco = true;
      } else if (updates.tipo === "etapa") {
        dbUpdates.tipo = "fase";
        dbUpdates.e_marco = false;
      } else {
        dbUpdates.tipo = "atividade";
        dbUpdates.e_marco = false;
      }
    }

    const { data, error } = await supabase
      .from("eap_itens")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      cronograma_id: data.cronograma_id,
      parent_id: data.item_pai_id,
      nome: data.nome,
      descricao: data.descricao || undefined,
      tipo: mapTipoToGantt(data.tipo as TipoItemWBS, data.e_marco),
      data_inicio_planejada: data.data_inicio_planejada || new Date().toISOString(),
      data_fim_planejada: data.data_fim_planejada || new Date().toISOString(),
      duracao_dias: data.duracao_planejada || 1,
      percentual_concluido: data.percentual_conclusao || 0,
      status: mapStatusToString(data.status as StatusAtividade | null),
      ordem_wbs: data.codigo_wbs,
      indice: data.posicao_irmao,
      nivel: data.nivel_hierarquia,
    };
  },

  // Deletar tarefa
  async deleteTarefa(id: string): Promise<void> {
    // Deletar dependências relacionadas
    await supabase
      .from("dependencias_atividades")
      .delete()
      .or(`atividade_predecessora_id.eq.${id},atividade_sucessora_id.eq.${id}`);

    const { error } = await supabase
      .from("eap_itens")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Criar dependência
  async addDependencia(
    predecessorId: string,
    sucessorId: string,
    tipo: string = "FS",
    defasagemHoras: number = 0
  ): Promise<DependenciaAtividade> {
    const { data, error } = await supabase
      .from("dependencias_atividades")
      .insert({
        atividade_predecessora_id: predecessorId,
        atividade_sucessora_id: sucessorId,
        tipo: tipo as TipoDependencia,
        defasagem_horas: defasagemHoras,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DependenciaAtividade;
  },

  // Remover dependência
  async removeDependencia(id: string): Promise<void> {
    const { error } = await supabase
      .from("dependencias_atividades")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
