// Tipos para vídeos renderizados via N8N

// Interface da requisição para o webhook N8N
export interface N8NRenderRequest {
  videoId: string;
  folderId: string;
}

// Interface da resposta do webhook N8N
export interface N8NRenderResponse {
  success: boolean;
  video_id: string;
  video_url: string;
  file_size: string;
  duration: string;
  status: 'completed' | 'failed';
  message: string;
}

// Interface para vídeo renderizado (compatível com Supabase)
export interface RenderedVideo {
  id: string;
  video_id: string;
  project_name: string | null;
  video_url: string;
  folder_id: string | null;
  file_size: string | null;
  duration: string | null;
  status: 'completed' | 'processing' | 'failed';
  created_at: string | null;
}

// Estados de renderização
export type RenderStatus = 'idle' | 'validating' | 'rendering' | 'saving' | 'success' | 'error';

// Interface para o hook de renderização
export interface UseVideoRendererState {
  status: RenderStatus;
  progress: number;
  error: string | null;
  renderedVideo: RenderedVideo | null;
}

// Parâmetros para iniciar renderização
export interface StartRenderParams {
  projectName: string;
  folderId: string;
  obraId?: string;
}

// Tipos de erro específicos
export type RenderError =
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'N8N_ERROR'
  | 'SUPABASE_ERROR'
  | 'UNKNOWN_ERROR';

// Interface para erro detalhado
export interface RenderErrorDetails {
  type: RenderError;
  message: string;
  details?: any;
}