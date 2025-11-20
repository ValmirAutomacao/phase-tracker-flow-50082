import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Upload,
  Video,
  Clock,
  CheckCircle,
  PlayCircle,
  Download,
  Share2,
  Plus,
  Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useSupabaseCRUD } from "@/hooks/useSupabaseMutation";
import { PhotoUpload } from "@/components/PhotoUpload";
import { VideoRenderer } from "@/components/VideoRenderer";
import { GoogleDriveUpload } from "@/components/videos/GoogleDriveUpload";
import "@/styles/responsive.css";

// Interface para Obra (para relacionamento)
interface Obra {
  id: string;
  nome: string;
}

// Interface para Video compatível com Supabase
interface VideoItem {
  id: string;
  obra_id: string; // FK para obras
  nome: string; // nome do vídeo/prompt
  status_renderizacao: 'pendente' | 'processando' | 'concluido' | 'erro';
  arquivo_original_url?: string;
  arquivo_renderizado_url?: string;
  duracao_segundos?: number;
  // Campos preparatórios n8n/Google Drive
  drive_pasta_id?: string;
  drive_subpasta_id?: string;
  n8n_job_id?: string;
  // Timestamps
  created_at?: string;
  updated_at?: string;
  // Campos de relacionamento
  obra?: {
    id: string;
    nome: string;
  };
  // Campos calculados para compatibilidade com UI
  progresso?: number;
  quantidadeFotos?: number;
  prompt?: string;
}

const videoSchema = z.object({
  obra_id: z.string().min(1, "Selecione uma obra"),
  nome: z.string().min(10, "O nome/prompt deve ter no mínimo 10 caracteres"),
});

type VideoFormData = z.infer<typeof videoSchema>;

const Videos = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [driveUploadDialogOpen, setDriveUploadDialogOpen] = useState(false);
  const [renderDialogOpen, setRenderDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);

  // Hooks Supabase para substituir localStorage
  const { data: videos = [], isLoading, error } = useOptimizedSupabaseQuery<any>('VIDEOS');
  const { add, update, delete: deleteVideo } = useSupabaseCRUD<any>('VIDEOS');

  // Query para obras (para dropdown)
  const { data: obras = [] } = useOptimizedSupabaseQuery<any>('OBRAS');

  const form = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      obra_id: "",
      nome: "",
    },
  });

  const onSubmit = (data: VideoFormData) => {
    const novoVideo = {
      obra_id: data.obra_id,
      nome: data.nome,
      status_renderizacao: "pendente" as const,
      arquivo_original_url: null,
      arquivo_renderizado_url: null,
      duracao_segundos: null,
      // Campos preparatórios n8n/Google Drive
      drive_pasta_id: null,
      drive_subpasta_id: null,
      n8n_job_id: null,
    };

    add.mutate(novoVideo, {
      onSuccess: () => {
        toast({
          title: "Vídeo criado!",
          description: "Agora você pode fazer upload de até 150 fotos. A automação será acionada quando você iniciar o vídeo.",
        });
        setOpen(false);
        form.reset();
      },
      onError: (error) => {
        toast({
          title: "Erro ao criar vídeo",
          description: error.message || "Tente novamente em alguns instantes.",
          variant: "destructive",
        });
      },
    });
  };

  const handleOpenUpload = (video: VideoItem) => {
    setSelectedVideo(video);
    setUploadDialogOpen(true);
  };

  const handleUploadComplete = (photoCount: number) => {
    if (selectedVideo) {
      // Remover campos que não devem ser enviados no update
      const { obra, progresso, quantidadeFotos, prompt, ...videoData } = selectedVideo;
      
      const updatedVideo = {
        ...videoData,
        status_renderizacao: "processando" as const,
      };

      update.mutate(
        { id: selectedVideo.id, updates: updatedVideo as any },
        {
          onSuccess: () => {
            toast({
              title: "Upload concluído!",
              description: `${photoCount} fotos foram enviadas. O vídeo está pronto para renderização.`,
            });
          },
          onError: (error) => {
            toast({
              title: "Erro no upload",
              description: error.message || "Tente novamente em alguns instantes.",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const handleOpenDriveUpload = (video: VideoItem, photos: File[]) => {
    setSelectedVideo(video);
    setUploadedPhotos(photos);
    setDriveUploadDialogOpen(true);
  };

  const handleDriveUploadSuccess = (folderId: string, folderName: string) => {
    if (selectedVideo) {
      // Remover campos que não devem ser enviados no update
      const { obra, progresso, quantidadeFotos, prompt, ...videoData } = selectedVideo;
      
      const updatedVideo = {
        ...videoData,
        drive_pasta_id: folderId,
        drive_subpasta_id: folderName,
        status_renderizacao: "processando" as const,
      };

      update.mutate(
        { id: selectedVideo.id, updates: updatedVideo as any },
        {
          onSuccess: () => {
            toast({
              title: "Fotos enviadas!",
              description: `${uploadedPhotos.length} fotos foram enviadas para o Google Drive.`,
            });
            setDriveUploadDialogOpen(false);
            setUploadedPhotos([]);
          },
          onError: (error) => {
            toast({
              title: "Erro ao atualizar registro",
              description: error.message || "Tente novamente.",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const handleOpenRender = (video: VideoItem) => {
    setSelectedVideo(video);
    setRenderDialogOpen(true);
  };

  const handleRenderComplete = (videoData: { duration: string; size: string; url: string }) => {
    if (selectedVideo) {
      const updatedVideo = {
        ...selectedVideo,
        status_renderizacao: "concluido" as const,
        arquivo_renderizado_url: videoData.url,
        duracao_segundos: parseInt(videoData.duration) || null,
        // Campos calculados para compatibilidade
        progresso: 100,
      };

      update.mutate(
        { id: selectedVideo.id, updates: updatedVideo as any },
        {
          onSuccess: () => {
            toast({
              title: "Renderização concluída!",
              description: "O vídeo foi processado com sucesso e está pronto para visualização.",
            });
          },
          onError: (error) => {
            toast({
              title: "Erro na renderização",
              description: error.message || "Tente novamente em alguns instantes.",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: React.ElementType }> = {
      concluido: {
        label: "Concluído",
        className: "bg-green-100 text-green-700 hover:bg-green-100",
        icon: CheckCircle
      },
      processando: {
        label: "Processando",
        className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
        icon: Clock
      },
      pendente: {
        label: "Pendente",
        className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
        icon: ImageIcon
      },
      erro: {
        label: "Erro",
        className: "bg-red-100 text-red-700 hover:bg-red-100",
        icon: ImageIcon
      }
    };

    const variant = variants[status] || variants.pendente;
    const Icon = variant.icon;

    return (
      <Badge className={variant.className}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Módulo Vídeos</h1>
          <p className="text-muted-foreground">Geração automática de vídeos arquitetônicos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Vídeo
            </Button>
          </DialogTrigger>
            <DialogContent className="dialog-content-mobile">
              <DialogHeader className="dialog-header">
              <DialogTitle>Novo Vídeo</DialogTitle>
              <DialogDescription>
                Selecione a obra e adicione um prompt para o vídeo. Após criar, você poderá fazer upload das fotos (até 150).
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <div className="dialog-form-container space-y-4">
                <FormField
                  control={form.control}
                  name="obra_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Obra</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a obra" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {obras.map(obra => (
                            <SelectItem key={obra.id} value={obra.id}>{obra.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome/Prompt do Vídeo</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva como você quer que o vídeo seja gerado. Ex: Vista aérea do edifício ao entardecer com câmera em movimento suave..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Próximos passos:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Faça upload de até 150 fotos da obra</li>
                    <li>As fotos serão salvas no Google Drive via automação</li>
                    <li>Clique em "Renderizar Vídeo" para iniciar o processamento</li>
                    <li>O vídeo será gerado automaticamente e enviado para o app</li>
                  </ol>
                </div>

                </div>
                
                <div className="form-actions">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Vídeo</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Vídeos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">vídeos cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {videos.filter(v => v.status_renderizacao === "pendente").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">aguardando processo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Em Processamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {videos.filter(v => v.status_renderizacao === "processando").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">sendo renderizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {videos.filter(v => v.status_renderizacao === "concluido").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">prontos</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Instructions */}
      <Card className="border-dashed border-2">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Como funciona?</h3>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto mt-2">
                <strong>1.</strong> Crie um novo vídeo e adicione um prompt descritivo<br/>
                <strong>2.</strong> Faça upload de até 150 fotos da obra (serão salvas no Google Drive via n8n)<br/>
                <strong>3.</strong> Clique em "Iniciar Renderização" para acionar a automação de envio das fotos<br/>
                <strong>4.</strong> Clique em "Renderizar Vídeo" para iniciar o processamento<br/>
                <strong>5.</strong> O vídeo será gerado e enviado automaticamente para o app<br/>
                <br/>
                <strong>Rotas de Automação N8N:</strong><br/>
                • Upload de fotos: POST /api/videos/:id/photos<br/>
                • Iniciar renderização: POST /api/videos/:id/render<br/>
                • Status do vídeo: GET /api/videos/:id/status
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Fila de Processamento</CardTitle>
          <CardDescription>Status dos vídeos em tempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-lg bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Erro ao carregar vídeos: {error.message}</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-8">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum vídeo cadastrado ainda.</p>
              </div>
            ) : (
              videos.map((video) => (
              <div
                key={video.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Video className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h4 className="font-semibold truncate">{video.obra?.nome || 'Obra não encontrada'}</h4>
                      {getStatusBadge(video.status_renderizacao)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{video.nome}</p>
                    {video.status_renderizacao === "processando" && (
                      <div className="space-y-1 mb-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-semibold">{video.progresso || 0}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${video.progresso || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-1">
                      <span>Data: {new Date(video.created_at || Date.now()).toLocaleDateString('pt-BR')}</span>
                      {video.quantidadeFotos !== undefined && (
                        <>
                          <span>•</span>
                          <span>Fotos: {video.quantidadeFotos}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Duração: {video.duracao_segundos ? `${video.duracao_segundos}s` : '-'}</span>
                      {video.arquivo_renderizado_url && (
                        <>
                          <span>•</span>
                          <span>Vídeo disponível</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  {video.status_renderizacao === "pendente" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenUpload(video)}
                      className="w-full sm:w-auto"
                    >
                      <Upload className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Upload Fotos</span>
                    </Button>
                  )}
                  {video.status_renderizacao === "processando" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRender(video)}
                      className="w-full sm:w-auto"
                      disabled
                    >
                      Processando...
                    </Button>
                  )}
                  {video.status_renderizacao === "concluido" && (
                    <>
                      {video.arquivo_renderizado_url && (
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <PlayCircle className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Assistir</span>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Download className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Baixar</span>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Share2 className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Compartilhar</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedVideo && (
        <>
          <PhotoUpload
            open={uploadDialogOpen}
            onOpenChange={setUploadDialogOpen}
            videoId={selectedVideo.id}
            obraName={selectedVideo.obra?.nome || 'Obra não encontrada'}
            onUploadComplete={handleUploadComplete}
          />

          <VideoRenderer
            open={renderDialogOpen}
            onOpenChange={setRenderDialogOpen}
            videoId={selectedVideo.id}
            obraName={selectedVideo.obra?.nome || 'Obra não encontrada'}
            photoCount={selectedVideo.quantidadeFotos || 0}
            prompt={selectedVideo.nome}
            onRenderComplete={handleRenderComplete}
          />

          <GoogleDriveUpload
            open={driveUploadDialogOpen}
            onOpenChange={setDriveUploadDialogOpen}
            videoId={selectedVideo.id}
            projectName={selectedVideo.obra?.nome || 'Obra'}
            videoPrompt={selectedVideo.nome}
            photos={uploadedPhotos}
            onSuccess={handleDriveUploadSuccess}
          />
        </>
      )}
    </div>
  );
};

export default Videos;
