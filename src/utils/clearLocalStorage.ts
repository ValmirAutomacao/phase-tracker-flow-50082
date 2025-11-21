/**
 * Função para limpar completamente o localStorage
 * e garantir que apenas o Supabase seja usado
 */

export function clearAllLocalStorage(): void {
  // Lista de chaves conhecidas do localStorage que devem ser removidas
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

  // Lista de chaves que NÃO devem ser removidas (whitelist)
  const preserveKeys = [
    'google_drive_token', // CRÍTICO: Preservar token do Google Drive
    'sb-',                // Preservar tokens do Supabase (começam com sb-)
    '_supabase_',         // Preservar dados do Supabase
    'supabase.'           // Preservar configurações do Supabase
  ];

  console.log('🧹 Limpando localStorage (preservando tokens importantes)...');

  // Remove chaves específicas do EngFlow
  engflowKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`❌ Removendo localStorage: ${key}`);
      localStorage.removeItem(key);
    }
  });

  // Remove todas as outras chaves que começam com 'engflow_' mas preserva chaves importantes
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.startsWith('engflow_')) {
      // Verificar se não é uma chave a ser preservada
      const shouldPreserve = preserveKeys.some(preserveKey =>
        key.startsWith(preserveKey) || key.includes(preserveKey)
      );

      if (!shouldPreserve) {
        console.log(`❌ Removendo localStorage extra: ${key}`);
        localStorage.removeItem(key);
      } else {
        console.log(`✅ Preservando chave importante: ${key}`);
      }
    }
  });

  console.log('✅ localStorage limpo (preservando tokens)! Agora usando Supabase + Google Drive.');
}

// Função para monitorar uso indevido do localStorage
export function monitorLocalStorageUsage(): void {
  const originalSetItem = localStorage.setItem;
  const originalGetItem = localStorage.getItem;

  localStorage.setItem = function(key: string, value: string) {
    if (key.startsWith('engflow_')) {
      // Verificar se não é uma chave permitida
      const allowedKeys = ['google_drive_token', 'sb-', '_supabase_', 'supabase.'];
      const isAllowed = allowedKeys.some(allowedKey =>
        key.startsWith(allowedKey) || key.includes(allowedKey)
      );

      if (!isAllowed) {
        console.warn('🚨 AVISO: Tentativa de uso do localStorage detectada!', {
          key,
          value,
          stack: new Error().stack
        });
      }
    }
    return originalSetItem.call(this, key, value);
  };

  localStorage.getItem = function(key: string) {
    if (key.startsWith('engflow_')) {
      // Verificar se não é uma chave permitida
      const allowedKeys = ['google_drive_token', 'sb-', '_supabase_', 'supabase.'];
      const isAllowed = allowedKeys.some(allowedKey =>
        key.startsWith(allowedKey) || key.includes(allowedKey)
      );

      if (!isAllowed) {
        console.warn('🚨 AVISO: Leitura do localStorage detectada!', {
          key,
          stack: new Error().stack
        });
      }
    }
    return originalGetItem.call(this, key);
  };
}