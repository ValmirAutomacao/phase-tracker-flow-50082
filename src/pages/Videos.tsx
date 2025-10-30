import { useState, useEffect } from "react";
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
import { STORAGE_KEYS, getFromStorage, addToStorage, updateInStorage } from "@/lib/localStorage";
import { PhotoUpload } from "@/components/PhotoUpload";
import { VideoRenderer } from "@/components/VideoRenderer";

const videoSchema = z.object({
  obraId: z.string().min(1, "Selecione uma obra"),
  prompt: z.string().min(10, "O prompt deve ter no mínimo 10 caracteres"),
});

type VideoFormData = z.infer<typeof videoSchema>;

interface VideoItem {
  id: string;
  obra: string;
  status: "concluido" | "processando" | "fila" | "aguardando_fotos";
  progresso: number;
  dataCriacao: string;
  duracao: string;
  tamanho: string;
  prompt: string;
  quantidadeFotos?: number;
  videoUrl?: string;
}

const Videos = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [open, setOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [renderDialogOpen, setRenderDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const mockObras = getFromStorage(STORAGE_KEYS.OBRAS, [
    { id: "1", nome: "Edifício Alpha" },
    { id: "2", nome: "Residencial Beta" },
    { id: "3", nome: "Comercial Gamma" },
  ]);

  useEffect(() => {
    const stored = getFromStorage<VideoItem>(STORAGE_KEYS.VIDEOS);
    if (stored.length === 0) {
      const defaultVideos: VideoItem[] = [
        {
          id: "1",
          obra: "Edifício Alpha",
          status: "concluido",
          progresso: 100,
          dataCriacao: "2025-01-14",
          duracao: "18s",
          tamanho: "4.2 MB",
          prompt: "Vista aérea do prédio ao entardecer",
          quantidadeFotos: 120
        },
      ];
      setVideos(defaultVideos);
      localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(defaultVideos));
    } else {
      setVideos(stored);
    }
  }, []);

  const form = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      obraId: "",
      prompt: "",
    },
  });

  const onSubmit = (data: VideoFormData) => {
    const novoVideo: VideoItem = {
      id: Date.now().toString(),
      obra: mockObras.find(o => o.id === data.obraId)?.nome || "",
      status: "aguardando_fotos",
      progresso: 0,
      dataCriacao: new Date().toISOString().split('T')[0],
      duracao: "-",
      tamanho: "-",
      prompt: data.prompt,
      quantidadeFotos: 0,
    };

    const updated = addToStorage(STORAGE_KEYS.VIDEOS, novoVideo);
    setVideos(updated);
    setOpen(false);
    form.reset();

    toast({
      title: "Vídeo criado!",
      description: "Agora você pode fazer upload de até 150 fotos. A automação será acionada quando você iniciar o vídeo.",
    });
  };

  const handleOpenUpload = (video: VideoItem) => {
    setSelectedVideo(video);
    setUploadDialogOpen(true);
  };

  const handleUploadComplete = (photoCount: number) => {
    if (selectedVideo) {
      const updatedVideo = {
        ...selectedVideo,
        quantidadeFotos: photoCount,
        status: "fila" as const
      };

      const updated = updateInStorage(STORAGE_KEYS.VIDEOS, selectedVideo.id, updatedVideo);
      setVideos(updated);

      toast({
        title: "Upload concluído!",
        description: `${photoCount} fotos foram enviadas. O vídeo está pronto para renderização.`,
      });
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
        status: "concluido" as const,
        progresso: 100,
        duracao: videoData.duration,
        tamanho: videoData.size,
        videoUrl: videoData.url
      };

      const updated = updateInStorage(STORAGE_KEYS.VIDEOS, selectedVideo.id, updatedVideo);
      setVideos(updated);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: React.ElementType }> = {
      concluido: { 
        label: "Concluído", 
        className: "bg-green-100 text-green-700",
        icon: CheckCircle
      },
      processando: { 
        label: "Processando", 
        className: "bg-blue-100 text-blue-700",
        icon: Clock
      },
      fila: { 
        label: "Na Fila", 
        className: "bg-gray-100 text-gray-700",
        icon: Clock
      },
      aguardando_fotos: {
        label: "Aguardando Fotos",
        className: "bg-yellow-100 text-yellow-700",
        icon: ImageIcon
      }
    };
    
    const variant = variants[status];
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Vídeo</DialogTitle>
              <DialogDescription>
                Selecione a obra e adicione um prompt para o vídeo. Após criar, você poderá fazer upload das fotos (até 150).
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="obraId"
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
                          {mockObras.map(obra => (
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
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt do Vídeo</FormLabel>
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

                <div className="flex justify-end gap-3">
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
            <CardTitle className="text-sm font-medium">Aguardando Fotos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {videos.filter(v => v.status === "aguardando_fotos").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">precisam de upload</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Em Processamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {videos.filter(v => v.status === "processando").length}
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
              {videos.filter(v => v.status === "concluido").length}
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
            {videos.map((video) => (
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
                      <h4 className="font-semibold truncate">{video.obra}</h4>
                      {getStatusBadge(video.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{video.prompt}</p>
                    {video.status === "processando" && (
                      <div className="space-y-1 mb-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-semibold">{video.progresso}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all" 
                            style={{ width: `${video.progresso}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-1">
                      <span>Data: {new Date(video.dataCriacao).toLocaleDateString('pt-BR')}</span>
                      {video.quantidadeFotos !== undefined && (
                        <>
                          <span>•</span>
                          <span>Fotos: {video.quantidadeFotos}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Duração: {video.duracao}</span>
                      <span>•</span>
                      <span>Tamanho: {video.tamanho}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  {video.status === "aguardando_fotos" && (
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
                  {video.status === "fila" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRender(video)}
                      className="w-full sm:w-auto"
                    >
                      Renderizar Vídeo
                    </Button>
                  )}
                  {video.status === "concluido" && (
                    <>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <PlayCircle className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Assistir</span>
                      </Button>
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
            ))}
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
            obraName={selectedVideo.obra}
            onUploadComplete={handleUploadComplete}
          />

          <VideoRenderer
            open={renderDialogOpen}
            onOpenChange={setRenderDialogOpen}
            videoId={selectedVideo.id}
            obraName={selectedVideo.obra}
            photoCount={selectedVideo.quantidadeFotos || 0}
            prompt={selectedVideo.prompt}
            onRenderComplete={handleRenderComplete}
          />
        </>
      )}
    </div>
  );
};

export default Videos;
