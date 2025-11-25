import type {
  N8NRenderRequest,
  N8NRenderResponse,
  RenderError,
  RenderErrorDetails
} from '@/types/renderedVideo';

// URL do webhook N8N
const N8N_WEBHOOK_URL = 'https://secengenharia-n8n.j8jnyd.easypanel.host/webhook/processar-video';

// Timeout para renderização (5 minutos)
const RENDER_TIMEOUT = 5 * 60 * 1000; // 300000ms

/**
 * Gera um videoId único baseado no nome do projeto e timestamp
 */
export function generateVideoId(projectName: string): string {
  const timestamp = Date.now();
  const slug = projectName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífen
    .replace(/--+/g, '-') // Remove hífens duplos
    .trim()
    .substring(0, 50); // Limita tamanho

  return `${slug}-${timestamp}`;
}

/**
 * Valida parâmetros antes de enviar para N8N
 */
export function validateRenderParams(projectName: string, folderId: string): RenderErrorDetails | null {
  // Validar nome do projeto
  if (!projectName || projectName.trim().length === 0) {
    return {
      type: 'VALIDATION_ERROR',
      message: 'Nome do projeto é obrigatório'
    };
  }

  // Validar folderId (deve ter ~33 caracteres alfanuméricos)
  if (!folderId || folderId.trim().length === 0) {
    return {
      type: 'VALIDATION_ERROR',
      message: 'ID da pasta do Google Drive é obrigatório'
    };
  }

  if (!/^[a-zA-Z0-9_-]{25,40}$/.test(folderId.trim())) {
    return {
      type: 'VALIDATION_ERROR',
      message: 'ID da pasta do Google Drive tem formato inválido'
    };
  }

  return null;
}

/**
 * Determina o tipo de erro baseado na resposta
 */
function categorizeError(error: any): RenderError {
  if (error.name === 'AbortError') {
    return 'TIMEOUT_ERROR';
  }

  if (error.status) {
    if (error.status >= 400 && error.status < 500) {
      return 'N8N_ERROR';
    }
    if (error.status >= 500) {
      return 'N8N_ERROR';
    }
  }

  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return 'NETWORK_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Chama o webhook N8N para processar vídeo
 */
export async function callN8NRenderWebhook(
  projectName: string,
  folderId: string,
  onProgress?: (progress: number) => void
): Promise<N8NRenderResponse> {
  console.log('🎬 Iniciando renderização N8N:', { projectName, folderId });

  // Validar parâmetros
  const validationError = validateRenderParams(projectName, folderId);
  if (validationError) {
    throw validationError;
  }

  // Gerar videoId único
  const videoId = generateVideoId(projectName);
  console.log('📝 VideoId gerado:', videoId);

  // Preparar payload
  const payload: N8NRenderRequest = {
    videoId,
    folderId: folderId.trim()
  };

  // Controller para timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('⏰ Timeout de renderização atingido');
    controller.abort();
  }, RENDER_TIMEOUT);

  try {
    // Simular progresso durante chamada
    const progressInterval = setInterval(() => {
      if (onProgress) {
        // Progresso estimado baseado em tempo (0-80% nos primeiros 2.5min)
        const elapsed = Date.now() - Date.now();
        const progress = Math.min(80, (elapsed / (2.5 * 60 * 1000)) * 80);
        onProgress(progress);
      }
    }, 2000);

    console.log('📤 Enviando requisição para N8N:', N8N_WEBHOOK_URL);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    clearInterval(progressInterval);

    console.log('📥 Resposta recebida:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Ignore json parse errors
      }

      const error: RenderErrorDetails = {
        type: 'N8N_ERROR',
        message: errorMessage,
        details: { status: response.status, statusText: response.statusText }
      };

      throw error;
    }

    const data: N8NRenderResponse = await response.json();
    console.log('✅ Dados recebidos do N8N:', data);

    // Validar resposta
    if (!data.success) {
      const error: RenderErrorDetails = {
        type: 'N8N_ERROR',
        message: data.message || 'N8N retornou falha na renderização',
        details: data
      };
      throw error;
    }

    if (!data.video_url) {
      const error: RenderErrorDetails = {
        type: 'N8N_ERROR',
        message: 'N8N não retornou URL do vídeo',
        details: data
      };
      throw error;
    }

    // Progresso final
    if (onProgress) {
      onProgress(100);
    }

    return data;

  } catch (error: any) {
    clearTimeout(timeoutId);

    // Se for erro já categorizado (do validateRenderParams), rejeitar diretamente
    if (error.type) {
      throw error;
    }

    // Categorizar outros erros
    const errorType = categorizeError(error);
    let errorMessage = 'Erro desconhecido durante renderização';

    switch (errorType) {
      case 'TIMEOUT_ERROR':
        errorMessage = 'Renderização demorou mais que 5 minutos. Tente novamente.';
        break;
      case 'NETWORK_ERROR':
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        break;
      case 'N8N_ERROR':
        errorMessage = 'Erro no serviço de renderização. Tente novamente em alguns minutos.';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }

    const renderError: RenderErrorDetails = {
      type: errorType,
      message: errorMessage,
      details: error
    };

    console.error('❌ Erro na renderização:', renderError);
    throw renderError;
  }
}

/**
 * Verifica se uma URL de vídeo é válida
 */
export async function validateVideoUrl(videoUrl: string): Promise<boolean> {
  try {
    const response = await fetch(videoUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}