import { STORAGE_KEYS } from '../localStorage';

export interface BackupMetadata {
  timestamp: string;
  version: string;
  totalRecords: number;
  entities: {
    [key: string]: number;
  };
  checksum: string;
}

export interface LocalStorageBackup {
  metadata: BackupMetadata;
  data: {
    [key: string]: any[];
  };
}

/**
 * Cria backup completo do localStorage com metadados e checksums
 */
export class BackupService {
  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Exporta todo o localStorage para um backup estruturado
   */
  exportLocalStorage(): LocalStorageBackup {
    const data: { [key: string]: any[] } = {};
    let totalRecords = 0;
    const entities: { [key: string]: number } = {};

    // Exportar todas as entidades conhecidas
    Object.entries(STORAGE_KEYS).forEach(([entityName, storageKey]) => {
      try {
        const item = localStorage.getItem(storageKey);
        const parsedData = item ? JSON.parse(item) : [];
        data[storageKey] = parsedData;
        entities[entityName] = parsedData.length;
        totalRecords += parsedData.length;
      } catch (error) {
        console.error(`Erro ao exportar ${storageKey}:`, error);
        data[storageKey] = [];
        entities[entityName] = 0;
      }
    });

    // Criar metadata do backup
    const timestamp = new Date().toISOString();
    const dataString = JSON.stringify(data);
    const checksum = this.generateChecksum(dataString);

    const metadata: BackupMetadata = {
      timestamp,
      version: '1.0',
      totalRecords,
      entities,
      checksum
    };

    return {
      metadata,
      data
    };
  }

  /**
   * Salva backup como arquivo JSON comprimido
   */
  saveBackupToFile(backup: LocalStorageBackup, filename?: string): void {
    const fileName = filename || `engflow_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    const dataStr = JSON.stringify(backup, null, 2);

    // Criar e baixar arquivo
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    console.log(`✅ Backup salvo: ${fileName}`);
    console.log(`📊 Total de registros: ${backup.metadata.totalRecords}`);
    console.log(`🔍 Checksum: ${backup.metadata.checksum}`);
  }

  /**
   * Valida integridade do backup
   */
  validateBackup(backup: LocalStorageBackup): boolean {
    try {
      const dataString = JSON.stringify(backup.data);
      const calculatedChecksum = this.generateChecksum(dataString);

      if (calculatedChecksum !== backup.metadata.checksum) {
        console.error('❌ Checksum do backup não confere!');
        return false;
      }

      // Validar estrutura básica
      const requiredKeys = Object.values(STORAGE_KEYS);
      const missingKeys = requiredKeys.filter(key => !(key in backup.data));

      if (missingKeys.length > 0) {
        console.error('❌ Chaves obrigatórias ausentes no backup:', missingKeys);
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
   * Restaura localStorage a partir de backup
   */
  restoreFromBackup(backup: LocalStorageBackup): boolean {
    try {
      if (!this.validateBackup(backup)) {
        throw new Error('Backup inválido');
      }

      // Restaurar dados
      Object.entries(backup.data).forEach(([storageKey, data]) => {
        localStorage.setItem(storageKey, JSON.stringify(data));
      });

      console.log('✅ Backup restaurado com sucesso');
      console.log(`📊 Registros restaurados: ${backup.metadata.totalRecords}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error);
      return false;
    }
  }

  /**
   * Cria backup completo e salva arquivo
   */
  createFullBackup(): LocalStorageBackup {
    console.log('🔄 Iniciando backup do localStorage...');

    const backup = this.exportLocalStorage();
    this.saveBackupToFile(backup);

    return backup;
  }

  /**
   * Carrega backup de arquivo
   */
  async loadBackupFromFile(file: File): Promise<LocalStorageBackup> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string);

          if (!this.validateBackup(backup)) {
            reject(new Error('Arquivo de backup inválido'));
            return;
          }

          resolve(backup);
        } catch (error) {
          reject(new Error('Erro ao parse do arquivo de backup'));
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }
}

// Instância singleton
export const backupService = new BackupService();