import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Play, X, Plus, Video, Sparkles, Clock, CheckCircle,
  Upload, Download, Share2, Image as ImageIcon, ExternalLink,
  AlertCircle, RefreshCw, Cog
} from "lucide-react";
import { initializeGoogleDrive, requestAuthorization, uploadFileToDrive, deleteFile, listFilesInFolder } from "@/services/googleDrive";
import { updateVideoStatus, updatePhotoCount, setN8nJobId, setVideoCompleted, VideoProject } from "@/services/googleDriveMetadata";
import { startVideoRender, pollRenderStatus } from "@/services/n8nService";

interface VideoRendererProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: VideoProject;
  onVideoUpdated: (updatedVideo: VideoProject) => void;
}

interface PhotoFile {
  id: string;
  file?: File;
  preview: string;
  uploaded: boolean;
  driveFileId?: string;
  driveName?: string;
  fromDrive?: boolean;
}

interface RenderStage {
  name: string;
  description: string;
  progress: number;
  status: "pending" | "active" | "completed" | "error";
}

export function VideoRenderer({
  open,
  onOpenChange,
  video,
  onVideoUpdated
}: VideoRendererProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [rendering, setRendering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [renderProgress, setRenderProgress] = useState(0);
  const [loadingDrivePhotos, setLoadingDrivePhotos] = useState(false);
  const [n8nJobId, setN8nJobIdState] = useState<string | null>(null);

  const [stages, setStages] = useState<RenderStage[]>([
    {
      name: "Análise das Fotos",
      description: "Analisando e organizando as fotos enviadas",
      progress: 0,
      status: "pending"
    },
    {
      name: "Processamento IA",
      description: "Aplicando inteligência artificial para criar transições",
      progress: 0,
      status: "pending"
    },
    {
      name: "Geração de Frames",
      description: "Criando frames intermediários e movimentos de câmera",
      progress: 0,
      status: "pending"
    },
    {
      name: "Renderização Final",
      description: "Compilando o vídeo final com música e efeitos",
      progress: 0,
      status: "pending"
    },
    {
      name: "Finalização",
      description: "Salvando no Google Drive e gerando links",
      progress: 0,
      status: "pending"
    }
  ]);

  // Carregar fotos do Drive ao abrir
  useEffect(() => {
    if (open) {
      initializeGoogleDrive();
      loadExistingPhotos();

      // Se já está renderizando, verificar status
      if (video.metadata.status === 'processando' && video.metadata.n8n_job_id) {
        setN8nJobIdState(video.metadata.n8n_job_id);
        setRendering(true);
        startPolling(video.metadata.n8n_job_id);
      }
    }
  }, [open, video.metadata.drive_folder_id]);

  const loadExistingPhotos = async () => {
    if (!video.metadata.drive_folder_id || !open) return;

    setLoadingDrivePhotos(true);
    try {
      await requestAuthorization();
      const driveFiles = await listFilesInFolder(video.metadata.drive_folder_id);

      // Filtrar apenas imagens, excluindo metadata.json
      const imageFiles = driveFiles.filter(file =>
        file.name !== 'metadata.json' &&
        file.mimeType?.startsWith('image/')
      );

      const drivePhotos: PhotoFile[] = imageFiles.map((file) => ({
        id: file.id,
        preview: file.thumbnailLink || file.webViewLink,
        uploaded: true,
        driveFileId: file.id,
        driveName: file.name,
        fromDrive: true
      }));

      setPhotos(drivePhotos);
    } catch (error) {
      console.error('Erro ao carregar fotos do Drive:', error);
      toast({
        title: "Erro ao carregar fotos",
        description: "Não foi possível carregar as fotos do Google Drive",
        variant: "destructive"
      });
    } finally {
      setLoadingDrivePhotos(false);
    }
  };

  // Adicionar novas fotos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    const newPhotos: PhotoFile[] = imageFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
      uploaded: false
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  // Remover foto
  const removePhoto = async (id: string) => {
    const photo = photos.find(p => p.id === id);

    try {
      // Se é uma foto do Drive, delete do Google Drive
      if (photo?.fromDrive && photo.driveFileId) {
        await requestAuthorization();
        await deleteFile(photo.driveFileId);

        toast({
          title: "Foto removida",
          description: "A foto foi removida do Google Drive com sucesso",
        });
      }

      // Remove do estado local
      setPhotos(prev => {
        const photoToRemove = prev.find(p => p.id === id);
        if (photoToRemove?.preview && !photoToRemove.fromDrive) {
          URL.revokeObjectURL(photoToRemove.preview);
        }
        return prev.filter(p => p.id !== id);
      });

      // Atualizar contagem no metadata
      const totalPhotos = photos.filter(p => p.id !== id && (p.uploaded || p.fromDrive)).length;
      await updatePhotoCount(video.metadata.drive_folder_id, totalPhotos);

      const updatedVideo: VideoProject = {
        ...video,
        metadata: {
          ...video.metadata,
          total_fotos: totalPhotos
        }
      };
      onVideoUpdated(updatedVideo);

    } catch (error) {
      console.error('Erro ao remover foto:', error);
      toast({
        title: "Erro ao remover foto",
        description: "Não foi possível remover a foto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Upload de novas fotos
  const uploadNewPhotos = async () => {
    if (!video.metadata.drive_folder_id) {
      toast({
        title: "Erro",
        description: "Pasta do Google Drive não configurada",
        variant: "destructive"
      });
      return;
    }

    const photosToUpload = photos.filter(p => !p.uploaded && !p.fromDrive);
    if (photosToUpload.length === 0) {
      toast({
        title: "Nenhuma foto para enviar",
        description: "Todas as fotos já foram enviadas",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      await requestAuthorization();

      for (let i = 0; i < photosToUpload.length; i++) {
        const photo = photosToUpload[i];
        if (!photo.file) continue;

        const uploadResult = await uploadFileToDrive(photo.file, video.metadata.drive_folder_id, photo.file.name);

        setPhotos(prev => prev.map(p =>
          p.id === photo.id ? {
            ...p,
            uploaded: true,
            driveFileId: uploadResult.id,
            driveName: uploadResult.name,
            fromDrive: true
          } : p
        ));

        setUploadProgress(((i + 1) / photosToUpload.length) * 100);
      }

      // Atualizar contagem e status
      const totalPhotos = photos.filter(p => p.uploaded || p.fromDrive).length + photosToUpload.length;
      await updatePhotoCount(video.metadata.drive_folder_id, totalPhotos);

      if (video.metadata.status === 'criado') {
        await updateVideoStatus(video.metadata.drive_folder_id, 'upload_realizado');
      }

      const updatedVideo: VideoProject = {
        ...video,
        metadata: {
          ...video.metadata,
          total_fotos: totalPhotos,
          status: video.metadata.status === 'criado' ? 'upload_realizado' : video.metadata.status
        }
      };
      onVideoUpdated(updatedVideo);

      toast({
        title: "Upload concluído!",
        description: `${photosToUpload.length} foto(s) enviada(s) com sucesso`,
      });

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar as fotos. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Iniciar renderização
  const startRender = async () => {
    const uploadedPhotos = photos.filter(p => p.uploaded || p.fromDrive).length;
    if (uploadedPhotos === 0) {
      toast({
        title: "Nenhuma foto disponível",
        description: "Adicione pelo menos uma foto antes de renderizar",
        variant: "destructive"
      });
      return;
    }

    setRendering(true);
    setRenderProgress(0);

    try {
      // Chamar webhook n8n
      const jobId = await startVideoRender({
        video_id: video.metadata.video_id,
        drive_folder_id: video.metadata.drive_folder_id,
        prompt: video.metadata.nome,
        obra_nome: video.metadata.obra_nome,
        total_fotos: uploadedPhotos
      });

      // Atualizar metadata com job ID
      await setN8nJobId(video.metadata.drive_folder_id, jobId);
      setN8nJobIdState(jobId);

      const updatedVideo: VideoProject = {
        ...video,
        metadata: {
          ...video.metadata,
          n8n_job_id: jobId,
          status: 'processando'
        }
      };
      onVideoUpdated(updatedVideo);

      // Iniciar polling
      startPolling(jobId);

      toast({
        title: "Renderização iniciada!",
        description: "O vídeo está sendo processado. Acompanhe o progresso abaixo.",
      });

    } catch (error) {
      console.error('Erro ao iniciar renderização:', error);
      setRendering(false);
      toast({
        title: "Erro na renderização",
        description: "Não foi possível iniciar a renderização. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Polling do status n8n
  const startPolling = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await pollRenderStatus(jobId);

        if (status.status === 'completed') {
          clearInterval(pollInterval);
          setRendering(false);
          setRenderProgress(100);

          // Atualizar metadata com vídeo completo
          if (status.video_url) {
            await setVideoCompleted(video.metadata.drive_folder_id, status.video_url);
          }

          const updatedVideo: VideoProject = {
            ...video,
            metadata: {
              ...video.metadata,
              status: 'concluido',
              video_url: status.video_url
            }
          };
          onVideoUpdated(updatedVideo);

          // Atualizar estágios para concluído
          setStages(prev => prev.map(stage => ({
            ...stage,
            progress: 100,
            status: 'completed'
          })));

          toast({
            title: "Vídeo renderizado com sucesso!",
            description: "O vídeo está pronto e foi salvo no Google Drive.",
          });

        } else if (status.status === 'error') {
          clearInterval(pollInterval);
          setRendering(false);

          // Atualizar status para erro
          await updateVideoStatus(video.metadata.drive_folder_id, 'erro');

          const updatedVideo: VideoProject = {
            ...video,
            metadata: {
              ...video.metadata,
              status: 'erro'
            }
          };
          onVideoUpdated(updatedVideo);

          setStages(prev => prev.map((stage, index) => ({
            ...stage,
            status: index <= 2 ? 'completed' : 'error'
          })));

          toast({
            title: "Erro na renderização",
            description: status.error || "Ocorreu um erro durante o processamento.",
            variant: "destructive"
          });

        } else if (status.status === 'processing') {
          // Atualizar progresso
          setRenderProgress(status.progress || 0);

          // Atualizar estágios baseado no progresso
          const stageIndex = Math.floor((status.progress || 0) / 20);
          setStages(prev => prev.map((stage, index) => ({
            ...stage,
            progress: index === stageIndex ? ((status.progress || 0) % 20) * 5 : index < stageIndex ? 100 : 0,
            status: index < stageIndex ? 'completed' : index === stageIndex ? 'active' : 'pending'
          })));
        }

      } catch (error) {
        console.error('Erro no polling:', error);
        clearInterval(pollInterval);
        setRendering(false);

        toast({
          title: "Erro de comunicação",
          description: "Perdeu-se a conexão com o servidor de renderização.",
          variant: "destructive"
        });
      }
    }, 5000); // Poll a cada 5 segundos

    // Cleanup após 1 hora
    setTimeout(() => {
      clearInterval(pollInterval);
      setRendering(false);
      toast({
        title: "Timeout de renderização",
        description: "A renderização demorou mais que o esperado. Verifique o status manualmente.",
        variant: "destructive"
      });
    }, 3600000); // 1 hora
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "active":
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const totalPhotos = photos.filter(p => p.uploaded || p.fromDrive).length;
  const pendingPhotos = photos.filter(p => !p.uploaded && !p.fromDrive).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Renderizar Vídeo - {video.metadata.obra_nome}
          </DialogTitle>
          <DialogDescription>
            Gerencie fotos e inicie a renderização automática do vídeo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{totalPhotos}</div>
              <div className="text-sm text-muted-foreground">Fotos no Drive</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-500">{pendingPhotos}</div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{photos.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>

          {/* Loading fotos do Drive */}
          {loadingDrivePhotos && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Carregando fotos do Google Drive...</p>
              </div>
            </div>
          )}

          {/* Gerenciamento de fotos */}
          {!rendering && !loadingDrivePhotos && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Gerenciar Fotos</h3>
                <label htmlFor="photo-input-renderer">
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Fotos
                    </span>
                  </Button>
                </label>
                <input
                  id="photo-input-renderer"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Grid de fotos */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-border">
                        <img
                          src={photo.preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={uploading || rendering}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {photo.uploaded && (
                        <Badge className={`absolute bottom-2 left-2 ${photo.fromDrive ? 'bg-blue-600' : 'bg-green-600'}`}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {photo.fromDrive ? 'Drive' : 'Nova'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Botão de upload */}
              {pendingPhotos > 0 && (
                <div className="space-y-2">
                  <Button
                    onClick={uploadNewPhotos}
                    disabled={uploading}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Enviando..." : `Enviar ${pendingPhotos} Foto(s) para Drive`}
                  </Button>
                  {uploading && (
                    <Progress value={uploadProgress} className="w-full" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Progresso de renderização */}
          {rendering && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Progresso da Renderização</span>
                  <span className="text-sm font-mono">{Math.round(renderProgress)}%</span>
                </div>
                <Progress value={renderProgress} className="w-full h-3" />
              </div>

              {/* Estágios */}
              <div className="space-y-2">
                {stages.map((stage, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-colors ${
                      stage.status === "active" ? "bg-blue-50 border-blue-200" :
                      stage.status === "completed" ? "bg-green-50 border-green-200" :
                      stage.status === "error" ? "bg-red-50 border-red-200" :
                      "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStageIcon(stage.status)}
                        <span className="font-medium text-sm">{stage.name}</span>
                      </div>
                      {stage.status === "active" && (
                        <span className="text-xs font-mono">{stage.progress}%</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{stage.description}</p>
                    {stage.status === "active" && (
                      <Progress value={stage.progress} className="w-full h-1 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vídeo concluído */}
          {video.metadata.status === 'concluido' && video.metadata.video_url && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4" />
                Vídeo Renderizado com Sucesso!
              </h4>
              <p className="text-sm text-green-800 mb-3">
                O vídeo foi processado e está disponível para visualização.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(video.metadata.video_url!, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Vídeo no Drive
              </Button>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={rendering || uploading}
            >
              {rendering ? "Renderizando..." : "Fechar"}
            </Button>

            {!rendering && video.metadata.status !== 'concluido' && (
              <Button
                onClick={startRender}
                disabled={uploading || totalPhotos === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Renderização
              </Button>
            )}

            {video.metadata.status === 'erro' && (
              <Button
                onClick={startRender}
                disabled={uploading || totalPhotos === 0}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}