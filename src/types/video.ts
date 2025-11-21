// CLAUDE-NOTE: Tipos TypeScript para o módulo de vídeos e renderização

// Status de renderização do vídeo
export type VideoRenderStatus =
  | 'pendente'           // Vídeo criado, aguardando upload de fotos
  | 'upload_realizado'   // Fotos foram enviadas, pronto para renderizar
  | 'processando'        // Renderização em andamento via n8n
  | 'concluido'          // Vídeo renderizado com sucesso
  | 'erro';              // Erro na renderização

// Interface principal para vídeos
export interface VideoItem {
  id: string;
  obra_id: string;
  nome: string; // prompt/descrição do vídeo
  status_renderizacao: VideoRenderStatus;
  arquivo_original_url?: string;
  arquivo_renderizado_url?: string;
  duracao_segundos?: number;
  quantidade_fotos?: number;

  // Campos Google Drive
  drive_pasta_id?: string;
  drive_subpasta_id?: string;

  // Campos n8n
  n8n_job_id?: string;

  // Timestamps
  created_at?: string;
  updated_at?: string;

  // Relacionamento com obra
  obra?: {
    id: string;
    nome: string;
  };
}

// Interface para arquivos de foto
export interface PhotoFile {
  id: string;
  file?: File; // Arquivo local (se isLocal = true)
  name: string;
  preview: string; // URL de preview (local ou thumbnail do Drive)
  uploaded: boolean;
  isLocal?: boolean; // true = arquivo local, false = arquivo no Drive
  size?: number;
  driveId?: string; // ID do arquivo no Google Drive
  thumbnailLink?: string;
}

// Interface para arquivos do Google Drive
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  createdTime: string;
  thumbnailLink?: string;
  webViewLink?: string;
}

// Interface para estágios de renderização
export interface RenderStage {
  name: string;
  description: string;
  progress: number;
  status: 'pending' | 'active' | 'completed' | 'error';
}

// Configurações de renderização
export interface RenderConfig {
  videoId: string;
  obraName: string;
  prompt: string;
  driveFolderId: string;
  photoCount: number;
  quality?: 'draft' | 'standard' | 'high';
  duration?: number; // duração desejada em segundos
}

// Resposta da API n8n
export interface RenderResponse {
  success: boolean;
  jobId: string;
  message: string;
  estimatedDuration?: number;
}

// Status de job n8n
export interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  stage?: string;
  videoUrl?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

// Configurações do Google Drive
export interface DriveConfig {
  clientId: string;
  clientSecret: string;
  parentFolderId: string;
  apiKey?: string;
}

// Metadados para upload no Drive
export interface VideoMetadata {
  video_id: string;
  projeto_id: string;
  projeto_nome: string;
  prompt_narracao: string;
  total_fotos: number;
  created_at: string;
  status: 'aguardando_processamento' | 'processando' | 'concluido' | 'erro';
  folder_id: string;
  render_config?: RenderConfig;
}

// Props dos componentes principais
export interface VideoManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  obraName: string;
  driveFolderId: string | null;
  driveSubFolderId: string | null;
  onRenderComplete: (videoUrl: string) => void;
}

export interface GoogleDriveUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  projectName: string;
  videoPrompt: string;
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  onSuccess: (folderId: string, folderName: string) => void;
}

// Event handlers para callbacks
export type VideoUploadHandler = (photoCount: number) => void;
export type RenderCompleteHandler = (videoUrl: string) => void;
export type RenderProgressHandler = (progress: number, stage?: string) => void;
export type ErrorHandler = (error: Error) => void;

// Constantes úteis
export const VIDEO_RENDER_STATUS_LABELS: Record<VideoRenderStatus, string> = {
  pendente: 'Pendente',
  upload_realizado: 'Pronto para Renderizar',
  processando: 'Processando',
  concluido: 'Concluído',
  erro: 'Erro'
};

export const RENDER_STAGE_DEFAULTS: RenderStage[] = [
  {
    name: 'Análise das Fotos',
    description: 'Analisando e organizando as fotos enviadas',
    progress: 0,
    status: 'pending'
  },
  {
    name: 'Processamento IA',
    description: 'Aplicando inteligência artificial baseada no prompt',
    progress: 0,
    status: 'pending'
  },
  {
    name: 'Geração de Frames',
    description: 'Criando frames intermediários e transições',
    progress: 0,
    status: 'pending'
  },
  {
    name: 'Renderização Final',
    description: 'Compilando o vídeo final em alta qualidade',
    progress: 0,
    status: 'pending'
  },
  {
    name: 'Finalização',
    description: 'Salvando no Google Drive e preparando para download',
    progress: 0,
    status: 'pending'
  }
];