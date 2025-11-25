import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { callN8NRenderWebhook, generateVideoId } from '@/services/n8nVideoService';
import type {
  UseVideoRendererState,
  StartRenderParams,
  RenderedVideo,
  RenderErrorDetails
} from '@/types/renderedVideo';

/**
 * Hook para gerenciar renderização de vídeos via N8N e persistência no Supabase
 */
export function useVideoRenderer() {
  const { toast } = useToast();

  // Estado do hook
  const [state, setState] = useState<UseVideoRendererState>({
    status: 'idle',
    progress: 0,
    error: null,
    renderedVideo: null
  });

  // PROTEÇÃO 2: Controle de execução para evitar múltiplas chamadas
  const [isExecuting, setIsExecuting] = useState(false);

  // Atualizar progresso
  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress))
    }));
  }, []);

  // Salvar vídeo renderizado no Supabase
  const saveRenderedVideo = useCallback(async (
    videoId: string,
    projectName: string,
    folderId: string,
    videoUrl: string,
    fileSize: string,
    duration: string
  ): Promise<RenderedVideo> => {
    try {
      console.log('💾 Salvando vídeo renderizado no Supabase:', { videoId, projectName, videoUrl });

      // Usar MCP Supabase para inserir o registro
      const { supabase } = await import('@/lib/supabaseClient');

      // PROTEÇÃO 1: Verificar se já existe registro com este video_id
      const { data: existingVideo } = await supabase
        .from('videos_renderizados')
        .select('*')
        .eq('video_id', videoId)
        .single();

      if (existingVideo) {
        console.log('⚠️ Vídeo já existe no Supabase, retornando existente:', existingVideo);
        return existingVideo as RenderedVideo;
      }

      const videoData = {
        video_id: videoId,
        project_name: projectName,
        video_url: videoUrl,
        folder_id: folderId,
        file_size: fileSize,
        duration: duration,
        status: 'completed' as const,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('videos_renderizados')
        .insert(videoData)
        .select()
        .single();

      if (error) {
        // Se for erro de chave duplicada, tentar buscar o registro existente
        if (error.code === '23505') { // unique violation
          console.log('🔄 Registro duplicado detectado, buscando existente...');
          const { data: existingAfterError } = await supabase
            .from('videos_renderizados')
            .select('*')
            .eq('video_id', videoId)
            .single();

          if (existingAfterError) {
            return existingAfterError as RenderedVideo;
          }
        }

        console.error('❌ Erro ao salvar no Supabase:', error);
        throw error;
      }

      console.log('✅ Vídeo salvo no Supabase:', data);
      return data as RenderedVideo;

    } catch (error: any) {
      console.error('❌ Erro ao salvar vídeo renderizado:', error);

      const saveError: RenderErrorDetails = {
        type: 'SUPABASE_ERROR',
        message: 'Erro ao salvar vídeo na base de dados',
        details: error
      };

      throw saveError;
    }
  }, []);

  // Iniciar renderização
  const startRender = useCallback(async (params: StartRenderParams): Promise<RenderedVideo | null> => {
    const { projectName, folderId } = params;

    // PROTEÇÃO 2: Evitar múltiplas execuções simultâneas
    if (isExecuting) {
      console.log('⚠️ Renderização já está em execução, ignorando nova chamada');
      toast({
        title: "Renderização em andamento",
        description: "Aguarde a renderização atual terminar.",
        variant: "destructive"
      });
      return null;
    }

    console.log('🎬 Iniciando renderização:', params);
    setIsExecuting(true);

    try {
      // Estado inicial
      setState({
        status: 'validating',
        progress: 0,
        error: null,
        renderedVideo: null
      });

      // Estado de renderização
      setState(prev => ({ ...prev, status: 'rendering' }));

      // Chamar N8N webhook
      const result = await callN8NRenderWebhook(
        projectName,
        folderId,
        (progress) => {
          updateProgress(progress);
        }
      );

      // Estado de salvamento
      setState(prev => ({ ...prev, status: 'saving', progress: 90 }));

      // Salvar no Supabase
      const savedVideo = await saveRenderedVideo(
        result.video_id,
        projectName,
        folderId,
        result.video_url,
        result.file_size,
        result.duration
      );

      // Sucesso
      setState({
        status: 'success',
        progress: 100,
        error: null,
        renderedVideo: savedVideo
      });

      toast({
        title: "Vídeo renderizado com sucesso!",
        description: `O vídeo "${projectName}" foi processado e está pronto para visualização.`,
      });

      console.log('✅ Renderização concluída com sucesso:', savedVideo);
      return savedVideo;

    } catch (error: any) {
      console.error('❌ Erro na renderização:', error);

      // Estado de erro
      setState({
        status: 'error',
        progress: 0,
        error: error.message || 'Erro desconhecido na renderização',
        renderedVideo: null
      });

      // Toast de erro específico
      let errorTitle = "Erro na renderização";
      let errorDescription = error.message || "Tente novamente em alguns instantes.";

      switch (error.type) {
        case 'VALIDATION_ERROR':
          errorTitle = "Dados inválidos";
          break;
        case 'TIMEOUT_ERROR':
          errorTitle = "Tempo esgotado";
          errorDescription = "A renderização demorou mais que 5 minutos. Verifique se há muitas fotos ou tente novamente.";
          break;
        case 'NETWORK_ERROR':
          errorTitle = "Erro de conexão";
          errorDescription = "Verifique sua conexão com a internet e tente novamente.";
          break;
        case 'N8N_ERROR':
          errorTitle = "Erro no processamento";
          errorDescription = "O serviço de renderização encontrou um problema. Tente novamente em alguns minutos.";
          break;
        case 'SUPABASE_ERROR':
          errorTitle = "Erro ao salvar";
          errorDescription = "O vídeo foi processado, mas houve erro ao salvar. Contate o suporte.";
          break;
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive"
      });

      return null;
    } finally {
      setIsExecuting(false);
    }
  }, [toast, updateProgress, saveRenderedVideo, isExecuting]);

  // Resetar estado
  const resetState = useCallback(() => {
    setState({
      status: 'idle',
      progress: 0,
      error: null,
      renderedVideo: null
    });
    setIsExecuting(false);
  }, []);

  // Estados derivados para facilitar uso
  const isIdle = state.status === 'idle';
  const isValidating = state.status === 'validating';
  const isRendering = state.status === 'rendering';
  const isSaving = state.status === 'saving';
  const isSuccess = state.status === 'success';
  const isError = state.status === 'error';
  const isLoading = isValidating || isRendering || isSaving;

  return {
    // Estado
    ...state,

    // Estados derivados
    isIdle,
    isValidating,
    isRendering,
    isSaving,
    isSuccess,
    isError,
    isLoading,

    // Ações
    startRender,
    resetState,

    // Utilitários
    generateVideoId
  };
}