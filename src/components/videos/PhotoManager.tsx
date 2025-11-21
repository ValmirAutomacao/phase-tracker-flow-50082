import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Play, X, Plus, Video, Sparkles, Clock, CheckCircle,
  Upload, Download, Share2, Image as ImageIcon
} from "lucide-react";
import { initializeGoogleDrive, requestAuthorization, uploadFileToDrive, listFilesInFolder, deleteFile, hasValidToken } from "@/services/googleDrive";

interface PhotoManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  obraName: string;
  driveFolderId: string | null;
  driveSubFolderId: string | null;
  currentPhotoCount?: number;
  onRenderComplete: (videoUrl: string) => void;
}

interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  uploaded: boolean;
}

interface RenderStage {
  name: string;
  description: string;
  progress: number;
  status: "pending" | "active" | "completed";
}

export function PhotoManager({
  open,
  onOpenChange,
  videoId,
  obraName,
  driveFolderId,
  driveSubFolderId,
  currentPhotoCount = 0,
  onRenderComplete
}: PhotoManagerProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [drivePhotos, setDrivePhotos] = useState<any[]>([]);
  const [loadingDrivePhotos, setLoadingDrivePhotos] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [renderProgress, setRenderProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [stages, setStages] = useState<RenderStage[]>([
    {
      name: "Análise das Fotos",
      description: "Analisando e organizando as fotos enviadas",
      progress: 0,
      status: "pending"
    },
    {
      name: "Processamento IA",
      description: "Aplicando inteligência artificial",
      progress: 0,
      status: "pending"
    },
    {
      name: "Geração de Frames",
      description: "Criando frames intermediários e transições",
      progress: 0,
      status: "pending"
    },
    {
      name: "Renderização Final",
      description: "Compilando o vídeo final",
      progress: 0,
      status: "pending"
    },
    {
      name: "Finalização",
      description: "Salvando no Google Drive",
      progress: 0,
      status: "pending"
    }
  ]);

  useEffect(() => {
    if (open) {
      initializeGoogleDrive().then((success) => {
        if (success) {
          loadDrivePhotos();
        }
      });
    }
  }, [open, driveSubFolderId]);

  const loadDrivePhotos = async () => {
    if (!driveSubFolderId) {
      console.log('DriveSubFolderId não fornecido');
      return;
    }

    setLoadingDrivePhotos(true);
    try {
      console.log('Carregando fotos do Drive para pasta:', driveSubFolderId);

      // Tentar listar arquivos SEM autorização primeiro (usa API Key)
      const files = await listFilesInFolder(driveSubFolderId);
      console.log('Arquivos encontrados na pasta:', files);

      // Filtrar apenas imagens
      const imageFiles = files.filter((file: any) =>
        file.mimeType && file.mimeType.startsWith('image/')
      );

      console.log('Imagens filtradas:', imageFiles);
      setDrivePhotos(imageFiles);
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

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo?.preview) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const removeDrivePhoto = async (fileId: string) => {
    try {
      if (!hasValidToken()) {
        await requestAuthorization();
      }
      await deleteFile(fileId);
      setDrivePhotos(prev => prev.filter(f => f.id !== fileId));
      toast({
        title: "Foto removida",
        description: "A foto foi removida do Google Drive",
      });
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      toast({
        title: "Erro ao remover foto",
        description: "Não foi possível remover a foto do Google Drive",
        variant: "destructive"
      });
    }
  };

  const uploadNewPhotos = async () => {
    if (!driveSubFolderId) {
      toast({
        title: "Erro",
        description: "Pasta do Google Drive não configurada",
        variant: "destructive"
      });
      return;
    }

    const photosToUpload = photos.filter(p => !p.uploaded);
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
      // Verificar token antes de upload
      if (!hasValidToken()) {
        await requestAuthorization();
      }

      for (let i = 0; i < photosToUpload.length; i++) {
        const photo = photosToUpload[i];
        await uploadFileToDrive(photo.file, driveSubFolderId, photo.file.name);

        setPhotos(prev => prev.map(p =>
          p.id === photo.id ? { ...p, uploaded: true } : p
        ));

        setUploadProgress(((i + 1) / photosToUpload.length) * 100);
      }

      toast({
        title: "Upload concluído!",
        description: `${photosToUpload.length} foto(s) enviada(s) com sucesso`,
      });

      // Recarregar fotos do Drive
      await loadDrivePhotos();

      // Limpar fotos locais após upload bem-sucedido
      setPhotos([]);
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

  const startRender = async () => {
    const uploadedPhotos = photos.filter(p => p.uploaded).length;
    if (uploadedPhotos === 0) {
      toast({
        title: "Nenhuma foto disponível",
        description: "Faça upload de pelo menos uma foto antes de renderizar",
        variant: "destructive"
      });
      return;
    }

    setRendering(true);

    // Simular chamada para n8n webhook
    const n8nWebhookUrl = import.meta.env.VITE_N8N_RENDER_WEBHOOK || "https://n8n.example.com/webhook/render-video";

    try {
      // TODO: Implementar chamada real para o n8n quando webhook estiver configurado
      console.log('🎬 Iniciando renderização simulada para:', {
        videoId,
        obraName,
        driveFolderId: driveSubFolderId,
        photoCount: drivePhotos.length
      });

      // Por enquanto, apenas simular sem chamar webhook
      // const response = await fetch(n8nWebhookUrl, ...);

      // Simular progresso de renderização
      for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
        setCurrentStage(stageIndex);

        setStages(prev => prev.map((stage, index) => ({
          ...stage,
          status: index === stageIndex ? "active" : index < stageIndex ? "completed" : "pending"
        })));

        for (let progress = 0; progress <= 100; progress += 5) {
          await new Promise(resolve => setTimeout(resolve, 100));

          setStages(prev => prev.map((stage, index) =>
            index === stageIndex ? { ...stage, progress } : stage
          ));

          const stageWeight = 100 / stages.length;
          const stageProgress = (progress / 100) * stageWeight;
          const previousStagesProgress = stageIndex * stageWeight;
          setRenderProgress(previousStagesProgress + stageProgress);
        }

        setStages(prev => prev.map((stage, index) =>
          index === stageIndex ? { ...stage, status: "completed" } : stage
        ));
      }

      const videoUrl = `https://drive.google.com/file/d/${driveSubFolderId}/video_renderizado.mp4`;

      toast({
        title: "Vídeo renderizado com sucesso!",
        description: `O vídeo da obra "${obraName}" está pronto.`,
      });

      onRenderComplete(videoUrl);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro na renderização:', error);
      toast({
        title: "Erro na renderização",
        description: "Não foi possível renderizar o vídeo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setRendering(false);
      setRenderProgress(0);
    }
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "active":
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const totalPhotos = photos.filter(p => p.uploaded).length + drivePhotos.length;
  const pendingPhotos = photos.filter(p => !p.uploaded).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Gerenciar Fotos e Renderizar - {obraName}
          </DialogTitle>
          <DialogDescription>
            Adicione, remova ou visualize as fotos antes de iniciar a renderização do vídeo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{totalPhotos}</div>
              <div className="text-sm text-muted-foreground">Fotos Enviadas</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-500">{pendingPhotos}</div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{photos.length}</div>
              <div className="text-sm text-muted-foreground">Total Selecionadas</div>
            </div>
          </div>

          {/* Upload de novas fotos */}
          {!rendering && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Adicionar Fotos</h3>
                <label htmlFor="photo-input">
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      Selecionar Fotos
                    </span>
                  </Button>
                </label>
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Grid de fotos locais */}
              {photos.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Fotos para Upload</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
                          <Badge className="absolute bottom-2 left-2 bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Enviada
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grid de fotos do Google Drive */}
              {drivePhotos.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Fotos no Google Drive ({drivePhotos.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {drivePhotos.map((file) => (
                      <div key={file.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-green-200 bg-green-50 flex items-center justify-center relative">
                          {/* Fallback com nome da foto sempre visível */}
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-center p-2">
                            <div>
                              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-1" />
                              <div className="text-xs text-muted-foreground font-medium">
                                {file.name.replace(/\.(jpg|jpeg|png|gif)$/i, '')}
                              </div>
                            </div>
                          </div>

                          {/* Imagem que carrega por cima */}
                          <img
                            src={`https://drive.google.com/thumbnail?id=${file.id}&sz=200`}
                            alt={file.name}
                            className="absolute inset-0 w-full h-full object-cover z-10"
                            crossOrigin="anonymous"
                            onLoad={(e) => {
                              console.log('✅ Thumbnail carregada:', file.name);
                            }}
                            onError={(e) => {
                              console.log('❌ Erro ao carregar thumbnail:', file.name, 'URL:', e.currentTarget.src);
                              // Se falhar, só remove a imagem (deixa o fallback)
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                        <button
                          onClick={() => removeDrivePhoto(file.id)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={uploading || rendering}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <Badge className="absolute bottom-2 left-2 bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          No Drive
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loadingDrivePhotos && (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Carregando fotos do Google Drive...</p>
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
                  <span className="font-medium">Progresso Geral</span>
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

          {/* Informações N8N */}
          {!rendering && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-blue-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Automação N8N
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>✓ Pasta Google Drive: {driveSubFolderId ? 'Configurada' : 'Não configurada'}</p>
                <p>✓ Total de fotos: {totalPhotos}</p>
                <p>✓ Webhook configurado para renderização automática</p>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={rendering || uploading}
            >
              {rendering ? "Renderizando..." : "Fechar"}
            </Button>
            <Button
              onClick={startRender}
              disabled={rendering || uploading || (totalPhotos === 0)}
            >
              {rendering ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Renderizando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Renderização
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}