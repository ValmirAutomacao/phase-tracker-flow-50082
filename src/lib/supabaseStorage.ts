import { supabase } from './supabaseClient';

export interface UploadResult {
  url: string;
  fileName: string;
  fullPath: string;
}

export class SupabaseStorage {
  /**
   * Faz upload de um arquivo para o Supabase Storage
   */
  static async uploadFile(
    bucket: string,
    file: File,
    folder?: string
  ): Promise<UploadResult> {
    try {
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;

      // Definir caminho do arquivo (com pasta se especificada)
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Fazer upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        throw new Error(`Erro no upload: ${error.message}`);
      }

      if (!data) {
        throw new Error('Nenhum dado retornado do upload');
      }

      // Obter URL público do arquivo
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        url: publicUrlData.publicUrl,
        fileName: fileName,
        fullPath: data.path
      };

    } catch (error) {
      console.error('Erro no uploadFile:', error);
      throw error;
    }
  }

  /**
   * Remove um arquivo do Supabase Storage
   */
  static async deleteFile(bucket: string, filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        console.error('Erro ao deletar arquivo:', error);
        throw new Error(`Erro ao deletar: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro no deleteFile:', error);
      throw error;
    }
  }

  /**
   * Upload específico para comprovantes de despesas
   */
  static async uploadComprovante(file: File): Promise<UploadResult> {
    return this.uploadFile('comprovantes', file, 'despesas');
  }

  /**
   * Upload específico para fotos de funcionários
   */
  static async uploadFotoFuncionario(file: File): Promise<UploadResult> {
    return this.uploadFile('funcionarios', file, 'fotos');
  }

  /**
   * Valida se o arquivo é do tipo permitido
   */
  static validateFile(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * Valida tamanho do arquivo (em bytes)
   */
  static validateFileSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize;
  }
}

// Constantes para validação
export const COMPROVANTE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf'
];

export const FOTO_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png'
];

export const MAX_COMPROVANTE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FOTO_SIZE = 5 * 1024 * 1024; // 5MB