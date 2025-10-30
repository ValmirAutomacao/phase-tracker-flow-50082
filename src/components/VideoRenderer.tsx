import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Square, Video, Sparkles, Clock, CheckCircle } from "lucide-react";

interface VideoRendererProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  obraName: string;
  photoCount: number;
  prompt: string;
  onRenderComplete: (videoData: { duration: string; size: string; url: string }) => void;
}

interface RenderStage {
  name: string;
  description: string;
  progress: number;
  status: "pending" | "active" | "completed";
}

export function VideoRenderer({
  open,
  onOpenChange,
  videoId,
  obraName,
  photoCount,
  prompt,
  onRenderComplete
}: VideoRendererProps) {
  const { toast } = useToast();
  const [rendering, setRendering] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [stages, setStages] = useState<RenderStage[]>([
    {
      name: "Análise das Fotos",
      description: "Analisando e organizando as fotos enviadas",
      progress: 0,
      status: "pending"
    },
    {
      name: "Processamento IA",
      description: "Aplicando inteligência artificial baseada no prompt",
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
      description: "Compilando o vídeo final em alta qualidade",
      progress: 0,
      status: "pending"
    },
    {
      name: "Finalização",
      description: "Salvando no Google Drive e preparando para download",
      progress: 0,
      status: "pending"
    }
  ]);

  const simulateRender = async () => {
    setRendering(true);

    for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
      setCurrentStage(stageIndex);

      // Marcar estágio atual como ativo
      setStages(prev => prev.map((stage, index) => ({
        ...stage,
        status: index === stageIndex ? "active" : index < stageIndex ? "completed" : "pending"
      })));

      // Simular progresso do estágio
      for (let progress = 0; progress <= 100; progress += 5) {
        await new Promise(resolve => setTimeout(resolve, 100));

        setStages(prev => prev.map((stage, index) =>
          index === stageIndex ? { ...stage, progress } : stage
        ));

        // Atualizar progresso geral
        const stageWeight = 100 / stages.length;
        const stageProgress = (progress / 100) * stageWeight;
        const previousStagesProgress = stageIndex * stageWeight;
        setOverallProgress(previousStagesProgress + stageProgress);
      }

      // Marcar estágio como completo
      setStages(prev => prev.map((stage, index) =>
        index === stageIndex ? { ...stage, status: "completed" } : stage
      ));
    }

    // Simular dados do vídeo final
    const videoData = {
      duration: "24s",
      size: "8.7 MB",
      url: `/videos/${videoId}.mp4`
    };

    toast({
      title: "Vídeo renderizado com sucesso!",
      description: `O vídeo da obra "${obraName}" está pronto para visualização e download.`,
    });

    onRenderComplete(videoData);
    setRendering(false);
    onOpenChange(false);
  };

  const resetState = () => {
    setRendering(false);
    setCurrentStage(0);
    setOverallProgress(0);
    setStages(prev => prev.map(stage => ({
      ...stage,
      progress: 0,
      status: "pending"
    })));
  };

  const handleClose = () => {
    if (!rendering) {
      resetState();
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Renderizar Vídeo - {obraName}
          </DialogTitle>
          <DialogDescription>
            Iniciar o processamento automático do vídeo usando as {photoCount} fotos enviadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Informações do vídeo */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">Configurações do Vídeo</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Obra:</span>
                <p className="font-medium">{obraName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fotos:</span>
                <p className="font-medium">{photoCount} imagens</p>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Prompt:</span>
              <p className="text-sm mt-1 p-2 bg-background rounded border italic">
                "{prompt}"
              </p>
            </div>
          </div>

          {/* Progresso geral */}
          {rendering && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Progresso Geral</span>
                <span className="text-sm font-mono">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="w-full h-3" />
            </div>
          )}

          {/* Estágios de renderização */}
          <div className="space-y-3">
            <h4 className="font-medium">Estágios de Processamento</h4>
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
                      <Badge variant={
                        stage.status === "completed" ? "default" :
                        stage.status === "active" ? "secondary" :
                        "outline"
                      }>
                        {stage.status === "completed" ? "Concluído" :
                         stage.status === "active" ? "Processando" :
                         "Aguardando"}
                      </Badge>
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

          {/* Informações técnicas */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-blue-900">Automação N8N</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Endpoint: <code className="bg-blue-100 px-1 rounded">POST /api/videos/{videoId}/render</code></p>
              <p>• Monitoramento: <code className="bg-blue-100 px-1 rounded">GET /api/videos/{videoId}/status</code></p>
              <p>• Webhook de conclusão configurado para atualizar status em tempo real</p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={rendering}
            >
              {rendering ? "Processando..." : "Cancelar"}
            </Button>
            <Button
              onClick={simulateRender}
              disabled={rendering}
            >
              {rendering ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
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