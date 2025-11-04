/**
 * Script de Backup localStorage → Arquivo
 * Story: 1.11 - Migrar dados localStorage
 * Author: James (Dev Agent)
 *
 * Cria backup completo e seguro dos dados localStorage antes da migração
 */

import { STORAGE_KEYS } from '../localStorage';

interface BackupMetadata {
  timestamp: string;
  version: string;
  userAgent: string;
  totalRecords: number;
  storageSize: number;
  dataIntegrity: {
    clientes: number;
    obras: number;
    funcionarios: number;
    funcoes: number;
    setores: number;
    despesas: number;
    videos: number;
    requisicoes: number;
  };
}

interface BackupData {
  metadata: BackupMetadata;
  data: {
    [K in keyof typeof STORAGE_KEYS]: any[];
  };
  checksums: {
    [K in keyof typeof STORAGE_KEYS]: string;
  };
}

/**
 * Calcula checksum MD5 simples para validação de integridade
 */
function calculateChecksum(data: string): string {
  let hash = 0;
  if (data.length === 0) return hash.toString();

  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16);
}

/**
 * Obtém dados de uma chave específica do localStorage
 */
function getStorageData(key: string): any[] {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error(`Erro ao ler ${key} do localStorage:`, error);
    return [];
  }
}

/**
 * Calcula tamanho estimado do localStorage em bytes
 */
function calculateStorageSize(): number {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += key.length + (localStorage[key]?.length || 0);
    }
  }
  return total;
}

/**
 * Gera backup completo dos dados localStorage
 */
export function createBackup(): BackupData {
  console.log('🔄 Iniciando backup localStorage...');

  const timestamp = new Date().toISOString();

  // Obter dados de todas as entidades
  const data: BackupData['data'] = {
    CLIENTES: getStorageData(STORAGE_KEYS.CLIENTES),
    OBRAS: getStorageData(STORAGE_KEYS.OBRAS),
    FUNCIONARIOS: getStorageData(STORAGE_KEYS.FUNCIONARIOS),
    FUNCOES: getStorageData(STORAGE_KEYS.FUNCOES),
    SETORES: getStorageData(STORAGE_KEYS.SETORES),
    DESPESAS: getStorageData(STORAGE_KEYS.DESPESAS),
    VIDEOS: getStorageData(STORAGE_KEYS.VIDEOS),
    REQUISICOES: getStorageData(STORAGE_KEYS.REQUISICOES),
  };

  // Calcular checksums para validação de integridade
  const checksums: BackupData['checksums'] = {
    CLIENTES: calculateChecksum(JSON.stringify(data.CLIENTES)),
    OBRAS: calculateChecksum(JSON.stringify(data.OBRAS)),
    FUNCIONARIOS: calculateChecksum(JSON.stringify(data.FUNCIONARIOS)),
    FUNCOES: calculateChecksum(JSON.stringify(data.FUNCOES)),
    SETORES: calculateChecksum(JSON.stringify(data.SETORES)),
    DESPESAS: calculateChecksum(JSON.stringify(data.DESPESAS)),
    VIDEOS: calculateChecksum(JSON.stringify(data.VIDEOS)),
    REQUISICOES: calculateChecksum(JSON.stringify(data.REQUISICOES)),
  };

  // Contar registros totais
  const totalRecords = Object.values(data).reduce((total, items) => total + items.length, 0);

  // Metadata do backup
  const metadata: BackupMetadata = {
    timestamp,
    version: '1.0.0',
    userAgent: navigator.userAgent,
    totalRecords,
    storageSize: calculateStorageSize(),
    dataIntegrity: {
      clientes: data.CLIENTES.length,
      obras: data.OBRAS.length,
      funcionarios: data.FUNCIONARIOS.length,
      funcoes: data.FUNCOES.length,
      setores: data.SETORES.length,
      despesas: data.DESPESAS.length,
      videos: data.VIDEOS.length,
      requisicoes: data.REQUISICOES.length,
    }
  };

  const backup: BackupData = {
    metadata,
    data,
    checksums
  };

  console.log('✅ Backup criado com sucesso:', {
    timestamp,
    totalRecords,
    size: `${Math.round(calculateStorageSize() / 1024)} KB`
  });

  return backup;
}

/**
 * Salva backup em arquivo JSON para download
 */
export function downloadBackup(backup: BackupData): void {
  try {
    const backupJson = JSON.stringify(backup, null, 2);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const timestamp = backup.metadata.timestamp.replace(/[:.]/g, '-');
    const filename = `engflow-backup-${timestamp}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    console.log('📁 Backup salvo como:', filename);
  } catch (error) {
    console.error('❌ Erro ao salvar backup:', error);
    throw new Error('Falha ao criar arquivo de backup');
  }
}

/**
 * Valida integridade de um backup
 */
export function validateBackup(backup: BackupData): boolean {
  try {
    // Verificar estrutura básica
    if (!backup.metadata || !backup.data || !backup.checksums) {
      console.error('❌ Estrutura de backup inválida');
      return false;
    }

    // Validar checksums
    for (const [key, data] of Object.entries(backup.data)) {
      const expectedChecksum = backup.checksums[key as keyof typeof backup.checksums];
      const actualChecksum = calculateChecksum(JSON.stringify(data));

      if (expectedChecksum !== actualChecksum) {
        console.error(`❌ Checksum inválido para ${key}. Esperado: ${expectedChecksum}, Atual: ${actualChecksum}`);
        return false;
      }
    }

    // Verificar contadores
    const actualTotal = Object.values(backup.data).reduce((total, items) => total + items.length, 0);
    if (actualTotal !== backup.metadata.totalRecords) {
      console.error(`❌ Total de registros não confere. Esperado: ${backup.metadata.totalRecords}, Atual: ${actualTotal}`);
      return false;
    }

    console.log('✅ Backup validado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro na validação do backup:', error);
    return false;
  }
}

/**
 * Cria e faz download do backup automaticamente
 */
export function executeBackup(): BackupData {
  const backup = createBackup();

  if (!validateBackup(backup)) {
    throw new Error('Backup inválido - operação cancelada');
  }

  downloadBackup(backup);

  // Também salvar no localStorage como fallback
  localStorage.setItem('engflow_backup_latest', JSON.stringify(backup));

  return backup;
}

/**
 * Restaura dados do backup para o localStorage
 */
export function restoreFromBackup(backup: BackupData): boolean {
  try {
    console.log('🔄 Iniciando restauração do backup...');

    if (!validateBackup(backup)) {
      throw new Error('Backup inválido');
    }

    // Restaurar cada entidade
    for (const [key, data] of Object.entries(backup.data)) {
      const storageKey = STORAGE_KEYS[key as keyof typeof STORAGE_KEYS];
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log(`✅ Restaurado ${key}: ${data.length} registros`);
    }

    console.log('✅ Restauração concluída com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro na restauração:', error);
    return false;
  }
}

export type { BackupData, BackupMetadata };