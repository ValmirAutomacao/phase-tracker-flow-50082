import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image, FolderOpen } from "lucide-react";

interface PhotoUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  obraName: string;
  onUploadComplete: (photoCount: number) => void;
}

interface PhotoFile {
  file: File;
  preview: string;
  id: string;
}

export function PhotoUpload({ open, onOpenChange, videoId, obraName, onUploadComplete }: PhotoUploadProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (photos.length + imageFiles.length > 150) {
      toast({
        title: "Limite excedido",
        description: "Você pode fazer upload de no máximo 150 fotos.",
        variant: "destructive",
      });
      return;
    }

    const newPhotos: PhotoFile[] = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const clearAllPhotos = () => {
    photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos([]);
  };

  const simulateUpload = async () => {
    setUploading(true);
    setUploadProgress(0);

    // Simula upload com progresso
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(i);
    }

    // Simula criação da pasta no Google Drive
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Upload concluído!",
      description: `${photos.length} fotos foram enviadas para o Google Drive. Pasta criada: ${obraName} - ${new Date().toLocaleDateString('pt-BR')}`,
    });

    onUploadComplete(photos.length);
    setUploading(false);
    setUploadProgress(0);
    clearAllPhotos();
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!uploading) {
      clearAllPhotos();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Upload de Fotos - {obraName}</DialogTitle>
          <DialogDescription>
            Selecione até 150 fotos da obra. As fotos serão organizadas em pastas no Google Drive via automação N8N.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Seletor de arquivos */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-8">
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Selecione as fotos da obra</h3>
                <p className="text-sm text-muted-foreground">
                  Formatos aceitos: JPG, PNG, WEBP (até 150 fotos)
                </p>
              </div>
              <div className="flex justify-center">
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Escolher Fotos
                    </span>
                  </Button>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </div>
            </div>
          </div>

          {/* Contador e ações */}
          {photos.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span className="font-medium">{photos.length} foto(s) selecionada(s)</span>
                <span className="text-sm text-muted-foreground">
                  (máximo 150)
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllPhotos}
                disabled={uploading}
              >
                Limpar Todas
              </Button>
            </div>
          )}

          {/* Preview das fotos */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3 max-h-60 overflow-y-auto">
              {photos.map(photo => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.preview}
                    alt="Preview"
                    className="w-full h-20 object-cover rounded border"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    disabled={uploading}
                    className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Barra de progresso */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enviando fotos...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Criando pasta no Google Drive e organizando fotos...
              </p>
            </div>
          )}

          {/* Informações do processo */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-blue-900">Processo de Upload</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Pasta criada no Google Drive: <strong>{obraName}</strong></li>
              <li>Subpasta criada com data: <strong>{new Date().toLocaleDateString('pt-BR')}</strong></li>
              <li>Fotos organizadas e sincronizadas via automação N8N</li>
              <li>Notificação enviada quando concluído</li>
            </ol>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              {uploading ? "Aguarde..." : "Cancelar"}
            </Button>
            <Button
              onClick={simulateUpload}
              disabled={photos.length === 0 || uploading}
            >
              {uploading ? "Enviando..." : `Enviar ${photos.length} Foto(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}