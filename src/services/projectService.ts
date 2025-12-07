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
  // Join fields
  funcionario?: {
    nome: string;
  };
}

// Serviços
export const projectService = {
  // Buscar ou criar cronograma padrão
  async getOrCreateCronograma(obraId: string): Promise<Cronograma> {
    // 1. Tentar buscar cronograma ativo
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

    // 2. Se não existir, criar um padrão
    const { data: novoCronograma, error: createError } = await supabase
      .from('projeto_cronogramas')
      .insert({
        obra_id: obraId,
        nome: 'Cronograma Principal',
        ativo: true,
        data_base_inicial: new Date().toISOString().split('T')[0] // Hoje
      })
      .select()
      .single();

    if (createError) throw createError;
    return novoCronograma;
  },

  // Listar todas as tarefas de um cronograma
  async getTarefas(cronogramaId: string): Promise<Tarefa[]> {
    // Buscar tarefas e suas dependências
    // Nota: Supabase JOINs podem ser complexos, vamos buscar tarefas primeiro
    // e dependências em uma segunda query se necessário, ou usar select nested.
    
    const { data: tarefas, error } = await supabase
      .from('projeto_tarefas')
      .select(`
        *,
        dependencias:projeto_dependencias!tarefa_destino_id(tarefa_origem_id, tipo_vinculo, lag_dias)
      `)
      .eq('cronograma_id', cronogramaId)
      .order('indice', { ascending: true });

    if (error) throw error;
    
    // Mapear para formato mais limpo
    return tarefas.map((t: any) => ({
      ...t,
      dependencias: t.dependencias?.map((d: any) => d.tarefa_origem_id) || []
    }));
  },

  // Criar nova tarefa
  async createTarefa(tarefa: Partial<Tarefa>): Promise<Tarefa> {
    // Garantir campos obrigatórios
    if (!tarefa.cronograma_id || !tarefa.nome) {
      throw new Error('cronograma_id e nome são obrigatórios');
    }
    
    const { data, error } = await supabase
      .from('projeto_tarefas')
      .insert({
        cronograma_id: tarefa.cronograma_id,
        nome: tarefa.nome,
        descricao: tarefa.descricao,
        tipo: tarefa.tipo,
        data_inicio_planejada: tarefa.data_inicio_planejada,
        data_fim_planejada: tarefa.data_fim_planejada,
        duracao_dias: tarefa.duracao_dias,
        percentual_concluido: tarefa.percentual_concluido,
        status: tarefa.status,
        ordem_wbs: tarefa.ordem_wbs,
        indice: tarefa.indice,
        nivel: tarefa.nivel,
        parent_id: tarefa.parent_id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Tarefa;
  },

  // Atualizar tarefa
  async updateTarefa(id: string, updates: Partial<Tarefa>): Promise<Tarefa> {
    // Remover campos calculados ou não persistíveis se houver
    const { dependencias, ...validUpdates } = updates;

    const { data, error } = await supabase
      .from('projeto_tarefas')
      .update(validUpdates as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Tarefa;
  },

  // Excluir tarefa
  async deleteTarefa(id: string): Promise<void> {
    const { error } = await supabase
      .from('projeto_tarefas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // === RECURSOS ===

  // Listar recursos de uma tarefa
  async getRecursosTarefa(tarefaId: string): Promise<RecursoTarefa[]> {
    const { data, error } = await supabase
      .from('projeto_recursos')
      .select(`
        *,
        funcionario:funcionarios(nome)
      `)
      .eq('tarefa_id', tarefaId);

    if (error) throw error;
    
    // Mapear para simplificar acesso ao nome do funcionário
    return data.map((r: any) => ({
      ...r,
      funcionario: r.funcionario
    }));
  },

  // Adicionar recurso a uma tarefa
  async addRecursoTarefa(recurso: Partial<RecursoTarefa>): Promise<RecursoTarefa> {
    if (!recurso.tarefa_id) {
      throw new Error('tarefa_id é obrigatório');
    }
    
    const { data, error } = await supabase
      .from('projeto_recursos')
      .insert({
        tarefa_id: recurso.tarefa_id,
        tipo_recurso: recurso.tipo_recurso,
        funcionario_id: recurso.funcionario_id,
        nome_recurso_externo: recurso.nome_recurso_externo,
        unidade_medida: recurso.unidade_medida,
        quantidade_planejada: recurso.quantidade_planejada,
        custo_unitario: recurso.custo_unitario,
        custo_total_planejado: recurso.custo_total_planejado,
      })
      .select(`
        *,
        funcionario:funcionarios(nome)
      `)
      .single();

    if (error) throw error;
    return data as unknown as RecursoTarefa;
  },

  // Remover recurso de uma tarefa
  async removeRecursoTarefa(id: string): Promise<void> {
    const { error } = await supabase
      .from('projeto_recursos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Adicionar dependência
  async addDependencia(origemId: string, destinoId: string, tipo = 'FS') {
    const { error } = await supabase
      .from('projeto_dependencias')
      .insert({
        tarefa_origem_id: origemId,
        tarefa_destino_id: destinoId,
        tipo_vinculo: tipo,
        cronograma_id: (await this.getTarefaCronogramaId(origemId)) // Helper needed? 
        // Simplificação: assumimos que o caller sabe o cronograma ou buscamos.
        // Mas o SQL requer cronograma_id na tabela de dependencias? Sim.
        // Vamos buscar o cronograma_id da tarefa origem.
      });
      
    // Precisamos do cronograma_id. Para evitar round-trip, vamos assumir que
    // o frontend passa ou a gente busca. Vou ajustar para receber cronograma_id opcional
    // ou buscar. Por performance, melhor passar.
    // ... Ajuste no hook para passar cronograma_id
    
    if (error) throw error;
  },

  // Helper interno
  async getTarefaCronogramaId(tarefaId: string): Promise<string> {
    const { data, error } = await supabase
      .from('projeto_tarefas')
      .select('cronograma_id')
      .eq('id', tarefaId)
      .single();
    if (error || !data) throw new Error("Tarefa não encontrada");
    return data.cronograma_id;
  }
};
