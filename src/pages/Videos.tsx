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
  Image as ImageIcon,
  Edit,
  Trash
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { initializeGoogleDrive, listProjectFolders } from "@/services/googleDrive";
import { PhotoUpload } from "@/components/PhotoUpload";
import { VideoRenderer } from "@/components/VideoRenderer";
import { GoogleDriveUpload } from "@/components/videos/GoogleDriveUpload";
import { PhotoManager } from "@/components/videos/PhotoManager";
import { RenderedVideos } from "@/components/videos/RenderedVideos";
import { deleteDriveFolder } from "@/services/googleDrive";
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
  quantidade_fotos?: number;
  // Timestamps
  created_at?: string;
  updated_at?: string;
  // Campos de relacionamento
  obra?: {
    id: string;
    nome: string;
  };
}

const videoSchema = z.object({
  obra_id: z.string().min(1, "Selecione uma obra"),
  nome: z.string().min(10, "O nome/prompt deve ter no mínimo 10 caracteres"),
});

type VideoFormData = z.infer<typeof videoSchema>;

const Videos = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [driveUploadDialogOpen, setDriveUploadDialogOpen] = useState(false);
  const [renderDialogOpen, setRenderDialogOpen] = useState(false);
  const [photoManagerOpen, setPhotoManagerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'projetos' | 'renderizados'>('projetos');

  // Query APENAS para obras (para dropdown) - vem do Supabase
  const { data: obras = [] } = useOptimizedSupabaseQuery<any>('OBRAS');

  // Carregar projetos do Google Drive
  useEffect(() => {
    const loadProjectsFromDrive = async () => {
      if (obras.length === 0) return; // Esperar obras carregarem

      setIsLoading(true);
      try {
        console.log('🚀 Inicializando Google Drive...');
        await initializeGoogleDrive();

        console.log('📁 Carregando projetos do Google Drive...');
        const projectFolders = await listProjectFolders();

        // Converter pastas do Drive em objetos VideoItem
        const videosFromDrive = projectFolders.map(folder => {
          // Tentar extrair informações do nome da pasta
          const folderName = folder.name || '';

          return {
            id: folder.id,
            obra_id: '', // Vai ser preenchido pela correlação com obras
            nome: folderName,
            status_renderizacao: 'processando' as const,
            drive_pasta_id: folder.id,
            drive_subpasta_id: folder.id,
            arquivo_original_url: folder.webViewLink,
            created_at: folder.createdTime,
            updated_at: folder.modifiedTime,
            // Tentar encontrar obra relacionada pelo nome
            obra: obras.find(obra => folderName.includes(obra.nome))
          } as VideoItem;
        });

        console.log('✅ Projetos carregados do Drive:', videosFromDrive.length);
        setVideos(videosFromDrive);

      } catch (error) {
        console.error('❌ Erro ao carregar projetos do Drive:', error);
        toast({
          title: "Erro ao carregar projetos",
          description: "Não foi possível carregar os projetos do Google Drive.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectsFromDrive();
  }, [obras, toast]);

  const form = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      obra_id: "",
      nome: "",
    },
  });

  const onSubmit = (data: VideoFormData) => {
    try {
      const novoVideo: VideoItem = {
        id: crypto.randomUUID(),
        obra_id: data.obra_id,
        nome: data.nome,
        status_renderizacao: "pendente",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Apenas atualizar estado local - dados ficam no Google Drive
      const videoComObra = {
        ...novoVideo,
        obra: obras.find(obra => obra.id === novoVideo.obra_id)
      };
      setVideos([...videos, videoComObra]);

      toast({
        title: "Vídeo criado!",
        description: "Agora você pode fazer upload de até 150 fotos para o Google Drive.",
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Erro ao criar vídeo:', error);
      toast({
        title: "Erro ao criar vídeo",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const handleOpenUpload = (video: VideoItem) => {
    setSelectedVideo(video);
    setDriveUploadDialogOpen(true);
  };

  const handleUploadComplete = (photoCount: number) => {
    if (selectedVideo) {
      try {
        // Atualizar apenas estado local - dados ficam no Google Drive
        const updatedVideo = {
          ...selectedVideo,
          status_renderizacao: "processando" as const,
          quantidade_fotos: photoCount,
          updated_at: new Date().toISOString(),
        };

        setVideos(videos.map(video =>
          video.id === selectedVideo.id ? updatedVideo : video
        ));

        toast({
          title: "Upload concluído!",
          description: `${photoCount} fotos foram enviadas. O vídeo está pronto para renderização.`,
        });
      } catch (error) {
        console.error('Erro no upload:', error);
        toast({
          title: "Erro no upload",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive",
        });
      }
    }
  };

  const handleOpenDriveUpload = (video: VideoItem, photos: File[]) => {
    setSelectedVideo(video);
    setUploadedPhotos(photos);
    setDriveUploadDialogOpen(true);
  };

  const handleDriveUploadSuccess = (folderId: string, folderName: string) => {
    if (selectedVideo) {
      try {
        // Atualizar apenas o estado local - dados ficam no Google Drive
        const updatedVideo = {
          ...selectedVideo,
          drive_pasta_id: folderId,
          drive_subpasta_id: folderId,
          status_renderizacao: "processando" as const,
          quantidade_fotos: uploadedPhotos.length,
          arquivo_original_url: `https://drive.google.com/drive/folders/${folderId}`,
          updated_at: new Date().toISOString(),
        };

        setVideos(videos.map(video =>
          video.id === selectedVideo.id ? updatedVideo : video
        ));

        toast({
          title: "Fotos enviadas!",
          description: `${uploadedPhotos.length} fotos foram enviadas para o Google Drive.`,
        });
        setDriveUploadDialogOpen(false);
        setUploadedPhotos([]);
      } catch (error) {
        console.error('Erro ao atualizar registro:', error);
        toast({
          title: "Erro ao atualizar registro",
          description: "Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };


  const handleEdit = (video: VideoItem) => {
    setSelectedVideo(video);
    form.reset({
      obra_id: video.obra_id,
      nome: video.nome,
    });
    setEditOpen(true);
  };

  const handleDelete = async (video: VideoItem) => {
    if (confirm(`Tem certeza que deseja excluir o vídeo "${video.nome}"?\n\nIsso também excluirá a pasta e todas as fotos do Google Drive.`)) {
      try {
        // Primeiro, tentar excluir a pasta do Drive
        let driveDeleteSuccess = true;
        if (video.drive_pasta_id) {
          console.log('🗑️ Excluindo pasta do Drive:', video.drive_pasta_id);
          driveDeleteSuccess = await deleteDriveFolder(video.drive_pasta_id);
        }

        // Remover apenas do estado local - dados ficam no Google Drive
        setVideos(videos.filter(v => v.id !== video.id));

        toast({
          title: "Vídeo excluído!",
          description: driveDeleteSuccess
            ? "O vídeo e a pasta do Google Drive foram removidos com sucesso."
            : "O vídeo foi removido, mas houve um problema ao excluir a pasta do Drive.",
          variant: driveDeleteSuccess ? "default" : "destructive"
        });
      } catch (error) {
        console.error('Erro ao excluir vídeo:', error);
        toast({
          title: "Erro ao excluir vídeo",
          description: "Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditSubmit = (data: VideoFormData) => {
    if (!selectedVideo) return;

    try {
      // Atualizar apenas estado local - dados ficam no Google Drive
      const updatedVideo = {
        ...selectedVideo,
        obra_id: data.obra_id,
        nome: data.nome,
        updated_at: new Date().toISOString(),
        obra: obras.find(obra => obra.id === data.obra_id)
      };

      setVideos(videos.map(video =>
        video.id === selectedVideo.id ? updatedVideo : video
      ));

      toast({
        title: "Vídeo atualizado!",
        description: "As informações foram atualizadas com sucesso.",
      });
      setEditOpen(false);
      setSelectedVideo(null);
    } catch (error) {
      console.error('Erro ao atualizar vídeo:', error);
      toast({
        title: "Erro ao atualizar vídeo",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRenderComplete = async (videoUrl: string) => {
    if (!selectedVideo) return;

    try {
      // Atualizar apenas estado local - dados ficam no Google Drive
      const updatedVideo = {
        ...selectedVideo,
        status_renderizacao: "concluido" as const,
        arquivo_renderizado_url: videoUrl,
        updated_at: new Date().toISOString(),
      };

      setVideos(videos.map(video =>
        video.id === selectedVideo.id ? updatedVideo : video
      ));

      toast({
        title: "Renderização concluída!",
        description: "O vídeo foi processado com sucesso. Redirecionando para vídeos renderizados...",
      });

      // Redirecionar para aba de vídeos renderizados após 2 segundos
      setTimeout(() => {
        setActiveTab('renderizados');
      }, 2000);

    } catch (error) {
      console.error('Erro na renderização:', error);
      toast({
        title: "Erro na renderização",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const handleOpenRender = (video: VideoItem) => {
    setSelectedVideo(video);
    setPhotoManagerOpen(true);
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
                          {obras.filter(obra => obra.id && obra.id !== '').map(obra => (
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

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="dialog-content-mobile">
            <DialogHeader className="dialog-header">
              <DialogTitle>Editar Vídeo</DialogTitle>
              <DialogDescription>
                Atualize as informações do vídeo
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEditSubmit)} className="flex flex-col h-full">
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
                            {obras.filter(obra => obra.id && obra.id !== '').map(obra => (
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
                            placeholder="Descreva como você quer que o vídeo seja gerado..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="form-actions">
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar Alterações</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Navegação por abas */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('projetos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'projetos'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <Upload className="h-4 w-4 inline-block mr-2" />
            Projetos e Upload
          </button>
          <button
            onClick={() => setActiveTab('renderizados')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'renderizados'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <PlayCircle className="h-4 w-4 inline-block mr-2" />
            Vídeos Renderizados
          </button>
        </nav>
      </div>

      {/* Conteúdo da aba ativa */}
      {activeTab === 'projetos' && (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            <p className="text-xs text-muted-foreground mt-1">aguardando upload</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Upload Realizado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {videos.filter(v => v.status_renderizacao === "processando").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">pronto p/ renderizar</p>
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
                    {video.status_renderizacao === "processando" && video.quantidade_fotos && (
                      <div className="space-y-1 mb-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Processando</span>
                          <span className="font-semibold">{video.quantidade_fotos} fotos</span>
                        </div>
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-1">
                      <span>Data: {new Date(video.created_at || Date.now()).toLocaleDateString('pt-BR')}</span>
                      {video.quantidade_fotos !== undefined && (
                        <>
                          <span>•</span>
                          <span>Fotos: {video.quantidade_fotos}</span>
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
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenUpload(video)}
                        className="w-full sm:w-auto"
                      >
                        <Upload className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Upload Fotos</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(video)}
                        className="w-full sm:w-auto"
                      >
                        <Edit className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(video)}
                        className="w-full sm:w-auto text-destructive hover:text-destructive"
                      >
                        <Trash className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Excluir</span>
                      </Button>
                    </>
                  )}
                  {video.status_renderizacao === "processando" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenRender(video)}
                        className="w-full sm:w-auto"
                      >
                        <PlayCircle className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Renderizar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(video)}
                        className="w-full sm:w-auto"
                      >
                        <Edit className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(video)}
                        className="w-full sm:w-auto text-destructive hover:text-destructive"
                      >
                        <Trash className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Excluir</span>
                      </Button>
                    </>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(video)}
                        className="w-full sm:w-auto text-destructive hover:text-destructive"
                      >
                        <Trash className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Excluir</span>
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
        </>
      )}

      {/* Aba de vídeos renderizados */}
      {activeTab === 'renderizados' && (
        <RenderedVideos />
      )}

      {/* Dialogs (sempre disponíveis) */}
      {selectedVideo && (
        <>
          <PhotoManager
            open={photoManagerOpen}
            onOpenChange={setPhotoManagerOpen}
            videoId={selectedVideo.id}
            obraName={selectedVideo.obra?.nome || 'Obra não encontrada'}
            driveFolderId={selectedVideo.drive_pasta_id}
            driveSubFolderId={selectedVideo.drive_subpasta_id}
            currentPhotoCount={selectedVideo.quantidade_fotos || 0}
            onRenderComplete={handleRenderComplete}
          />

          <GoogleDriveUpload
            open={driveUploadDialogOpen}
            onOpenChange={setDriveUploadDialogOpen}
            videoId={selectedVideo.id}
            projectName={selectedVideo.obra?.nome || 'Obra'}
            videoPrompt={selectedVideo.nome}
            photos={uploadedPhotos}
            onPhotosChange={setUploadedPhotos}
            onSuccess={handleDriveUploadSuccess}
          />
        </>
      )}
    </div>
  );
};

export default Videos;
