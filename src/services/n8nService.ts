// CLAUDE-NOTE: Serviço para integração com automação n8n para renderização de vídeos

interface N8NRenderRequest {
  video_id: string;
  drive_folder_id: string;
  prompt: string;
  obra_nome: string;
  total_fotos: number;
}

interface N8NRenderResponse {
  success: boolean;
  jobId: string;
  message: string;
}

interface N8NStatusResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  video_url?: string;
  error?: string;
}

class N8NService {
  private baseUrl: string;
  private webhookToken?: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_N8N_BASE_URL || 'https://n8n.example.com';
    this.webhookToken = import.meta.env.VITE_N8N_WEBHOOK_TOKEN;
  }

  /**
   * Inicia a renderização de vídeo via webhook n8n
   */
  async startVideoRender(request: N8NRenderRequest): Promise<N8NRenderResponse> {
    const webhookUrl = `${this.baseUrl}/webhook/render-video`;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.webhookToken && { 'Authorization': `Bearer ${this.webhookToken}` }),
        },
        body: JSON.stringify({
          ...request,
          timestamp: new Date().toISOString(),
          source: 'engflow-app'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro ao acionar renderização n8n:', error);
      throw new Error(`Falha na comunicação com n8n: ${error.message}`);
    }
  }

  /**
   * Consulta o status de um job de renderização
   */
  async getJobStatus(jobId: string): Promise<N8NStatusResponse> {
    const statusUrl = `${this.baseUrl}/webhook/video-status/${jobId}`;

    try {
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          ...(this.webhookToken && { 'Authorization': `Bearer ${this.webhookToken}` }),
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Erro ao consultar status n8n:', error);
      throw new Error(`Falha ao consultar status: ${error.message}`);
    }
  }

  /**
   * Polling para monitorar status de renderização
   * Retorna uma Promise que resolve quando o job é concluído
   */
  async waitForCompletion(jobId: string, onProgress?: (progress: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const pollInterval = 5000; // 5 segundos
      const maxAttempts = 720; // 1 hora máximo (720 * 5s)
      let attempts = 0;

      const poll = async () => {
        try {
          attempts++;

          if (attempts > maxAttempts) {
            reject(new Error('Timeout: Renderização excedeu tempo limite'));
            return;
          }

          const status = await this.getJobStatus(jobId);

          // Atualizar progresso se callback fornecido
          if (onProgress && status.progress !== undefined) {
            onProgress(status.progress);
          }

          switch (status.status) {
            case 'completed':
              if (status.video_url) {
                resolve(status.video_url);
              } else {
                reject(new Error('Renderização concluída mas URL do vídeo não encontrada'));
              }
              return;

            case 'error':
              reject(new Error(status.error || 'Erro na renderização'));
              return;

            case 'pending':
            case 'processing':
              // Continuar polling
              setTimeout(poll, pollInterval);
              break;

            default:
              reject(new Error(`Status desconhecido: ${status.status}`));
              return;
          }
        } catch (error) {
          console.error('Erro no polling:', error);
          setTimeout(poll, pollInterval); // Tentar novamente em caso de erro de rede
        }
      };

      // Iniciar polling
      poll();
    });
  }

  /**
   * Cancela um job de renderização
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const cancelUrl = `${this.baseUrl}/webhook/cancel-render/${jobId}`;

    try {
      const response = await fetch(cancelUrl, {
        method: 'DELETE',
        headers: {
          ...(this.webhookToken && { 'Authorization': `Bearer ${this.webhookToken}` }),
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao cancelar job:', error);
      return false;
    }
  }

  /**
   * Testa conectividade com n8n
   */
  async testConnection(): Promise<boolean> {
    const healthUrl = `${this.baseUrl}/webhook/health`;

    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          ...(this.webhookToken && { 'Authorization': `Bearer ${this.webhookToken}` }),
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao testar conexão n8n:', error);
      return false;
    }
  }
}

// Instância singleton para uso na aplicação
export const n8nService = new N8NService();

// Funções convenientes para uso direto
export const startVideoRender = (request: N8NRenderRequest): Promise<string> => {
  return n8nService.startVideoRender(request).then(response => {
    if (response.success) {
      return response.jobId;
    } else {
      throw new Error(response.message || 'Falha ao iniciar renderização');
    }
  });
};

export const pollRenderStatus = (jobId: string): Promise<N8NStatusResponse> => {
  return n8nService.getJobStatus(jobId);
};

export const waitForRenderCompletion = (
  jobId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return n8nService.waitForCompletion(jobId, onProgress);
};

export const cancelRender = (jobId: string): Promise<boolean> => {
  return n8nService.cancelJob(jobId);
};

export const testN8nConnection = (): Promise<boolean> => {
  return n8nService.testConnection();
};

// Exportar tipos para uso em outros arquivos
export type { N8NRenderRequest, N8NRenderResponse, N8NStatusResponse };