import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Play, Download, Share2, Trash2, Calendar, Clock, HardDrive,
  Video, ExternalLink, Copy, CheckCircle, AlertCircle
} from "lucide-react";
import type { RenderedVideo } from '@/types/renderedVideo';

interface RenderedVideosProps {
  className?: string;
}

export function RenderedVideos({ className }: RenderedVideosProps) {
  const { toast } = useToast();
  const [videos, setVideos] = useState<RenderedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<RenderedVideo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<RenderedVideo | null>(null);

  // Carregar vídeos renderizados do Supabase
  const loadRenderedVideos = async () => {
    try {
      setLoading(true);
      console.log('📺 Carregando vídeos renderizados...');

      const { supabase } = await import('@/lib/supabaseClient');
      const { data, error } = await supabase
        .from('videos_renderizados')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar vídeos:', error);
        toast({
          title: "Erro ao carregar vídeos",
          description: "Não foi possível carregar os vídeos renderizados",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Vídeos carregados:', data?.length || 0);
      setVideos(data || []);

    } catch (error) {
      console.error('❌ Erro inesperado ao carregar vídeos:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente recarregar a página",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Deletar vídeo
  const deleteVideo = async (video: RenderedVideo) => {
    try {
      console.log('🗑️ Deletando vídeo:', video.id);

      const { supabase } = await import('@/lib/supabaseClient');
      const { error } = await supabase
        .from('videos_renderizados')
        .delete()
        .eq('id', video.id);

      if (error) {
        console.error('❌ Erro ao deletar vídeo:', error);
        toast({
          title: "Erro ao excluir vídeo",
          description: "Não foi possível excluir o vídeo",
          variant: "destructive"
        });
        return;
      }

      // Atualizar lista local
      setVideos(prev => prev.filter(v => v.id !== video.id));

      toast({
        title: "Vídeo excluído",
        description: `O vídeo "${video.project_name}" foi removido com sucesso`,
      });

      console.log('✅ Vídeo deletado com sucesso');

    } catch (error) {
      console.error('❌ Erro inesperado ao deletar:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    }
  };

  // Copiar link para compartilhar
  const shareVideo = async (video: RenderedVideo) => {
    try {
      await navigator.clipboard.writeText(video.video_url);
      toast({
        title: "Link copiado!",
        description: "O link do vídeo foi copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar link",
        description: "Tente copiar manualmente o link do vídeo",
        variant: "destructive"
      });
    }
  };

  // Download do vídeo
  const downloadVideo = (video: RenderedVideo) => {
    window.open(video.video_url, '_blank');
  };

  // Abrir vídeo para visualização
  const openVideo = (video: RenderedVideo) => {
    setSelectedVideo(video);
  };

  // Confirmar exclusão
  const confirmDelete = (video: RenderedVideo) => {
    setVideoToDelete(video);
    setDeleteDialogOpen(true);
  };

  // Formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data não disponível';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  // Carregar vídeos na montagem
  useEffect(() => {
    loadRenderedVideos();
  }, []);

  if (loading) {
    return (
      <div className={`space-y-4 ${className || ''}`}>
        <div className="text-center py-8">
          <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando vídeos renderizados...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={`space-y-4 ${className || ''}`}>
        <div className="text-center py-8">
          <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum vídeo renderizado</h3>
          <p className="text-muted-foreground">
            Os vídeos processados via automação N8N aparecerão aqui
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Vídeos Renderizados</h2>
          <p className="text-sm text-muted-foreground">
            {videos.length} vídeo(s) processado(s) via automação N8N
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadRenderedVideos}
          disabled={loading}
        >
          Atualizar
        </Button>
      </div>

      {/* Grid de vídeos */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <Card key={video.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base line-clamp-1" title={video.project_name || 'Projeto sem nome'}>
                    {video.project_name || 'Projeto sem nome'}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(video.created_at)}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={
                    video.status === 'completed'
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : video.status === 'failed'
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                  }
                >
                  {video.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {video.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                  {video.status === 'processing' && <Clock className="h-3 w-3 mr-1" />}
                  {video.status === 'completed' ? 'Concluído' :
                   video.status === 'failed' ? 'Falhou' : 'Processando'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Preview do vídeo */}
              <div
                className="aspect-video bg-muted rounded-lg flex items-center justify-center cursor-pointer group-hover:bg-muted/80 transition-colors border-2 border-dashed border-border"
                onClick={() => openVideo(video)}
              >
                <div className="text-center">
                  <Play className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Clique para assistir</p>
                </div>
              </div>

              {/* Metadados */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    Tamanho:
                  </span>
                  <span className="font-medium">{video.file_size || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Duração:
                  </span>
                  <span className="font-medium">{video.duration || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>ID:</span>
                  <span className="font-mono text-xs">{video.video_id}</span>
                </div>
              </div>

              {/* Ações */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openVideo(video)}
                  disabled={!video.video_url}
                >
                  <Play className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareVideo(video)}
                  disabled={!video.video_url}
                >
                  <Share2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => confirmDelete(video)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de visualização do vídeo */}
      {selectedVideo && (
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                {selectedVideo.project_name}
              </DialogTitle>
              <DialogDescription>
                Vídeo renderizado via automação N8N • {formatDate(selectedVideo.created_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Player de vídeo */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  controls
                  className="w-full h-full"
                  src={selectedVideo.video_url}
                  poster={undefined}
                >
                  Seu navegador não suporta reprodução de vídeos.
                </video>
              </div>

              {/* Informações do vídeo */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Tamanho</p>
                  <p>{selectedVideo.file_size || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Duração</p>
                  <p>{selectedVideo.duration || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Status</p>
                  <p className="capitalize">{selectedVideo.status}</p>
                </div>
              </div>

              {/* Ações do vídeo */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => shareVideo(selectedVideo)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadVideo(selectedVideo)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedVideo.video_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir em Nova Aba
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Vídeo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o vídeo "{videoToDelete?.project_name}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => videoToDelete && deleteVideo(videoToDelete)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}