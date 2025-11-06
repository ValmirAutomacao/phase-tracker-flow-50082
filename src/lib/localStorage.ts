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

// Clear all mock data from localStorage (keeping only Supabase data)
export const clearAllMockData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  console.log('✅ Todos os dados mockados foram removidos do localStorage');
};
