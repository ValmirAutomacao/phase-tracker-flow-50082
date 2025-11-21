import { useState, useEffect, useCallback } from 'react';
import {
  geolocalizacaoService,
  StatusGeolocalizacao,
  LocalizacaoCompleta,
  Coordenadas
} from '@/services/geolocalizacao';

/**
 * Hook para gerenciar geolocalização no registro de ponto
 */
export function useGeolocalizacao() {
  const [status, setStatus] = useState<StatusGeolocalizacao>({
    permissaoStatus: 'prompt',
    gpsDisponivel: false,
    carregando: false,
  });

  const [localizacaoAtual, setLocalizacaoAtual] = useState<LocalizacaoCompleta | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Inicializar serviço na montagem do componente
  useEffect(() => {
    const inicializar = async () => {
      try {
        await geolocalizacaoService.inicializar();
      } catch (error) {
        console.error('Erro ao inicializar geolocalização:', error);
        setErro('Erro ao inicializar geolocalização');
      }
    };

    inicializar();

    // Adicionar observador para mudanças de status
    const handleStatusChange = (novoStatus: StatusGeolocalizacao) => {
      setStatus(novoStatus);
      if (novoStatus.erro) {
        setErro(novoStatus.erro);
      } else {
        setErro(null);
      }
    };

    geolocalizacaoService.adicionarObservador(handleStatusChange);

    // Cleanup
    return () => {
      geolocalizacaoService.removerObservador(handleStatusChange);
    };
  }, []);

  /**
   * Solicita permissões de geolocalização
   */
  const solicitarPermissoes = useCallback(async (): Promise<boolean> => {
    try {
      setErro(null);
      return await geolocalizacaoService.solicitarPermissoes();
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao solicitar permissões';
      setErro(mensagem);
      return false;
    }
  }, []);

  /**
   * Obtém localização atual
   */
  const obterLocalizacao = useCallback(async (opcoes?: {
    altaPrecisao?: boolean;
    timeout?: number;
  }): Promise<LocalizacaoCompleta | null> => {
    try {
      setErro(null);
      const localizacao = await geolocalizacaoService.obterLocalizacaoAtual(opcoes);
      setLocalizacaoAtual(localizacao);
      return localizacao;
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao obter localização';
      setErro(mensagem);
      setLocalizacaoAtual(null);
      return null;
    }
  }, []);

  /**
   * Verifica se localização está em área permitida
   */
  const estaEmAreaPermitida = useCallback((): boolean => {
    return localizacaoAtual?.dentroDoRaioPermitido ?? false;
  }, [localizacaoAtual]);

  /**
   * Obter coordenadas formatadas para exibição
   */
  const coordenadasFormatadas = useCallback((coordenadas?: Coordenadas): string | null => {
    if (!coordenadas) return null;
    return geolocalizacaoService.formatarCoordenadas(coordenadas);
  }, []);

  /**
   * Gerar link do Google Maps
   */
  const linkGoogleMaps = useCallback((coordenadas?: Coordenadas): string | null => {
    if (!coordenadas) return null;
    return geolocalizacaoService.gerarLinkMapa(coordenadas);
  }, []);

  /**
   * Limpar localização atual
   */
  const limparLocalizacao = useCallback(() => {
    setLocalizacaoAtual(null);
    setErro(null);
  }, []);

  return {
    // Estado
    status,
    localizacaoAtual,
    erro,

    // Estados derivados
    gpsDisponivel: status.gpsDisponivel,
    permissaoNegada: status.permissaoStatus === 'denied',
    carregando: status.carregando,
    estaEmAreaPermitida: estaEmAreaPermitida(),

    // Ações
    solicitarPermissoes,
    obterLocalizacao,
    limparLocalizacao,

    // Utilitários
    coordenadasFormatadas,
    linkGoogleMaps,
  };
}