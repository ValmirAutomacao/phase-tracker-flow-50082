import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MapPin,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Info
} from 'lucide-react';

interface LocalizacaoRegistroProps {
  registro: {
    localizacao_gps?: string;
    endereco_registro?: string;
    precisao_gps?: number;
    dentro_area_permitida?: boolean;
    distancia_sede?: number;
  };
  compacto?: boolean;
}

export function LocalizacaoRegistro({ registro, compacto = false }: LocalizacaoRegistroProps) {
  const temLocalizacao = !!registro.localizacao_gps;

  if (!temLocalizacao) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <MapPin className="h-3 w-3" />
        <span className="text-xs">Sem localização</span>
      </div>
    );
  }

  const [latitude, longitude] = registro.localizacao_gps!.split(',').map(Number);
  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  const renderStatusBadge = () => {
    if (registro.dentro_area_permitida === undefined) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Info className="h-3 w-3 mr-1" />
          Não verificado
        </Badge>
      );
    }

    if (registro.dentro_area_permitida) {
      return (
        <Badge variant="default" className="bg-green-500 text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Permitido
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Fora da área
      </Badge>
    );
  };

  const formatarCoordenadas = (lat: number, lng: number): string => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  if (compacto) {
    return (
      <div className="flex items-center gap-2">
        {renderStatusBadge()}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => window.open(googleMapsUrl, '_blank')}
            >
              <MapPin className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">Localização do registro</p>
              <p className="text-xs">{formatarCoordenadas(latitude, longitude)}</p>
              {registro.endereco_registro && (
                <p className="text-xs">{registro.endereco_registro}</p>
              )}
              {registro.distancia_sede !== undefined && (
                <p className="text-xs">Distância: {registro.distancia_sede}m da sede</p>
              )}
              {registro.precisao_gps && (
                <p className="text-xs">Precisão: ±{registro.precisao_gps}m</p>
              )}
              <p className="text-xs text-muted-foreground">Clique para ver no mapa</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span className="font-medium text-sm">Localização</span>
        </div>
        {renderStatusBadge()}
      </div>

      {registro.endereco_registro && (
        <div>
          <p className="text-sm text-muted-foreground">Endereço:</p>
          <p className="text-sm">{registro.endereco_registro}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
        <div>
          <span className="font-medium">Coordenadas:</span>
          <span className="ml-1 font-mono">{formatarCoordenadas(latitude, longitude)}</span>
        </div>

        {registro.precisao_gps && (
          <div>
            <span className="font-medium">Precisão:</span>
            <span className="ml-1">±{registro.precisao_gps}m</span>
          </div>
        )}

        {registro.distancia_sede !== undefined && (
          <div>
            <span className="font-medium">Distância da sede:</span>
            <span className="ml-1">{registro.distancia_sede}m</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => window.open(googleMapsUrl, '_blank')}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Ver no Mapa
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => {
            navigator.clipboard.writeText(formatarCoordenadas(latitude, longitude));
          }}
        >
          <Navigation className="h-3 w-3 mr-1" />
          Copiar Coords
        </Button>
      </div>
    </div>
  );
}