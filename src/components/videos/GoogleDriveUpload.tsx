import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  initializeGoogleDrive,
  createProjectFolder,
  uploadFileToDrive,
  uploadMetadata,
  requestAuthorization,
  hasValidToken
} from '@/services/googleDrive';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GoogleDriveUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  projectName: string;
  videoPrompt: string;
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  onSuccess: (folderId: string, folderName: string) => void;
}

export function GoogleDriveUpload({
  open,
  onOpenChange,
  videoId,
  projectName,
  videoPrompt,
  photos,
  onPhotosChange,
  onSuccess
}: GoogleDriveUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [driveInitialized, setDriveInitialized] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [photoPreviews, setPhotoPreviews] = useState<{ file: File; preview: string }[]>([]);

  useEffect(() => {
    // Criar previews das fotos
    const previews = photos.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setPhotoPreviews(previews);

    // Cleanup: revogar URLs quando o componente desmontar ou fotos mudarem
    return () => {
      previews.forEach(p => URL.revokeObjectURL(p.preview));
    };
  }, [photos]);

  useEffect(() => {
    const init = async () => {
      try {
        const initialized = await initializeGoogleDrive();
        setDriveInitialized(initialized);
        if (!initialized) {
          toast({
            title: "Erro de configuração",
            description: "Google Drive API não está configurado corretamente.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Erro ao inicializar Drive:', error);
        setDriveInitialized(false);
      }
    };
    init();
  }, []);

  const handleUpload = async () => {
    if (!driveInitialized) {
      toast({
        title: "Erro",
        description: "Google Drive não está inicializado.",
        variant: "destructive"
      });
      return;
    }

    if (photos.length === 0) {
      toast({
        title: "Nenhuma foto",
        description: "Adicione pelo menos uma foto antes de fazer upload.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');

    try {
      // 1. Verificar/Autorizar acesso ao Drive
      if (!hasValidToken()) {
        await requestAuthorization();
      }
      toast({
        title: "Autorizado",
        description: "Acesso ao Google Drive autorizado."
      });

      // 2. Criar pasta do projeto
      const { folderId, folderName } = await createProjectFolder(projectName);
      setUploadProgress(5);
      
      // 3. Upload das fotos
      const totalPhotos = photos.length;
      for (let i = 0; i < totalPhotos; i++) {
        const fileName = `foto-${String(i + 1).padStart(3, '0')}.${photos[i].name.split('.').pop()}`;
        await uploadFileToDrive(photos[i], folderId, fileName);
        const progress = 5 + Math.round(((i + 1) / totalPhotos) * 85);
        setUploadProgress(progress);
      }
      
      // 4. Criar e fazer upload do metadata.json
      const metadata = {
        video_id: videoId,
        projeto_id: folderName,
        projeto_nome: projectName,
        prompt_narracao: videoPrompt,
        total_fotos: photos.length,
        created_at: new Date().toISOString(),
        status: 'aguardando_processamento',
        folder_id: folderId
      };
      
      await uploadMetadata(folderId, metadata);
      setUploadProgress(100);
      setUploadStatus('success');
      
      toast({
        title: "Upload concluído!",
        description: `${photos.length} fotos enviadas para o Google Drive.`
      });
      
      // Chamar callback de sucesso
      onSuccess(folderId, folderName);
      
      // Fechar dialog após 2 segundos
      setTimeout(() => {
        onOpenChange(false);
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 2000);
      
    } catch (error: any) {
      console.error('Erro no upload:', error);
      setUploadStatus('error');
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer upload das fotos.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload para Google Drive</DialogTitle>
          <DialogDescription>
            Enviando {photos.length} foto{photos.length !== 1 ? 's' : ''} para o projeto: {projectName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {uploadStatus === 'idle' && (
            <>
              <div className="text-sm text-muted-foreground">
                <p>As fotos serão organizadas em:</p>
                <p className="font-mono text-xs mt-2 p-2 bg-muted rounded">
                  /video-projetos/{projectName}_AAAAMMDD/
                </p>
              </div>
              
              {/* Seletor de fotos */}
              <div className="border-2 border-dashed rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    onPhotosChange([...photos, ...files]);
                  }}
                  className="hidden"
                  id="photo-input"
                />
                <label
                  htmlFor="photo-input"
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {photos.length > 0 ? `${photos.length} foto(s) selecionada(s)` : 'Clique para selecionar fotos'}
                  </span>
                </label>
              </div>

              {/* Grid de previews das fotos */}
              {photoPreviews.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Fotos selecionadas:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPhotosChange([])}
                      className="text-xs"
                    >
                      Limpar todas
                    </Button>
                  </div>
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    <div className="grid grid-cols-3 gap-3">
                      {photoPreviews.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo.preview}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemovePhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <span className="absolute bottom-1 left-1 bg-background/80 text-xs px-1 rounded">
                            {index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </>
          )}
          
          {uploadStatus === 'uploading' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enviando fotos para o Drive...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
          
          {uploadStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Upload concluído com sucesso!</span>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Erro no upload. Tente novamente.</span>
            </div>
          )}
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || !driveInitialized || uploadStatus === 'success'}
            >
              {isUploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Iniciar Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
