import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Calendar,
  User,
  Building2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  FileText,
  Download
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  TipoRegistroPonto,
  TIPO_REGISTRO_LABELS,
  TIPO_REGISTRO_COLORS,
  DIAS_SEMANA,
  MESES_EXTENSO,
  FuncionarioCompleto,
  RegistroPonto
} from "@/types/ponto";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { verificarSenhaPonto } from "@/services/authPonto";
import { gerarComprovantePDF, baixarComprovantePDF } from "@/services/comprovantePonto";
import { StatusGeolocalizacao } from "@/components/ponto/StatusGeolocalizacao";
import { LocalizacaoCompleta } from "@/services/geolocalizacao";

export default function RegistroPonto() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [funcionario, setFuncionario] = useState<FuncionarioCompleto | null>(null);
  const [registrosHoje, setRegistrosHoje] = useState<RegistroPonto[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoRegistroPonto | null>(null);
  const [senhaInput, setSenhaInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [comprovantes, setComprovantes] = useState<any[]>([]);
  const [localizacaoAtual, setLocalizacaoAtual] = useState<LocalizacaoCompleta | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Carregar dados do funcionário
  useEffect(() => {
    if (user) {
      carregarDadosFuncionario();
    }
  }, [user]);

  // Carregar registros quando funcionário estiver carregado
  useEffect(() => {
    if (funcionario) {
      carregarRegistrosHoje();
      carregarComprovantes();
    }
  }, [funcionario]);

  const carregarDadosFuncionario = async () => {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select(`
          *,
          funcao:funcoes (
            id,
            nome,
            setor:setores (
              id,
              nome
            )
          ),
          jornada:jornadas_trabalho (*)
        `)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setFuncionario(data);
    } catch (error) {
      console.error('Erro ao carregar funcionário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus dados",
        variant: "destructive",
      });
    }
  };

  const carregarRegistrosHoje = async () => {
    if (!funcionario) return;

    try {
      const hoje = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('registros_ponto')
        .select('*')
        .eq('funcionario_id', funcionario.id)
        .eq('data_registro', hoje)
        .order('hora_registro');

      if (error) throw error;
      setRegistrosHoje(data || []);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  const carregarComprovantes = async () => {
    if (!funcionario) return;

    try {
      const { data, error } = await supabase
        .from('comprovantes_ponto')
        .select('*')
        .eq('funcionario_id', funcionario.id)
        .order('data_emissao', { ascending: false })
        .limit(10);

      if (error) throw error;
      setComprovantes(data || []);
    } catch (error) {
      console.error('Erro ao carregar comprovantes:', error);
    }
  };

  const formatarHora = (date: Date): string => {
    return date.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatarData = (date: Date): string => {
    const dia = date.getDate();
    const mes = MESES_EXTENSO[date.getMonth()];
    const ano = date.getFullYear();
    const diaSemana = DIAS_SEMANA[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Ajustar domingo

    return `${diaSemana}, ${dia} de ${mes} de ${ano}`;
  };

  const abrirModalRegistro = (tipo: TipoRegistroPonto) => {
    // Verificar se já existe registro deste tipo hoje
    const jaRegistrado = registrosHoje.some(r => r.tipo_registro === tipo);
    if (jaRegistrado) {
      toast({
        title: "Registro já existe",
        description: `Você já registrou ${TIPO_REGISTRO_LABELS[tipo]} hoje`,
        variant: "destructive",
      });
      return;
    }

    setTipoSelecionado(tipo);
    setModalAberto(true);
    setSenhaInput("");
  };

  const confirmarRegistro = async () => {
    if (!tipoSelecionado || !funcionario || !senhaInput) return;

    setLoading(true);

    try {
      // Verificar senha real
      const senhaValida = await verificarSenhaPonto(funcionario.id, senhaInput);
      if (!senhaValida) {
        toast({
          title: "Senha inválida",
          description: "A senha digitada está incorreta",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const agora = new Date();
      const horaLocal = formatarHora(agora).split(':');
      const timestampBrasilia = new Date(agora.getTime() - (agora.getTimezoneOffset() * 60000));

      // Preparar dados de localização se disponível
      let dadosLocalizacao = {};
      if (localizacaoAtual) {
        dadosLocalizacao = {
          localizacao_gps: `${localizacaoAtual.latitude},${localizacaoAtual.longitude}`,
          endereco_registro: localizacaoAtual.endereco || null,
          precisao_gps: Math.round(localizacaoAtual.precisao),
          dentro_area_permitida: localizacaoAtual.dentroDoRaioPermitido,
          distancia_sede: localizacaoAtual.distanciaParaSede || null,
        };
      }

      // Inserir registro
      const { data: registro, error } = await supabase
        .from('registros_ponto')
        .insert({
          funcionario_id: funcionario.id,
          data_registro: agora.toISOString().split('T')[0],
          hora_registro: `${horaLocal[0]}:${horaLocal[1]}:${horaLocal[2]}`,
          timestamp_registro: timestampBrasilia.toISOString(),
          tipo_registro: tipoSelecionado,
          ip_address: await obterIP(),
          user_agent: navigator.userAgent,
          ...dadosLocalizacao
        })
        .select()
        .single();

      if (error) throw error;

      // Gerar comprovante
      await gerarComprovante(registro);

      toast({
        title: "Ponto registrado!",
        description: `${TIPO_REGISTRO_LABELS[tipoSelecionado]} registrada com sucesso`,
      });

      setModalAberto(false);

      // Forçar atualização dos registros
      await carregarRegistrosHoje();

      console.log('✅ Registros atualizados após novo ponto');

    } catch (error) {
      console.error('Erro ao registrar ponto:', error);
      toast({
        title: "Erro no registro",
        description: "Não foi possível registrar o ponto. Tente novamente.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const gerarComprovante = async (registro: any) => {
    try {
      // Gerar PDF do comprovante
      const dadosComprovante = {
        funcionario: funcionario!,
        registro,
        empresaNome: "Sec Engenharia",
        empresaCNPJ: "12.345.678/0001-90" // Configure com o CNPJ real
      };

      const pdfBase64 = await gerarComprovantePDF(dadosComprovante);

      // Inserir comprovante na base
      await supabase
        .from('comprovantes_ponto')
        .insert({
          funcionario_id: funcionario!.id,
          registro_ponto_id: registro.id,
          tipo_comprovante: 'individual',
          periodo_inicio: registro.data_registro,
          periodo_fim: registro.data_registro,
          pdf_url: pdfBase64.slice(0, 500) // Salvar parte do base64 como referência
        });

      // Mostrar opção de baixar comprovante
      toast({
        title: "Comprovante gerado!",
        description: "Clique no botão para baixar seu comprovante",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => baixarComprovantePDF(dadosComprovante)}
          >
            <Download className="h-4 w-4 mr-1" />
            Baixar
          </Button>
        )
      });

      carregarComprovantes();
    } catch (error) {
      console.error('Erro ao gerar comprovante:', error);
    }
  };

  const obterIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'N/A';
    }
  };

  const tiposRegistro: TipoRegistroPonto[] = ['PE', 'PS', 'INT_ENTRADA', 'INT_SAIDA', 'SE', 'SS', 'HE_INICIO', 'HE_FIM'];

  const getStatusRegistro = (tipo: TipoRegistroPonto): 'registrado' | 'disponivel' => {
    return registrosHoje.some(r => r.tipo_registro === tipo) ? 'registrado' : 'disponivel';
  };

  if (!funcionario) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Carregando dados do funcionário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header com informações do funcionário */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{funcionario.nome}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {funcionario.funcao?.nome} - {funcionario.funcao?.setor?.nome}
                </span>
                {funcionario.jornada && (
                  <Badge variant="outline">{funcionario.jornada.nome}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relógio e Data */}
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-8 w-8 text-blue-600" />
            <h3 className="text-4xl font-mono font-bold text-blue-600">
              {formatarHora(currentTime)}
            </h3>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-lg text-gray-600">
              {formatarData(currentTime)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Horário de Brasília (UTC-3)
          </p>
        </CardContent>
      </Card>

      {/* Componente de Geolocalização */}
      <div className="mb-6">
        <StatusGeolocalizacao
          onLocalizacaoObtida={setLocalizacaoAtual}
          mostrarDetalhes={true}
        />
      </div>

      {/* Jornada de Trabalho */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Registros de Ponto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tiposRegistro.map((tipo) => {
              const status = getStatusRegistro(tipo);
              const isRegistrado = status === 'registrado';
              const registro = registrosHoje.find(r => r.tipo_registro === tipo);

              return (
                <div key={tipo} className="relative">
                  <Button
                    className={`w-full h-16 flex flex-col gap-1 text-white font-medium ${
                      isRegistrado
                        ? 'bg-green-500 hover:bg-green-600'
                        : TIPO_REGISTRO_COLORS[tipo]
                    }`}
                    onClick={() => !isRegistrado && abrirModalRegistro(tipo)}
                    disabled={isRegistrado}
                  >
                    <span className="text-xs">{tipo}</span>
                    <span className="text-sm">{TIPO_REGISTRO_LABELS[tipo]}</span>
                    {isRegistrado && registro && (
                      <span className="text-xs opacity-90">
                        {registro.hora_registro.slice(0, 5)}
                      </span>
                    )}
                  </Button>
                  {isRegistrado && (
                    <CheckCircle className="absolute -top-2 -right-2 h-6 w-6 text-green-500 bg-white rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Registros de Hoje */}
      {registrosHoje.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Registros de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {registrosHoje.map((registro) => (
                <div key={registro.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {registro.tipo_registro}
                    </Badge>
                    <span className="font-medium">
                      {TIPO_REGISTRO_LABELS[registro.tipo_registro]}
                    </span>
                  </div>
                  <span className="font-mono text-lg">
                    {registro.hora_registro.slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comprovantes */}
      {comprovantes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Meus Comprovantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {comprovantes.slice(0, 5).map((comprovante) => (
                <div key={comprovante.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">
                      Comprovante {comprovante.tipo_comprovante}
                    </span>
                    <p className="text-sm text-gray-600">
                      {new Date(comprovante.data_emissao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Confirmação */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Confirmar Registro de Ponto
            </DialogTitle>
            <DialogDescription>
              Digite sua senha para confirmar o registro de ponto no horário atual.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Registrando:</p>
              <p className="font-semibold text-lg">
                {tipoSelecionado && TIPO_REGISTRO_LABELS[tipoSelecionado]}
              </p>
              <p className="text-2xl font-mono font-bold text-blue-600 mt-2">
                {formatarHora(currentTime)}
              </p>
              <p className="text-sm text-gray-500">
                {formatarData(currentTime)}
              </p>
            </div>

            {/* Indicador de localização no modal */}
            {localizacaoAtual && (
              <div className={`p-3 rounded-lg border ${
                localizacaoAtual.dentroDoRaioPermitido
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {localizacaoAtual.dentroDoRaioPermitido ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    localizacaoAtual.dentroDoRaioPermitido
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}>
                    {localizacaoAtual.dentroDoRaioPermitido
                      ? 'Localização permitida'
                      : 'Fora da área permitida'}
                  </span>
                </div>
                {localizacaoAtual.endereco && (
                  <p className="text-xs text-gray-600 mt-1">
                    📍 {localizacaoAtual.endereco}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); confirmarRegistro(); }}>
              {/* Campo username oculto para acessibilidade */}
              <input
                type="text"
                name="username"
                value={funcionario?.email || ''}
                autoComplete="username"
                style={{ display: 'none' }}
                readOnly
                aria-hidden="true"
              />
              <div>
                <label htmlFor="senha-ponto" className="text-sm font-medium">
                  Digite sua senha para confirmar:
                </label>
                <Input
                  id="senha-ponto"
                  name="password"
                  type="password"
                  value={senhaInput}
                  onChange={(e) => setSenhaInput(e.target.value)}
                  placeholder="Sua senha"
                  className="mt-1"
                  autoComplete="current-password"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {funcionario?.cpf ? (
                    <>
                      Primeira vez? Use os 4 últimos dígitos do seu CPF:
                      <span className="font-mono ml-1 font-semibold">
                        {funcionario.cpf.replace(/\D/g, '').slice(-4)}
                      </span>
                    </>
                  ) : (
                    <>
                      Primeira vez? Use a senha padrão:
                      <span className="font-mono ml-1 font-semibold">1234</span>
                    </>
                  )}
                </p>
              </div>
            </form>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalAberto(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarRegistro}
              disabled={loading || !senhaInput}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Registrando...
                </>
              ) : (
                'Confirmar Registro'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}