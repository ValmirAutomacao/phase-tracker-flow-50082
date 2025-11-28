import { supabase } from '@/lib/supabaseClient';
import type { RelatorioBi } from '@/types/bi';

/**
 * Serviço para gerenciamento de relatórios salvos
 */
export class ReportService {

  /**
   * Busca todos os relatórios do usuário atual
   */
  async buscarRelatoriosUsuario(): Promise<RelatorioBi[]> {
    try {
      const { data, error } = await supabase
        .from('relatorios_bi')
        .select('*')
        .eq('ativo', true)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar relatórios: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      throw error;
    }
  }

  /**
   * Busca um relatório específico por ID
   */
  async buscarRelatorioPorId(id: string): Promise<RelatorioBi | null> {
    try {
      const { data, error } = await supabase
        .from('relatorios_bi')
        .select('*')
        .eq('id', id)
        .eq('ativo', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Registro não encontrado
          return null;
        }
        throw new Error(`Erro ao buscar relatório: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar relatório por ID:', error);
      throw error;
    }
  }

  /**
   * Cria um novo relatório
   */
  async criarRelatorio(
    relatorio: Omit<RelatorioBi, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>
  ): Promise<RelatorioBi> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuário não autenticado');
      }

      const novoRelatorio = {
        ...relatorio,
        usuario_id: user.user.id
      };

      const { data, error } = await supabase
        .from('relatorios_bi')
        .insert(novoRelatorio)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar relatório: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      throw error;
    }
  }

  /**
   * Atualiza um relatório existente
   */
  async atualizarRelatorio(
    id: string,
    updates: Partial<Omit<RelatorioBi, 'id' | 'usuario_id' | 'created_at'>>
  ): Promise<RelatorioBi> {
    try {
      const dadosAtualizacao = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('relatorios_bi')
        .update(dadosAtualizacao)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar relatório: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar relatório:', error);
      throw error;
    }
  }

  /**
   * Exclui um relatório (soft delete)
   */
  async excluirRelatorio(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('relatorios_bi')
        .update({ ativo: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao excluir relatório: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro ao excluir relatório:', error);
      throw error;
    }
  }

  /**
   * Duplica um relatório existente
   */
  async duplicarRelatorio(id: string, novoNome?: string): Promise<RelatorioBi> {
    try {
      const relatorioOriginal = await this.buscarRelatorioPorId(id);
      if (!relatorioOriginal) {
        throw new Error('Relatório original não encontrado');
      }

      const relatorioDuplicado = {
        nome: novoNome || `${relatorioOriginal.nome} (Cópia)`,
        descricao: relatorioOriginal.descricao,
        setor: relatorioOriginal.setor,
        campos_selecionados: relatorioOriginal.campos_selecionados,
        filtros_padrao: relatorioOriginal.filtros_padrao,
        configuracoes: relatorioOriginal.configuracoes,
        ativo: true
      };

      return await this.criarRelatorio(relatorioDuplicado);
    } catch (error) {
      console.error('Erro ao duplicar relatório:', error);
      throw error;
    }
  }

  /**
   * Busca relatórios por setor
   */
  async buscarRelatoriosPorSetor(setor: string): Promise<RelatorioBi[]> {
    try {
      const { data, error } = await supabase
        .from('relatorios_bi')
        .select('*')
        .eq('setor', setor)
        .eq('ativo', true)
        .order('nome');

      if (error) {
        throw new Error(`Erro ao buscar relatórios por setor: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar relatórios por setor:', error);
      throw error;
    }
  }

  /**
   * Busca relatórios com filtro de texto
   */
  async buscarRelatoriosPorTexto(texto: string): Promise<RelatorioBi[]> {
    try {
      const { data, error } = await supabase
        .from('relatorios_bi')
        .select('*')
        .or(`nome.ilike.%${texto}%, descricao.ilike.%${texto}%`)
        .eq('ativo', true)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar relatórios por texto: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar relatórios por texto:', error);
      throw error;
    }
  }

  /**
   * Atualiza apenas os filtros padrão de um relatório
   */
  async atualizarFiltrosPadrao(id: string, filtrosPadrao: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('relatorios_bi')
        .update({
          filtros_padrao: filtrosPadrao,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao atualizar filtros padrão: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar filtros padrão:', error);
      throw error;
    }
  }

  /**
   * Atualiza apenas as configurações de um relatório
   */
  async atualizarConfiguracoes(id: string, configuracoes: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('relatorios_bi')
        .update({
          configuracoes: configuracoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao atualizar configurações: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  }

  /**
   * Valida se um nome de relatório já existe para o usuário
   */
  async validarNomeRelatorio(nome: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('relatorios_bi')
        .select('id')
        .eq('nome', nome)
        .eq('ativo', true);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao validar nome: ${error.message}`);
      }

      return (data?.length || 0) === 0;
    } catch (error) {
      console.error('Erro ao validar nome do relatório:', error);
      return false;
    }
  }

  /**
   * Busca estatísticas dos relatórios do usuário
   */
  async buscarEstatisticas(): Promise<{
    total: number;
    ativos: number;
    porSetor: Record<string, number>;
    ultimaAtualizacao: string | null;
  }> {
    try {
      const relatorios = await this.buscarRelatoriosUsuario();

      const estatisticas = {
        total: relatorios.length,
        ativos: relatorios.filter(r => r.ativo).length,
        porSetor: {} as Record<string, number>,
        ultimaAtualizacao: null as string | null
      };

      // Contar por setor
      relatorios.forEach(relatorio => {
        estatisticas.porSetor[relatorio.setor] = (estatisticas.porSetor[relatorio.setor] || 0) + 1;
      });

      // Encontrar última atualização
      if (relatorios.length > 0) {
        const maisRecente = relatorios.reduce((latest, current) =>
          new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest
        );
        estatisticas.ultimaAtualizacao = maisRecente.updated_at;
      }

      return estatisticas;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        total: 0,
        ativos: 0,
        porSetor: {},
        ultimaAtualizacao: null
      };
    }
  }

  /**
   * Exporta definições de relatórios para backup
   */
  async exportarDefinicoes(): Promise<RelatorioBi[]> {
    try {
      const relatorios = await this.buscarRelatoriosUsuario();

      // Remover IDs do usuário para privacidade
      return relatorios.map(relatorio => ({
        ...relatorio,
        usuario_id: 'exported'
      }));
    } catch (error) {
      console.error('Erro ao exportar definições:', error);
      throw error;
    }
  }

  /**
   * Importa definições de relatórios de backup
   */
  async importarDefinicoes(definicoes: Partial<RelatorioBi>[]): Promise<number> {
    let importados = 0;

    try {
      for (const definicao of definicoes) {
        // Validar estrutura mínima
        if (!definicao.nome || !definicao.campos_selecionados) {
          continue;
        }

        // Verificar se já existe
        const nomeUnico = await this.validarNomeRelatorio(definicao.nome);
        const nomeRelatorio = nomeUnico ? definicao.nome : `${definicao.nome} (Importado)`;

        const novoRelatorio = {
          nome: nomeRelatorio,
          descricao: definicao.descricao || '',
          setor: definicao.setor || 'financeiro',
          campos_selecionados: definicao.campos_selecionados,
          filtros_padrao: definicao.filtros_padrao || { periodo_obrigatorio: true },
          configuracoes: definicao.configuracoes || {},
          ativo: true
        };

        await this.criarRelatorio(novoRelatorio);
        importados++;
      }

      return importados;
    } catch (error) {
      console.error('Erro ao importar definições:', error);
      throw error;
    }
  }
}

// Instância singleton do serviço
export const reportService = new ReportService();