// Script para limpar cache no console do navegador
// Abra o console (F12) na página de funcionários e execute:

// 1. Limpar localStorage
localStorage.clear();

// 2. Limpar React Query cache
if (window.queryClient) {
  window.queryClient.clear();
}

// 3. Forçar recarregamento
location.reload();

// Ou apenas invalidar funcionários:
// window.queryClient?.invalidateQueries({ queryKey: ['supabase', 'engflow_funcionarios'] });