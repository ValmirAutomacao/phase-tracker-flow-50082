import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Navigation,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Shield
} from 'lucide-react';
import { useGeolocalizacao } from '@/hooks/useGeolocalizacao';

interface StatusGeolocalizacaoProps {
  mostrarDetalhes?: boolean;
  onLocalizacaoObtida?: (localizacao: any) => void;
}

export function StatusGeolocalizacao({
  mostrarDetalhes = true,
  onLocalizacaoObtida
}: StatusGeolocalizacaoProps) {
  const {
    status,
    localizacaoAtual,
    erro,
    gpsDisponivel,
    permissaoNegada,
    carregando,
    estaEmAreaPermitida,
    solicitarPermissoes,
    obterLocalizacao,
    coordenadasFormatadas,
    linkGoogleMaps,
  } = useGeolocalizacao();

  const handleObterLocalizacao = async () => {
    const localizacao = await obterLocalizacao();
    if (localizacao && onLocalizacaoObtida) {
      onLocalizacaoObtida(localizacao);
    }
  };

  const renderStatusBadge = () => {
    if (!gpsDisponivel) {
      return <Badge variant="secondary">GPS Indisponível</Badge>;
    }

    if (permissaoNegada) {
      return <Badge variant="destructive">Permissão Negada</Badge>;
    }

    if (carregando) {
      return (
        <Badge variant="outline">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Obtendo localização...
        </Badge>
      );
    }

    if (localizacaoAtual) {
      if (estaEmAreaPermitida) {
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Local Permitido
          </Badge>
        );
      } else {
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Fora da Área Permitida
          </Badge>
        );
      }
    }

    return <Badge variant="outline">Aguardando</Badge>;
  };

  const renderPermissaoAlert = () => {
    if (!gpsDisponivel) {
      return (
        <Alert>
          <Navigation className="h-4 w-4" />
          <AlertDescription>
            Geolocalização não está disponível neste navegador. O registro será feito sem localização.
          </AlertDescription>
        </Alert>
      );
    }

    if (permissaoNegada) {
      return (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Permissão de localização negada. Para registrar com localização, habilite a permissão nas configurações do navegador e recarregue a página.
          </AlertDescription>
        </Alert>
      );
    }

    if (status.permissaoStatus === 'prompt') {
      return (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            Clique em "Obter Localização" para permitir acesso à sua localização.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  const renderErroAlert = () => {
    if (!erro) return null;

    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{erro}</AlertDescription>
      </Alert>
    );
  };

  const renderLocalizacaoInfo = () => {
    if (!localizacaoAtual || !mostrarDetalhes) return null;

    const coordenadas = coordenadasFormatadas(localizacaoAtual);
    const mapLink = linkGoogleMaps(localizacaoAtual);

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2 text-sm">
          {localizacaoAtual.endereco && (
            <div>
              <span className="font-medium">Endereço:</span>
              <p className="text-muted-foreground">{localizacaoAtual.endereco}</p>
            </div>
          )}

          <div>
            <span className="font-medium">Coordenadas:</span>
            <p className="text-muted-foreground font-mono">{coordenadas}</p>
          </div>

          <div>
            <span className="font-medium">Precisão:</span>
            <span className="text-muted-foreground ml-1">
              ±{Math.round(localizacaoAtual.precisao)}m
            </span>
          </div>

          {localizacaoAtual.distanciaParaSede !== undefined && (
            <div>
              <span className="font-medium">Distância da sede:</span>
              <span className="text-muted-foreground ml-1">
                {localizacaoAtual.distanciaParaSede}m
              </span>
            </div>
          )}
        </div>

        {mapLink && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(mapLink, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Ver no Mapa
          </Button>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Localização
          </CardTitle>
          {renderStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {renderPermissaoAlert()}
        {renderErroAlert()}

        {gpsDisponivel && !permissaoNegada && (
          <div className="flex gap-2">
            {status.permissaoStatus === 'prompt' && (
              <Button
                onClick={solicitarPermissoes}
                variant="outline"
                size="sm"
                disabled={carregando}
              >
                <Shield className="h-3 w-3 mr-1" />
                Permitir Localização
              </Button>
            )}

            {status.permissaoStatus === 'granted' && (
              <Button
                onClick={handleObterLocalizacao}
                variant="outline"
                size="sm"
                disabled={carregando}
              >
                {carregando ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Navigation className="h-3 w-3 mr-1" />
                )}
                {carregando ? 'Obtendo...' : 'Obter Localização'}
              </Button>
            )}
          </div>
        )}

        {renderLocalizacaoInfo()}

        {localizacaoAtual && !estaEmAreaPermitida && mostrarDetalhes && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Você está fora da área permitida para registro de ponto.
              {localizacaoAtual.distanciaParaSede &&
                ` Você está a ${localizacaoAtual.distanciaParaSede}m da sede.`}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}