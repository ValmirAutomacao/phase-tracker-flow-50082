// Utility functions for localStorage management

export const STORAGE_KEYS = {
  CLIENTES: 'engflow_clientes',
  OBRAS: 'engflow_obras',
  FUNCIONARIOS: 'engflow_funcionarios',
  FUNCOES: 'engflow_funcoes',
  SETORES: 'engflow_setores',
  DESPESAS: 'engflow_despesas',
  REQUISICOES: 'engflow_requisicoes',
  VIDEOS: 'engflow_videos',
} as const;

// Generic localStorage functions
export const getFromStorage = <T>(key: string, defaultValue: T[] = []): T[] => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

export const addToStorage = <T extends { id: string }>(key: string, item: T): T[] => {
  const items = getFromStorage<T>(key);
  const newItems = [...items, item];
  saveToStorage(key, newItems);
  return newItems;
};

export const updateInStorage = <T extends { id: string }>(
  key: string,
  id: string,
  updates: Partial<Omit<T, 'id'>>
): T[] => {
  const items = getFromStorage<T>(key);
  const newItems = items.map(item => 
    item.id === id ? { ...item, ...updates } : item
  );
  saveToStorage(key, newItems);
  return newItems;
};

export const deleteFromStorage = <T extends { id: string }>(key: string, id: string): T[] => {
  const items = getFromStorage<T>(key);
  const newItems = items.filter(item => item.id !== id);
  saveToStorage(key, newItems);
  return newItems;
};

// Initialize default data if storage is empty
export const initializeStorage = () => {
  // Initialize Funções
  if (!localStorage.getItem(STORAGE_KEYS.FUNCOES)) {
    const defaultFuncoes = [
      { id: '1', nome: 'Engenheiro Civil', descricao: 'Responsável por projetos estruturais' },
      { id: '2', nome: 'Pedreiro', descricao: 'Execução de alvenaria e estruturas' },
      { id: '3', nome: 'Eletricista', descricao: 'Instalações elétricas' },
    ];
    saveToStorage(STORAGE_KEYS.FUNCOES, defaultFuncoes);
  }

  // Initialize Setores
  if (!localStorage.getItem(STORAGE_KEYS.SETORES)) {
    const defaultSetores = [
      { id: '1', nome: 'Administrativo', descricao: 'Setor administrativo' },
      { id: '2', nome: 'Operacional', descricao: 'Setor de operações' },
      { id: '3', nome: 'Financeiro', descricao: 'Setor financeiro' },
    ];
    saveToStorage(STORAGE_KEYS.SETORES, defaultSetores);
  }
};
