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
import { useVideoRenderer } from "@/hooks/useVideoRenderer";

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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Proteção contra cliques duplos no botão de renderização
  const [isRenderingLocally, setIsRenderingLocally] = useState(false);

  // Hook de renderização N8N
  const videoRenderer = useVideoRenderer();

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
    // PROTEÇÃO 1: Evitar múltiplos cliques
    if (isRenderingLocally) {
      console.log('⚠️ Renderização já está em execução localmente, ignorando clique');
      return;
    }

    // Validar se há fotos suficientes
    const totalPhotos = photos.filter(p => p.uploaded).length + drivePhotos.length;
    if (totalPhotos === 0) {
      toast({
        title: "Nenhuma foto disponível",
        description: "Faça upload de pelo menos uma foto antes de renderizar",
        variant: "destructive"
      });
      return;
    }

    // Validar se folderId existe
    if (!driveSubFolderId) {
      toast({
        title: "Pasta não configurada",
        description: "ID da pasta do Google Drive não está disponível",
        variant: "destructive"
      });
      return;
    }

    console.log('🎬 Iniciando renderização N8N para:', {
      videoId,
      obraName,
      folderId: driveSubFolderId,
      photoCount: totalPhotos
    });

    // PROTEÇÃO 2: Marcar como em execução local
    setIsRenderingLocally(true);

    try {
      // Usar o hook de renderização
      const renderedVideo = await videoRenderer.startRender({
        projectName: obraName,
        folderId: driveSubFolderId
      });

      if (renderedVideo) {
        console.log('✅ Renderização concluída:', renderedVideo);
        onRenderComplete(renderedVideo.video_url);

        // Fechar modal após sucesso
        setTimeout(() => {
          onOpenChange(false);
          videoRenderer.resetState();
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Erro na renderização:', error);
      // Erro já tratado pelo hook via toast
    } finally {
      // PROTEÇÃO 3: Sempre resetar estado local
      setIsRenderingLocally(false);
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
          {!videoRenderer.isLoading && (
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
                          disabled={uploading || videoRenderer.isLoading || isRenderingLocally}
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
                          disabled={uploading || videoRenderer.isLoading || isRenderingLocally}
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
                    disabled={uploading || isRenderingLocally}
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
          {videoRenderer.isLoading && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Progresso da Renderização</span>
                  <span className="text-sm font-mono">{Math.round(videoRenderer.progress)}%</span>
                </div>
                <Progress value={videoRenderer.progress} className="w-full h-3" />
              </div>

              {/* Estado atual */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="font-medium text-blue-900">
                    {videoRenderer.isValidating && "Validando dados..."}
                    {videoRenderer.isRendering && "Processando vídeo via N8N..."}
                    {videoRenderer.isSaving && "Salvando resultado..."}
                  </span>
                </div>
                <p className="text-sm text-blue-800">
                  {videoRenderer.isValidating && "Verificando fotos e configurações da pasta"}
                  {videoRenderer.isRendering && "O vídeo está sendo gerado automaticamente. Aguarde 2-3 minutos."}
                  {videoRenderer.isSaving && "Salvando vídeo renderizado na base de dados"}
                </p>
              </div>

              {/* Informações técnicas */}
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                <p>📁 Pasta: {driveSubFolderId}</p>
                <p>📸 Fotos: {photos.filter(p => p.uploaded).length + drivePhotos.length}</p>
                <p>🎬 Projeto: {obraName}</p>
                <p>⏱️ Tempo estimado: 2-3 minutos</p>
              </div>
            </div>
          )}

          {/* Estado de erro */}
          {videoRenderer.isError && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <X className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-900">Erro na Renderização</span>
              </div>
              <p className="text-sm text-red-800 mb-3">{videoRenderer.error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={videoRenderer.resetState}
                className="border-red-200 text-red-700 hover:bg-red-100"
              >
                Tentar Novamente
              </Button>
            </div>
          )}

          {/* Estado de sucesso */}
          {videoRenderer.isSuccess && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Renderização Concluída!</span>
              </div>
              <p className="text-sm text-green-800 mb-3">
                O vídeo foi processado com sucesso e está sendo direcionado para a seção de vídeos renderizados.
              </p>
              {videoRenderer.renderedVideo && (
                <div className="text-xs text-green-700">
                  <p>🎬 ID do vídeo: {videoRenderer.renderedVideo.video_id}</p>
                  <p>📏 Tamanho: {videoRenderer.renderedVideo.file_size}</p>
                  <p>⏱️ Duração: {videoRenderer.renderedVideo.duration}</p>
                </div>
              )}
            </div>
          )}

          {/* Informações N8N */}
          {!videoRenderer.isLoading && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-blue-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Automação N8N
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>✓ Pasta Google Drive: {driveSubFolderId ? 'Configurada' : 'Não configurada'}</p>
                <p>✓ Total de fotos: {photos.filter(p => p.uploaded).length + drivePhotos.length}</p>
                <p>✓ Webhook: https://secengenharia-n8n.j8jnyd.easypanel.host</p>
                <p>✓ Integração Supabase para persistência automática</p>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (videoRenderer.isSuccess) {
                  videoRenderer.resetState();
                }
                onOpenChange(false);
              }}
              disabled={videoRenderer.isLoading || uploading || isRenderingLocally}
            >
              {videoRenderer.isLoading ? "Processando..." : "Fechar"}
            </Button>

            {!videoRenderer.isSuccess && (
              <Button
                onClick={startRender}
                disabled={
                  videoRenderer.isLoading ||
                  isRenderingLocally ||
                  uploading ||
                  (photos.filter(p => p.uploaded).length + drivePhotos.length === 0) ||
                  !driveSubFolderId
                }
              >
                {(videoRenderer.isLoading || isRenderingLocally) ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    {videoRenderer.isValidating && "Validando..."}
                    {videoRenderer.isRendering && "Renderizando..."}
                    {videoRenderer.isSaving && "Salvando..."}
                    {isRenderingLocally && !videoRenderer.isLoading && "Preparando..."}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Renderização
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}