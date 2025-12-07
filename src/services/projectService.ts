import { supabase } from "@/integrations/supabase/client";

// Tipos
type TipoTarefa = 'tarefa' | 'etapa' | 'marco';
type TipoRecursoType = 'humano' | 'material' | 'equipamento' | 'custo';

export interface Tarefa {
  id: string;
  cronograma_id: string;
  parent_id?: string | null;
  nome: string;
  descricao?: string;
  tipo: TipoTarefa;
  data_inicio_planejada: string;
  data_fim_planejada: string;
  duracao_dias: number;
  percentual_concluido: number;
  status: string;
  ordem_wbs?: string;
  indice: number;
  nivel: number;
  dependencias?: string[]; // IDs das tarefas predecessoras
}

export interface Cronograma {
  id: string;
  obra_id: string;
  nome: string;
  ativo: boolean;
  data_base_inicial: string;
}

export interface Dependencia {
  id: string;
  cronograma_id: string;
  tarefa_origem_id: string;
  tarefa_destino_id: string;
  tipo_vinculo: string; // FS, SS, FF, SF
  lag_dias: number;
}

export interface RecursoTarefa {
  id: string;
  tarefa_id: string;
  tipo_recurso: TipoRecursoType;
  funcionario_id?: string | null;
  nome_recurso_externo?: string | null;
  unidade_medida: string;
  quantidade_planejada: number;
  custo_unitario: number;
  custo_total_planejado: number;
  funcionario?: {
    nome: string;
  };
}

// Serviços
export const projectService = {
  // Buscar ou criar cronograma padrão
  async getOrCreateCronograma(obraId: string): Promise<Cronograma> {
    const { data: cronogramas, error } = await supabase
      .from('projeto_cronogramas')
      .select('*')
      .eq('obra_id', obraId)
      .eq('ativo', true)
      .limit(1);

    if (error) throw error;

    if (cronogramas && cronogramas.length > 0) {
      return cronogramas[0];
    }

    const { data: novoCronograma, error: createError } = await supabase
      .from('projeto_cronogramas')
      .insert({
        obra_id: obraId,
        nome: 'Cronograma Principal',
        ativo: true,
        data_base_inicial: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (createError) throw createError;
    return novoCronograma;
  },

  // Listar todas as tarefas de um cronograma
  async getTarefas(cronogramaId: string): Promise<Tarefa[]> {
    const { data: tarefas, error } = await supabase
      .from('projeto_tarefas')
      .select('*')
      .eq('cronograma_id', cronogramaId)
      .order('indice', { ascending: true });

    if (error) throw error;

    // Buscar dependências separadamente
    const { data: deps } = await supabase
      .from('projeto_dependencias')
      .select('tarefa_destino_id, tarefa_origem_id')
      .eq('cronograma_id', cronogramaId);

    // Mapear dependências por tarefa destino
    const depsMap = new Map<string, string[]>();
    deps?.forEach((d) => {
      if (!depsMap.has(d.tarefa_destino_id)) {
        depsMap.set(d.tarefa_destino_id, []);
      }
      depsMap.get(d.tarefa_destino_id)!.push(d.tarefa_origem_id);
    });

    return (tarefas || []).map((t) => ({
      ...t,
      tipo: t.tipo as TipoTarefa,
      dependencias: depsMap.get(t.id) || []
    }));
  },

  // Listar dependências de um cronograma
  async getDependencias(cronogramaId: string): Promise<Dependencia[]> {
    const { data, error } = await supabase
      .from('projeto_dependencias')
      .select('*')
      .eq('cronograma_id', cronogramaId);

    if (error) throw error;
    return data || [];
  },

  // Criar nova tarefa
  async createTarefa(tarefa: Partial<Tarefa>): Promise<Tarefa> {
    if (!tarefa.cronograma_id || !tarefa.nome) {
      throw new Error('cronograma_id e nome são obrigatórios');
    }

    // Calcular duração em dias
    let duracao_dias = 1;
    if (tarefa.data_inicio_planejada && tarefa.data_fim_planejada) {
      const start = new Date(tarefa.data_inicio_planejada);
      const end = new Date(tarefa.data_fim_planejada);
      duracao_dias = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const { data, error } = await supabase
      .from('projeto_tarefas')
      .insert({
        cronograma_id: tarefa.cronograma_id,
        nome: tarefa.nome,
        descricao: tarefa.descricao,
        tipo: tarefa.tipo || 'tarefa',
        data_inicio_planejada: tarefa.data_inicio_planejada,
        data_fim_planejada: tarefa.data_fim_planejada,
        duracao_dias,
        percentual_concluido: tarefa.percentual_concluido || 0,
        status: tarefa.status || 'nao_iniciado',
        ordem_wbs: tarefa.ordem_wbs,
        indice: tarefa.indice || 1,
        nivel: tarefa.nivel || 0,
        parent_id: tarefa.parent_id,
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, tipo: data.tipo as TipoTarefa } as Tarefa;
  },

  // Atualizar tarefa
  async updateTarefa(id: string, updates: Partial<Tarefa>): Promise<Tarefa> {
    const { dependencias, ...validUpdates } = updates;

    // Recalcular duração se datas mudaram
    if (validUpdates.data_inicio_planejada && validUpdates.data_fim_planejada) {
      const start = new Date(validUpdates.data_inicio_planejada);
      const end = new Date(validUpdates.data_fim_planejada);
      (validUpdates as Record<string, unknown>).duracao_dias = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    const { data, error } = await supabase
      .from('projeto_tarefas')
      .update(validUpdates as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { ...data, tipo: data.tipo as TipoTarefa } as Tarefa;
  },

  // Excluir tarefa
  async deleteTarefa(id: string): Promise<void> {
    // Primeiro excluir dependências relacionadas
    await supabase
      .from('projeto_dependencias')
      .delete()
      .or(`tarefa_origem_id.eq.${id},tarefa_destino_id.eq.${id}`);

    const { error } = await supabase
      .from('projeto_tarefas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // === DEPENDÊNCIAS ===

  // Adicionar dependência
  async addDependencia(
    cronogramaId: string,
    origemId: string,
    destinoId: string,
    tipo: string = 'FS',
    lag: number = 0
  ): Promise<Dependencia> {
    const { data, error } = await supabase
      .from('projeto_dependencias')
      .insert({
        cronograma_id: cronogramaId,
        tarefa_origem_id: origemId,
        tarefa_destino_id: destinoId,
        tipo_vinculo: tipo,
        lag_dias: lag,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remover dependência
  async removeDependencia(id: string): Promise<void> {
    const { error } = await supabase
      .from('projeto_dependencias')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Atualizar dependência
  async updateDependencia(
    id: string,
    updates: { tipo_vinculo?: string; lag_dias?: number }
  ): Promise<Dependencia> {
    const { data, error } = await supabase
      .from('projeto_dependencias')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // === RECURSOS ===

  async getRecursosTarefa(tarefaId: string): Promise<RecursoTarefa[]> {
    const { data, error } = await supabase
      .from('projeto_recursos')
      .select(`
        *,
        funcionario:funcionarios(nome)
      `)
      .eq('tarefa_id', tarefaId);

    if (error) throw error;
    return (data || []).map((r) => ({
      ...r,
      funcionario: r.funcionario
    }));
  },

  async addRecursoTarefa(recurso: Partial<RecursoTarefa>): Promise<RecursoTarefa> {
    if (!recurso.tarefa_id) {
      throw new Error('tarefa_id é obrigatório');
    }

    const custoTotal = (recurso.quantidade_planejada || 0) * (recurso.custo_unitario || 0);

    const { data, error } = await supabase
      .from('projeto_recursos')
      .insert({
        tarefa_id: recurso.tarefa_id,
        tipo_recurso: recurso.tipo_recurso || 'humano',
        funcionario_id: recurso.funcionario_id,
        nome_recurso_externo: recurso.nome_recurso_externo,
        unidade_medida: recurso.unidade_medida || 'horas',
        quantidade_planejada: recurso.quantidade_planejada || 0,
        custo_unitario: recurso.custo_unitario || 0,
        custo_total_planejado: custoTotal,
      })
      .select(`
        *,
        funcionario:funcionarios(nome)
      `)
      .single();

    if (error) throw error;
    return data as unknown as RecursoTarefa;
  },

  async removeRecursoTarefa(id: string): Promise<void> {
    const { error } = await supabase
      .from('projeto_recursos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
