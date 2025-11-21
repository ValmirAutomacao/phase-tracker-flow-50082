import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabaseClient';

/**
 * Service para autenticação de ponto
 */

export const verificarSenhaPonto = async (funcionarioId: string, senha: string): Promise<boolean> => {
  try {
    // Buscar dados do funcionário incluindo CPF
    const { data: funcionario, error } = await supabase
      .from('funcionarios')
      .select('senha_ponto, cpf')
      .eq('id', funcionarioId)
      .single();

    if (error || !funcionario) {
      console.error('Erro ao buscar funcionário:', error);
      return false;
    }

    // Se não tem senha definida, usar senha padrão baseada no CPF
    if (!funcionario.senha_ponto) {
      console.log('Funcionário sem senha definida, usando senha padrão');
      const senhaPadrao = gerarSenhaPadrao(funcionario.cpf);

      // Verificar se a senha digitada bate com a padrão
      if (senha === senhaPadrao) {
        // Definir a senha hash no banco para próximas vezes
        await definirSenhaPonto(funcionarioId, senhaPadrao);
        console.log('Senha padrão aceita e hash criado');
        return true;
      } else {
        console.log(`Senha digitada: "${senha}", Senha esperada: "${senhaPadrao}"`);
        return false;
      }
    }

    // Verificar senha com hash
    const isValid = await bcrypt.compare(senha, funcionario.senha_ponto);
    console.log('Verificação de senha hash:', isValid);
    return isValid;

  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return false;
  }
};

export const definirSenhaPonto = async (funcionarioId: string, novaSenha: string): Promise<boolean> => {
  try {
    // Gerar hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(novaSenha, saltRounds);

    // Atualizar no banco
    const { error } = await supabase
      .from('funcionarios')
      .update({ senha_ponto: hashedPassword })
      .eq('id', funcionarioId);

    if (error) {
      console.error('Erro ao definir senha:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Erro ao gerar hash da senha:', error);
    return false;
  }
};

export const gerarSenhaPadrao = (cpf?: string): string => {
  if (!cpf) {
    console.log('Sem CPF cadastrado, usando senha padrão: 1234');
    return '1234';
  }

  // Usar os 4 últimos dígitos do CPF (apenas números)
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length >= 4) {
    const senha = numeros.slice(-4);
    console.log(`Senha padrão baseada no CPF: ${senha}`);
    return senha;
  }

  console.log('CPF inválido, usando senha padrão: 1234');
  return '1234';
};

/**
 * Função para inicializar senhas padrão para funcionários que não têm
 */
export const inicializarSenhasPadrao = async (): Promise<void> => {
  try {
    // Buscar funcionários sem senha definida
    const { data: funcionarios, error } = await supabase
      .from('funcionarios')
      .select('id, cpf, senha_ponto')
      .is('senha_ponto', null)
      .eq('ativo', true);

    if (error) {
      console.error('Erro ao buscar funcionários:', error);
      return;
    }

    // Definir senha padrão para cada funcionário
    for (const funcionario of funcionarios || []) {
      const senhaPadrao = gerarSenhaPadrao(funcionario.cpf);
      await definirSenhaPonto(funcionario.id, senhaPadrao);
      console.log(`Senha padrão definida para funcionário ${funcionario.id}: ${senhaPadrao}`);
    }

  } catch (error) {
    console.error('Erro ao inicializar senhas padrão:', error);
  }
};