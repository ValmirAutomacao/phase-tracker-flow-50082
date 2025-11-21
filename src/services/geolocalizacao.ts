/**
 * Serviço de Geolocalização para Registro de Ponto
 * Implementa captura segura de localização com fallbacks e validação
 */

export interface Coordenadas {
  latitude: number;
  longitude: number;
  precisao: number; // em metros
  timestamp: number;
}

export interface LocalizacaoCompleta extends Coordenadas {
  endereco?: string;
  dentroDoRaioPermitido: boolean;
  distanciaParaSede?: number; // em metros
}

export interface LocalPermitido {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  raioPermitido: number; // em metros
  ativo: boolean;
  tipo: 'sede' | 'obra' | 'cliente' | 'home_office';
}

export interface StatusGeolocalizacao {
  permissaoStatus: 'granted' | 'denied' | 'prompt' | 'unavailable';
  gpsDisponivel: boolean;
  carregando: boolean;
  erro?: string;
  ultimaLocalizacao?: LocalizacaoCompleta;
}

class GeolocalizacaoService {
  private locaisPermitidos: LocalPermitido[] = [];
  private observadores: ((status: StatusGeolocalizacao) => void)[] = [];
  private statusAtual: StatusGeolocalizacao = {
    permissaoStatus: 'prompt',
    gpsDisponivel: false,
    carregando: false,
  };

  /**
   * Inicializa o serviço e carrega locais permitidos
   */
  async inicializar(): Promise<void> {
    this.verificarDisponibilidadeGPS();
    await this.carregarLocaisPermitidos();
    await this.verificarPermissoes();
  }

  /**
   * Verifica se geolocalização está disponível no navegador
   */
  private verificarDisponibilidadeGPS(): void {
    this.statusAtual.gpsDisponivel = 'geolocation' in navigator;
    if (!this.statusAtual.gpsDisponivel) {
      this.statusAtual.erro = 'Geolocalização não disponível neste navegador';
    }
    this.notificarObservadores();
  }

  /**
   * Verifica permissões atuais do navegador
   */
  async verificarPermissoes(): Promise<void> {
    if (!this.statusAtual.gpsDisponivel) return;

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      this.statusAtual.permissaoStatus = permission.state;

      // Escutar mudanças na permissão
      permission.addEventListener('change', () => {
        this.statusAtual.permissaoStatus = permission.state;
        this.notificarObservadores();
      });

      this.notificarObservadores();
    } catch (error) {
      console.warn('Não foi possível verificar permissões de geolocalização:', error);
    }
  }

  /**
   * Carrega locais permitidos do banco de dados
   */
  private async carregarLocaisPermitidos(): Promise<void> {
    try {
      // TODO: Implementar busca no Supabase
      // Por enquanto, usar dados mock da sede principal
      this.locaisPermitidos = [
        {
          id: '1',
          nome: 'Sede Principal - SecEngenharia',
          latitude: -23.5505, // São Paulo - exemplo
          longitude: -46.6333,
          raioPermitido: 200, // 200 metros
          ativo: true,
          tipo: 'sede'
        }
      ];
    } catch (error) {
      console.error('Erro ao carregar locais permitidos:', error);
    }
  }

  /**
   * Captura localização atual com alta precisão
   */
  async obterLocalizacaoAtual(opcoes: {
    altaPrecisao?: boolean;
    timeout?: number;
    tentativas?: number;
  } = {}): Promise<LocalizacaoCompleta> {
    const {
      altaPrecisao = true,
      timeout = 15000,
      tentativas = 3
    } = opcoes;

    if (!this.statusAtual.gpsDisponivel) {
      throw new Error('Geolocalização não disponível');
    }

    this.statusAtual.carregando = true;
    this.notificarObservadores();

    try {
      const coordenadas = await this.tentarObterCoordenadas({
        enableHighAccuracy: altaPrecisao,
        timeout,
        maximumAge: 30000, // Cache de 30 segundos
      }, tentativas);

      const localizacao = await this.processarCoordenadas(coordenadas);

      this.statusAtual.ultimaLocalizacao = localizacao;
      this.statusAtual.erro = undefined;

      return localizacao;
    } catch (error) {
      this.statusAtual.erro = this.interpretarErroGPS(error);
      throw error;
    } finally {
      this.statusAtual.carregando = false;
      this.notificarObservadores();
    }
  }

  /**
   * Tenta obter coordenadas com retry automático
   */
  private tentarObterCoordenadas(
    opcoes: PositionOptions,
    tentativasRestantes: number
  ): Promise<Coordenadas> {
    return new Promise((resolve, reject) => {
      const sucesso = (position: GeolocationPosition) => {
        const coords = position.coords;
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          precisao: coords.accuracy,
          timestamp: position.timestamp,
        });
      };

      const erro = (error: GeolocationPositionError) => {
        console.warn(`Tentativa de geolocalização falhou:`, error);

        if (tentativasRestantes > 1) {
          // Tentar novamente com precisão reduzida
          const novasOpcoes = {
            ...opcoes,
            enableHighAccuracy: false,
            timeout: opcoes.timeout ? opcoes.timeout / 2 : 7500,
          };

          setTimeout(() => {
            this.tentarObterCoordenadas(novasOpcoes, tentativasRestantes - 1)
              .then(resolve)
              .catch(reject);
          }, 1000);
        } else {
          reject(error);
        }
      };

      navigator.geolocation.getCurrentPosition(sucesso, erro, opcoes);
    });
  }

  /**
   * Processa coordenadas e adiciona informações extras
   */
  private async processarCoordenadas(coordenadas: Coordenadas): Promise<LocalizacaoCompleta> {
    // Verificar se está em local permitido
    const validacao = this.validarLocalPermitido(coordenadas);

    // Tentar obter endereço via geocoding reverso
    let endereco: string | undefined;
    try {
      endereco = await this.obterEnderecoReverso(coordenadas);
    } catch (error) {
      console.warn('Falha no geocoding reverso:', error);
    }

    return {
      ...coordenadas,
      endereco,
      dentroDoRaioPermitido: validacao.permitido,
      distanciaParaSede: validacao.distanciaMinima,
    };
  }

  /**
   * Valida se coordenadas estão em local permitido
   */
  private validarLocalPermitido(coordenadas: Coordenadas): {
    permitido: boolean;
    localMaisProximo?: LocalPermitido;
    distanciaMinima: number;
  } {
    if (this.locaisPermitidos.length === 0) {
      return { permitido: true, distanciaMinima: 0 };
    }

    let distanciaMinima = Infinity;
    let localMaisProximo: LocalPermitido | undefined;

    for (const local of this.locaisPermitidos) {
      if (!local.ativo) continue;

      const distancia = this.calcularDistancia(
        coordenadas.latitude,
        coordenadas.longitude,
        local.latitude,
        local.longitude
      );

      if (distancia < distanciaMinima) {
        distanciaMinima = distancia;
        localMaisProximo = local;
      }
    }

    const permitido = localMaisProximo
      ? distanciaMinima <= localMaisProximo.raioPermitido
      : false;

    return {
      permitido,
      localMaisProximo,
      distanciaMinima: Math.round(distanciaMinima),
    };
  }

  /**
   * Calcula distância entre duas coordenadas (fórmula de Haversine)
   */
  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(graus: number): number {
    return graus * (Math.PI / 180);
  }

  /**
   * Geocoding reverso para obter endereço legível
   */
  private async obterEnderecoReverso(coordenadas: Coordenadas): Promise<string> {
    // Usando serviço público do OpenStreetMap (Nominatim)
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${coordenadas.latitude}&lon=${coordenadas.longitude}&format=json&addressdetails=1`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SecEngenharia-PontoApp/1.0'
        }
      });

      if (!response.ok) {
        throw new Error('Falha na consulta de geocoding');
      }

      const data = await response.json();
      return this.formatarEndereco(data);
    } catch (error) {
      console.warn('Erro no geocoding reverso:', error);
      return `${coordenadas.latitude.toFixed(6)}, ${coordenadas.longitude.toFixed(6)}`;
    }
  }

  /**
   * Formata endereço retornado pelo geocoding
   */
  private formatarEndereco(data: any): string {
    if (!data || !data.address) {
      return 'Endereço não encontrado';
    }

    const addr = data.address;
    const partes: string[] = [];

    if (addr.road) partes.push(addr.road);
    if (addr.house_number) partes[partes.length - 1] += `, ${addr.house_number}`;
    if (addr.suburb || addr.neighbourhood) partes.push(addr.suburb || addr.neighbourhood);
    if (addr.city || addr.town || addr.village) partes.push(addr.city || addr.town || addr.village);
    if (addr.state) partes.push(addr.state);

    return partes.join(', ') || 'Endereço não identificado';
  }

  /**
   * Interpreta erros da API de geolocalização
   */
  private interpretarErroGPS(error: any): string {
    if (error instanceof GeolocationPositionError) {
      switch (error.code) {
        case GeolocationPositionError.PERMISSION_DENIED:
          return 'Permissão de localização negada. Habilite nas configurações do navegador.';
        case GeolocationPositionError.POSITION_UNAVAILABLE:
          return 'Localização não disponível. Verifique se o GPS está ativo.';
        case GeolocationPositionError.TIMEOUT:
          return 'Tempo esgotado para obter localização. Tente novamente.';
        default:
          return 'Erro desconhecido na geolocalização.';
      }
    }
    return error.message || 'Erro na geolocalização';
  }

  /**
   * Adiciona observador para mudanças de status
   */
  adicionarObservador(callback: (status: StatusGeolocalizacao) => void): void {
    this.observadores.push(callback);
    // Enviar status atual imediatamente
    callback(this.statusAtual);
  }

  /**
   * Remove observador
   */
  removerObservador(callback: (status: StatusGeolocalizacao) => void): void {
    this.observadores = this.observadores.filter(obs => obs !== callback);
  }

  /**
   * Notifica todos os observadores sobre mudanças de status
   */
  private notificarObservadores(): void {
    this.observadores.forEach(callback => {
      try {
        callback(this.statusAtual);
      } catch (error) {
        console.error('Erro ao notificar observador de geolocalização:', error);
      }
    });
  }

  /**
   * Obter status atual
   */
  obterStatus(): StatusGeolocalizacao {
    return { ...this.statusAtual };
  }

  /**
   * Solicitar permissões de forma amigável
   */
  async solicitarPermissoes(): Promise<boolean> {
    if (!this.statusAtual.gpsDisponivel) {
      return false;
    }

    try {
      // Tentar obter localização (isso irá solicitar permissão)
      await this.obterLocalizacaoAtual({ timeout: 10000 });
      return true;
    } catch (error) {
      this.statusAtual.erro = this.interpretarErroGPS(error);
      this.notificarObservadores();
      return false;
    }
  }

  /**
   * Formatar coordenadas para exibição
   */
  formatarCoordenadas(coordenadas: Coordenadas): string {
    return `${coordenadas.latitude.toFixed(6)}, ${coordenadas.longitude.toFixed(6)}`;
  }

  /**
   * Gerar link para Google Maps
   */
  gerarLinkMapa(coordenadas: Coordenadas): string {
    return `https://www.google.com/maps?q=${coordenadas.latitude},${coordenadas.longitude}`;
  }
}

// Instância singleton do serviço
export const geolocalizacaoService = new GeolocalizacaoService();