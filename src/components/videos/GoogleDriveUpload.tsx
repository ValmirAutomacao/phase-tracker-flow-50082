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
  requestAuthorization
} from '@/services/googleDrive';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface GoogleDriveUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  projectName: string;
  videoPrompt: string;
  photos: File[];
  onSuccess: (folderId: string, folderName: string) => void;
}

export function GoogleDriveUpload({
  open,
  onOpenChange,
  videoId,
  projectName,
  videoPrompt,
  photos,
  onSuccess
}: GoogleDriveUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [driveInitialized, setDriveInitialized] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

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
      // 1. Autorizar acesso ao Drive
      await requestAuthorization();
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
            <div className="text-sm text-muted-foreground">
              <p>As fotos serão organizadas em:</p>
              <p className="font-mono text-xs mt-2 p-2 bg-muted rounded">
                /video-projetos/{projectName}_AAAAMMDD/
              </p>
            </div>
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
