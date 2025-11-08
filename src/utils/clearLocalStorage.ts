/**
 * Função para limpar completamente o localStorage
 * e garantir que apenas o Supabase seja usado
 */

export function clearAllLocalStorage(): void {
  // Lista de chaves conhecidas do localStorage
  const engflowKeys = [
    'engflow_clientes',
    'engflow_obras',
    'engflow_funcionarios',
    'engflow_funcoes',
    'engflow_setores',
    'engflow_despesas',
    'engflow_videos',
    'engflow_requisicoes',
    'engflow_categorias',
    'engflow_itens_requisicao'
  ];

  console.log('🧹 Limpando localStorage completamente...');

  // Remove chaves específicas do EngFlow
  engflowKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`❌ Removendo localStorage: ${key}`);
      localStorage.removeItem(key);
    }
  });

  // Remove todas as outras chaves que começam com 'engflow_'
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.startsWith('engflow_')) {
      console.log(`❌ Removendo localStorage extra: ${key}`);
      localStorage.removeItem(key);
    }
  });

  console.log('✅ localStorage limpo! Agora usando apenas Supabase.');
}

// Função para monitorar uso indevido do localStorage
export function monitorLocalStorageUsage(): void {
  const originalSetItem = localStorage.setItem;
  const originalGetItem = localStorage.getItem;

  localStorage.setItem = function(key: string, value: string) {
    if (key.startsWith('engflow_')) {
      console.warn('🚨 AVISO: Tentativa de uso do localStorage detectada!', {
        key,
        value,
        stack: new Error().stack
      });
    }
    return originalSetItem.call(this, key, value);
  };

  localStorage.getItem = function(key: string) {
    if (key.startsWith('engflow_')) {
      console.warn('🚨 AVISO: Leitura do localStorage detectada!', {
        key,
        stack: new Error().stack
      });
    }
    return originalGetItem.call(this, key);
  };
}