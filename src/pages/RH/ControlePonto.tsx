import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Clock,
  Users,
  FileText,
  Printer,
  AlertCircle,
  Edit3,
  UserMinus,
  History,
  BarChart3,
  MessageSquarePlus
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  PontoDiario,
  FuncionarioCompleto,
  JornadaTrabalho,
  AjustePonto,
  Afastamento,
  TipoRegistroPonto
} from "@/types/ponto";
import { ModalAjustePonto } from "@/components/RH/ModalAjustePonto";
import { ModalAfastamento } from "@/components/RH/ModalAfastamento";
import { ModalHistoricoAjustes } from "@/components/RH/ModalHistoricoAjustes";
import { RelatorioAjustes } from "@/components/RH/RelatorioAjustes";
import { LegendaCoresPonto } from "@/components/RH/LegendaCoresPonto";
import { useAjustesPonto } from "@/hooks/useAjustesPonto";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

interface FiltrosPonto {
  funcionario: string;
  dataInicio: string;
  dataFim: string;
  setor: string;
  jornada: string;
}

// Extended interface to handle FALTA status locally
interface PontoDiarioEstendido extends PontoDiario {
  cpf?: string;
  status_pe?: 'ok' | 'falta' | 'atraso' | 'ajuste';
  status_ps?: 'ok' | 'falta' | 'antecipada' | 'ajuste';
  status_ie?: 'ok' | 'falta' | 'atraso' | 'ajuste';
  status_is?: 'ok' | 'falta' | 'antecipada' | 'ajuste';
  status_se?: 'ok' | 'falta' | 'atraso' | 'ajuste';
  status_ss?: 'ok' | 'falta' | 'antecipada' | 'ajuste';
}

export default function ControlePonto() {
  const [registrosPonto, setRegistrosPonto] = useState<PontoDiarioEstendido[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioCompleto[]>([]);
  const [jornadas, setJornadas] = useState<JornadaTrabalho[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Default to current month or week? Let's default to today for now as per requirement "por padrão vem o dia atual"
  const today = new Date().toISOString().split('T')[0];
  const [filtros, setFiltros] = useState<FiltrosPonto>({
    funcionario: 'todos',
    dataInicio: today,
    dataFim: today,
    setor: 'todos',
    jornada: 'todos'
  });
  
  const [estatisticas, setEstatisticas] = useState({
    totalRegistros: 0,
    funcionariosPresentes: 0,
    horasExtras: 0,
    atrasos: 0,
    faltas: 0,
    afastamentos: 0
  });

  // Estados dos modais
  const [modalAjusteAberto, setModalAjusteAberto] = useState(false);
  const [modalAfastamentoAberto, setModalAfastamentoAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);
  const [registroParaAjustar, setRegistroParaAjustar] = useState<{
    funcionario_id: string;
    funcionario_nome: string;
    data_registro: string;
    tipo_registro_original?: TipoRegistroPonto;
    hora_original?: string;
    registro_ponto_id?: string;
  } | null>(null);
  const [ajustes, setAjustes] = useState<AjustePonto[]>([]);
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>([]);

  const { toast } = useToast();
  const ajustesHook = useAjustesPonto();

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    carregarRegistrosPonto();
  }, [filtros]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarFuncionarios(),
        carregarJornadas(),
        carregarSetores(),
        carregarRegistrosPonto()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarFuncionarios = async () => {
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
      .eq('ativo', true);

    if (error) throw error;
    setFuncionarios(data || []);
  };

  const carregarJornadas = async () => {
    const { data, error } = await supabase
      .from('jornadas_trabalho')
      .select('*')
      .eq('ativo', true);

    if (error) throw error;
    setJornadas(data || []);
  };

  const carregarSetores = async () => {
    const { data, error } = await supabase
      .from('setores')
      .select('*');

    if (error) throw error;
    setSetores(data || []);
  };

  const carregarRegistrosPonto = async () => {
    try {
      // Buscar todos os funcionários ativos
      let funcionariosQuery = supabase
        .from('funcionarios')
        .select(`
          id,
          nome,
          cpf,
          ativo,
          funcao:funcoes (
            nome,
            setor:setores (
              nome
            )
          ),
          jornada:jornadas_trabalho (*)
        `)
        .eq('ativo', true);

      // Aplicar filtro de funcionário se selecionado
      if (filtros.funcionario !== 'todos') {
        funcionariosQuery = funcionariosQuery.eq('id', filtros.funcionario);
      }

      const { data: funcionariosData, error: funcionariosError } = await funcionariosQuery;

      if (funcionariosError) throw funcionariosError;

      // Buscar registros de ponto para o período
      let registrosQuery = supabase
        .from('registros_ponto')
        .select('*')
        .gte('data_registro', filtros.dataInicio)
        .lte('data_registro', filtros.dataFim);

      // Aplicar filtro de funcionário nos registros também
      if (filtros.funcionario !== 'todos') {
        registrosQuery = registrosQuery.eq('funcionario_id', filtros.funcionario);
      }

      const { data: registrosData, error: registrosError } = await registrosQuery;

      if (registrosError) throw registrosError;

      // Buscar afastamentos ativos para o período
      let afastamentosQuery = supabase
        .from('afastamentos')
        .select('funcionario_id, data_inicio, data_fim, status')
        .in('status', ['aprovado'])
        .lte('data_inicio', filtros.dataFim)
        .gte('data_fim', filtros.dataInicio);

      const { data: afastamentosData, error: afastamentosError } = await afastamentosQuery;

      if (afastamentosError) throw afastamentosError;

      // Combinar dados de funcionários com registros de ponto e afastamentos
      const processedData = processarDadosComTodosFuncionarios(funcionariosData || [], registrosData || [], afastamentosData || []);
      setRegistrosPonto(processedData);
      calcularEstatisticas(processedData);

    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  const processarDadosComTodosFuncionarios = (funcionarios: any[], registros: any[], afastamentos: any[]): PontoDiarioEstendido[] => {
    const resultado: PontoDiarioEstendido[] = [];

    // Gerar todas as datas no período (Corrigido timezone)
    const [anoIni, mesIni, diaIni] = filtros.dataInicio.split('-').map(Number);
    const [anoFim, mesFim, diaFim] = filtros.dataFim.split('-').map(Number);
    
    const dataInicioObj = new Date(anoIni, mesIni - 1, diaIni);
    const dataFimObj = new Date(anoFim, mesFim - 1, diaFim);
    
    const datas: string[] = [];

    for (let data = new Date(dataInicioObj); data <= dataFimObj; data.setDate(data.getDate() + 1)) {
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');
      datas.push(`${ano}-${mes}-${dia}`);
    }

    // Agrupar registros por funcionário e data
    const registrosPorChave = new Map<string, any[]>();
    registros.forEach(registro => {
      const chave = `${registro.funcionario_id}_${registro.data_registro}`;
      if (!registrosPorChave.has(chave)) {
        registrosPorChave.set(chave, []);
      }
      registrosPorChave.get(chave)!.push(registro);
    });

    // Dados para verificação de FALTA (Hora atual Brasilia)
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const tolerance = 10; // minutos

    const timeToMinutes = (timeStr?: string) => {
      if (!timeStr) return null;
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    // Para cada funcionário e cada data
    funcionarios.forEach(funcionario => {
      datas.forEach(data => {
        const chave = `${funcionario.id}_${data}`;
        const registrosDoDia = registrosPorChave.get(chave) || [];
        
        const afastado = afastamentos.some(afastamento =>
          afastamento.funcionario_id === funcionario.id &&
          afastamento.data_inicio <= data &&
          afastamento.data_fim >= data
        );

        // Verificar se é dia útil
        const dataObj = new Date(data + 'T00:00:00');
        const dayOfWeek = dataObj.getDay(); // 0 = Domingo, 6 = Sábado
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const diaUtil = !isWeekend; // Simplificação, idealmente verificar feriados

        let statusDia: 'presente' | 'ausente' | 'afastado' | 'nao_util' = 'presente';

        if (afastado) {
          statusDia = 'afastado';
        } else if (!diaUtil) {
          statusDia = 'nao_util';
        } else if (registrosDoDia.length === 0) {
          // Verificar se já passou do dia ou hora
          const isPastDate = new Date(data) < new Date(now.toDateString());
          if (isPastDate) {
             statusDia = 'ausente';
          } else if (data === now.toISOString().split('T')[0]) {
             // Se é hoje e não tem registros, mas já passou da hora de entrada...
             if (funcionario.jornada?.pe_esperado) {
                const peMinutes = timeToMinutes(funcionario.jornada.pe_esperado);
                if (peMinutes && currentTimeInMinutes > peMinutes + tolerance) {
                   statusDia = 'ausente'; // Ou parcial
                }
             }
          }
        }

        const pontoData: PontoDiarioEstendido = {
          funcionario_id: funcionario.id,
          funcionario_nome: funcionario.nome,
          cpf: funcionario.cpf,
          funcao_nome: funcionario.funcao?.nome || '',
          setor_nome: funcionario.funcao?.setor?.nome || '',
          jornada_nome: funcionario.jornada?.nome || '',
          data_registro: data,
          status_dia: statusDia,
          total_horas: '00:00',
        };

        // Preencher horários
        registrosDoDia.forEach(registro => {
          switch (registro.tipo_registro) {
            case 'PE': pontoData.primeira_entrada = registro.hora_registro; break;
            case 'PS': pontoData.primeira_saida = registro.hora_registro; break;
            case 'INT_ENTRADA': pontoData.intervalo_entrada = registro.hora_registro; break;
            case 'INT_SAIDA': pontoData.intervalo_saida = registro.hora_registro; break;
            case 'SE': pontoData.segunda_entrada = registro.hora_registro; break;
            case 'SS': pontoData.segunda_saida = registro.hora_registro; break;
            case 'HE_INICIO': pontoData.he_inicio = registro.hora_registro; break;
            case 'HE_FIM': pontoData.he_fim = registro.hora_registro; break;
          }
        });

        // Lógica de FALTA para slots específicos
        if (diaUtil && !afastado) {
          const isToday = data === now.toISOString().split('T')[0];
          const isPast = new Date(data) < new Date(now.toDateString());
          const jornada = funcionario.jornada;

          const checkFalta = (slotTime: string | undefined, expectedTime?: string) => {
            if (slotTime) return 'ok';
            if (!expectedTime) return undefined;
            
            if (isPast) return 'falta';
            if (isToday) {
              const expMinutes = timeToMinutes(expectedTime);
              if (expMinutes && currentTimeInMinutes > expMinutes + tolerance) {
                return 'falta';
              }
            }
            return undefined;
          };

          if (jornada) {
            pontoData.status_pe = checkFalta(pontoData.primeira_entrada, jornada.pe_esperado) as any;
            pontoData.status_ps = checkFalta(pontoData.primeira_saida, jornada.ps_esperado) as any;
            // Intervalos geralmente não tem horario fixo rígido, mas SE/SS sim
            pontoData.status_se = checkFalta(pontoData.segunda_entrada, jornada.se_esperado) as any;
            pontoData.status_ss = checkFalta(pontoData.segunda_saida, jornada.ss_esperado) as any;
          }
        }

        // Calcular Total de Horas (Pares)
        pontoData.total_horas = calculateDailyHours(pontoData);

        resultado.push(pontoData);
      });
    });

    return resultado.sort((a, b) => {
      const dataCompare = b.data_registro.localeCompare(a.data_registro);
      if (dataCompare !== 0) return dataCompare;
      return a.funcionario_nome.localeCompare(b.funcionario_nome);
    });
  };

  const calculateDailyHours = (ponto: PontoDiarioEstendido): string => {
    let totalMinutes = 0;

    const timeToMin = (t?: string) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    // Par 1: PE -> PS
    if (ponto.primeira_entrada && ponto.primeira_saida) {
      totalMinutes += timeToMin(ponto.primeira_saida) - timeToMin(ponto.primeira_entrada);
    }

    // Par 2: SE -> SS
    if (ponto.segunda_entrada && ponto.segunda_saida) {
      totalMinutes += timeToMin(ponto.segunda_saida) - timeToMin(ponto.segunda_entrada);
    }

    // Horas Extras
    if (ponto.he_inicio && ponto.he_fim) {
      totalMinutes += timeToMin(ponto.he_fim) - timeToMin(ponto.he_inicio);
    }

    if (totalMinutes < 0) totalMinutes = 0; // Should not happen if data is consistent

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const calcularEstatisticas = (registros: PontoDiarioEstendido[]) => {
    const funcionariosUnicos = new Set(registros.map(r => r.funcionario_id));
    const totalRegistros = registros.length; // Dias exibidos
    
    // Falta no dia inteiro
    const faltas = registros.filter(r => r.status_dia === 'ausente').length;
    const afastamentos = registros.filter(r => r.status_dia === 'afastado').length;
    
    // Atrasos (simples verificação no PE)
    const atrasos = registros.filter(r => r.status_pe === 'atraso').length;

    setEstatisticas({
      totalRegistros,
      funcionariosPresentes: funcionariosUnicos.size,
      horasExtras: registros.filter(r => r.he_inicio || r.he_fim).length,
      atrasos,
      faltas,
      afastamentos
    });
  };

  const exportarExcel = () => {
    toast({
      title: "Exportação",
      description: "Funcionalidade de exportação será implementada em breve",
    });
  };

  const imprimirRelatorio = () => {
    window.print();
  };

  const formatarHora = (hora: string | undefined, status?: string): React.ReactNode => {
    if (status === 'falta') return <span className="text-red-600 font-bold">FALTA</span>;
    if (!hora) return <span className="text-gray-300">-</span>;
    return hora.slice(0, 5);
  };

  // Função para obter classe CSS baseada no status do horário
  const getHorarioClassName = (
    hora: string | undefined,
    tipo: 'entrada' | 'saida' | 'intervalo_entrada' | 'intervalo_saida' | 'he',
    statusSpecifico?: string
  ): string => {
    if (statusSpecifico === 'falta') return 'bg-red-50 border-red-200';
    if (!hora) return '';

    switch (tipo) {
      case 'entrada': return 'text-green-600 font-semibold bg-green-50 px-2 py-1 rounded';
      case 'saida': return 'text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded';
      case 'intervalo_entrada': return 'text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded';
      case 'intervalo_saida': return 'text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded';
      case 'he': return 'text-purple-600 font-semibold bg-purple-50 px-2 py-1 rounded';
      default: return 'text-gray-600';
    }
  };

  // Função para abrir modal de ajuste para um registro específico
  const handleAjustarPonto = (
    funcionarioId: string,
    funcionarioNome: string,
    dataRegistro: string,
    tipoRegistro: string,
    horaOriginal: string | undefined
  ) => {
    setRegistroParaAjustar({
      funcionario_id: funcionarioId,
      funcionario_nome: funcionarioNome,
      data_registro: dataRegistro,
      tipo_registro_original: tipoRegistro as TipoRegistroPonto,
      hora_original: horaOriginal || '',
    });
    setModalAjusteAberto(true);
  };

  const getStatusDia = (ponto: PontoDiarioEstendido): 'completo' | 'incompleto' | 'ausente' | 'afastado' => {
    if (ponto.status_dia === 'afastado') return 'afastado';
    if (ponto.status_dia === 'ausente') return 'ausente';

    // Se tem qualquer FALTA nos slots principais
    if (ponto.status_pe === 'falta' || ponto.status_ps === 'falta' || ponto.status_se === 'falta' || ponto.status_ss === 'falta') {
        return 'incompleto';
    }

    // Se tem os pares completos
    const par1 = ponto.primeira_entrada && ponto.primeira_saida;
    const par2 = ponto.segunda_entrada && ponto.segunda_saida;
    
    // Lógica simples: se tem pelo menos um par completo é "parcial/completo", se não tem nada é ausente
    if (!ponto.primeira_entrada && !ponto.primeira_saida && !ponto.segunda_entrada && !ponto.segunda_saida) return 'ausente';
    
    if (par1 && par2) return 'completo';
    return 'incompleto';
  };

  const filtrarPorSetor = (funcionarioId: string): boolean => {
    if (filtros.setor === 'todos') return true;
    const funcionario = funcionarios.find(f => f.id === funcionarioId);
    return funcionario?.funcao?.setor?.id === filtros.setor;
  };

  const filtrarPorJornada = (funcionarioId: string): boolean => {
    if (filtros.jornada === 'todos') return true;
    const funcionario = funcionarios.find(f => f.id === funcionarioId);
    return funcionario?.jornada_trabalho_id === filtros.jornada;
  };

  const registrosFiltrados = registrosPonto.filter(registro =>
    filtrarPorSetor(registro.funcionario_id) &&
    filtrarPorJornada(registro.funcionario_id)
  );

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Carregando controle de ponto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Controle de Ponto
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Registros</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{estatisticas.totalRegistros}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Presentes</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{estatisticas.funcionariosPresentes}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-600">Faltas</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{estatisticas.faltas}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border-blue-200 border">
              <div className="flex items-center gap-2">
                <UserMinus className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Afastados</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{estatisticas.afastamentos}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">H. Extras</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">{estatisticas.horasExtras}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">Atrasos</span>
              </div>
              <p className="text-2xl font-bold text-orange-700">{estatisticas.atrasos}</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Funcionário</label>
              <Select
                value={filtros.funcionario}
                onValueChange={(value) => setFiltros({...filtros, funcionario: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Funcionários</SelectItem>
                  {funcionarios.map(funcionario => (
                    <SelectItem key={funcionario.id} value={funcionario.id}>
                      {funcionario.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Setor</label>
              <Select
                value={filtros.setor}
                onValueChange={(value) => setFiltros({...filtros, setor: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Setores</SelectItem>
                  {setores.map(setor => (
                    <SelectItem key={setor.id} value={setor.id}>
                      {setor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Jornada</label>
              <Select
                value={filtros.jornada}
                onValueChange={(value) => setFiltros({...filtros, jornada: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Jornadas</SelectItem>
                  {jornadas.map(jornada => (
                    <SelectItem key={jornada.id} value={jornada.id}>
                      {jornada.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Ações de Ajuste */}
            <div className="flex gap-2">
              <PermissionGuard permissions={['criar_ajustes_ponto']}>
                <Button
                  onClick={() => setModalAjusteAberto(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Ajuste Manual
                </Button>
              </PermissionGuard>
              
              <PermissionGuard permissions={['criar_afastamentos']}>
                <Button
                  onClick={() => setModalAfastamentoAberto(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <UserMinus className="h-4 w-4" />
                  Registrar Afastamento
                </Button>
              </PermissionGuard>
            </div>

            {/* Ações de Consulta */}
            <div className="flex gap-2">
              <Button
                onClick={() => setModalHistoricoAberto(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                Histórico
              </Button>
              <Button
                onClick={() => setModalRelatorioAberto(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Relatórios
              </Button>
            </div>

            {/* Botão de Justificativa (Colaborador) */}
            <PermissionGuard permissions={['solicitar_ajuste_proprio']}>
               <Button
                  onClick={() => setModalAjusteAberto(true)}
                  variant="secondary" 
                  className="flex items-center gap-2"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  Justificar Falta
                </Button>
            </PermissionGuard>

            {/* Ações de Exportação */}
            <div className="flex gap-2 ml-auto">
              <Button onClick={exportarExcel} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar Excel
              </Button>
              <Button onClick={imprimirRelatorio} variant="outline" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>

          {/* Tabela de Registros */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-center">PE</TableHead>
                  <TableHead className="text-center">PS</TableHead>
                  <TableHead className="text-center">INT E</TableHead>
                  <TableHead className="text-center">INT S</TableHead>
                  <TableHead className="text-center">SE</TableHead>
                  <TableHead className="text-center">SS</TableHead>
                  <TableHead className="text-center">HE I</TableHead>
                  <TableHead className="text-center">HE F</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                      Nenhum registro encontrado para os filtros selecionados
                    </TableCell>
                  </TableRow>
                ) : (
                  registrosFiltrados.map((registro, index) => {
                    const status = getStatusDia(registro);
                    return (
                      <TableRow key={`${registro.funcionario_id}_${registro.data_registro}_${index}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{registro.funcionario_nome}</p>
                            <p className="text-sm text-gray-500">{registro.funcao_nome}</p>
                          </div>
                        </TableCell>
                        <TableCell>{registro.setor_nome}</TableCell>
                        <TableCell>
                          {new Date(registro.data_registro + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </TableCell>
                        
                        {/* PE */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`font-mono ${getHorarioClassName(registro.primeira_entrada, 'entrada', registro.status_pe)}`}>
                              {formatarHora(registro.primeira_entrada, registro.status_pe)}
                            </span>
                            <PermissionGuard permissions={['editar_ajustes_ponto']}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                                onClick={() => handleAjustarPonto(
                                  registro.funcionario_id,
                                  registro.funcionario_nome,
                                  registro.data_registro,
                                  'PE',
                                  registro.primeira_entrada
                                )}
                              >
                                <Edit3 className="h-3 w-3 text-blue-600" />
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>

                        {/* PS */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`font-mono ${getHorarioClassName(registro.primeira_saida, 'saida', registro.status_ps)}`}>
                              {formatarHora(registro.primeira_saida, registro.status_ps)}
                            </span>
                            <PermissionGuard permissions={['editar_ajustes_ponto']}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                                onClick={() => handleAjustarPonto(
                                  registro.funcionario_id,
                                  registro.funcionario_nome,
                                  registro.data_registro,
                                  'PS',
                                  registro.primeira_saida
                                )}
                              >
                                <Edit3 className="h-3 w-3 text-blue-600" />
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>

                        {/* INT E */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`font-mono ${getHorarioClassName(registro.intervalo_entrada, 'intervalo_entrada')}`}>
                              {formatarHora(registro.intervalo_entrada)}
                            </span>
                            <PermissionGuard permissions={['editar_ajustes_ponto']}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                                onClick={() => handleAjustarPonto(
                                  registro.funcionario_id,
                                  registro.funcionario_nome,
                                  registro.data_registro,
                                  'INT_ENTRADA',
                                  registro.intervalo_entrada
                                )}
                              >
                                <Edit3 className="h-3 w-3 text-blue-600" />
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>

                        {/* INT S */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`font-mono ${getHorarioClassName(registro.intervalo_saida, 'intervalo_saida')}`}>
                              {formatarHora(registro.intervalo_saida)}
                            </span>
                            <PermissionGuard permissions={['editar_ajustes_ponto']}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                                onClick={() => handleAjustarPonto(
                                  registro.funcionario_id,
                                  registro.funcionario_nome,
                                  registro.data_registro,
                                  'INT_SAIDA',
                                  registro.intervalo_saida
                                )}
                              >
                                <Edit3 className="h-3 w-3 text-blue-600" />
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>

                        {/* SE */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`font-mono ${getHorarioClassName(registro.segunda_entrada, 'entrada', registro.status_se)}`}>
                              {formatarHora(registro.segunda_entrada, registro.status_se)}
                            </span>
                            <PermissionGuard permissions={['editar_ajustes_ponto']}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                                onClick={() => handleAjustarPonto(
                                  registro.funcionario_id,
                                  registro.funcionario_nome,
                                  registro.data_registro,
                                  'SE',
                                  registro.segunda_entrada
                                )}
                              >
                                <Edit3 className="h-3 w-3 text-blue-600" />
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>

                        {/* SS */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`font-mono ${getHorarioClassName(registro.segunda_saida, 'saida', registro.status_ss)}`}>
                              {formatarHora(registro.segunda_saida, registro.status_ss)}
                            </span>
                            <PermissionGuard permissions={['editar_ajustes_ponto']}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                                onClick={() => handleAjustarPonto(
                                  registro.funcionario_id,
                                  registro.funcionario_nome,
                                  registro.data_registro,
                                  'SS',
                                  registro.segunda_saida
                                )}
                              >
                                <Edit3 className="h-3 w-3 text-blue-600" />
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>

                        {/* HE I */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`font-mono ${getHorarioClassName(registro.he_inicio, 'he')}`}>
                              {formatarHora(registro.he_inicio)}
                            </span>
                            <PermissionGuard permissions={['editar_ajustes_ponto']}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                                onClick={() => handleAjustarPonto(
                                  registro.funcionario_id,
                                  registro.funcionario_nome,
                                  registro.data_registro,
                                  'HE_INICIO',
                                  registro.he_inicio
                                )}
                              >
                                <Edit3 className="h-3 w-3 text-blue-600" />
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>

                        {/* HE F */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`font-mono ${getHorarioClassName(registro.he_fim, 'he')}`}>
                              {formatarHora(registro.he_fim)}
                            </span>
                            <PermissionGuard permissions={['editar_ajustes_ponto']}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                                onClick={() => handleAjustarPonto(
                                  registro.funcionario_id,
                                  registro.funcionario_nome,
                                  registro.data_registro,
                                  'HE_FIM',
                                  registro.he_fim
                                )}
                              >
                                <Edit3 className="h-3 w-3 text-blue-600" />
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>

                        {/* TOTAL */}
                        <TableCell className="font-mono font-bold">
                          {registro.total_horas}
                        </TableCell>

                        {/* STATUS */}
                        <TableCell>
                          <Badge
                            variant={
                              status === 'completo' ? 'default' :
                              status === 'incompleto' ? 'secondary' :
                              status === 'afastado' ? 'outline' :
                              'destructive'
                            }
                            className={
                              status === 'completo' ? 'bg-green-100 text-green-800' :
                              status === 'incompleto' ? 'bg-yellow-100 text-yellow-800' :
                              status === 'afastado' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {status === 'completo' ? 'Completo' :
                             status === 'incompleto' ? 'Incompleto' :
                             status === 'afastado' ? 'Afastado' :
                             'Falta'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      <ModalAjustePonto
        open={modalAjusteAberto}
        onOpenChange={setModalAjusteAberto}
        registroOriginal={registroParaAjustar}
        onSuccess={() => {
          carregarRegistrosPonto();
          setRegistroParaAjustar(null);
          toast({
            title: "Sucesso",
            description: "Ajuste de ponto realizado com sucesso!",
          });
        }}
      />

      <ModalAfastamento
        isOpen={modalAfastamentoAberto}
        onOpenChange={setModalAfastamentoAberto}
        funcionarios={funcionarios}
        onSubmit={async () => {
          carregarRegistrosPonto();
          toast({
            title: "Sucesso",
            description: "Afastamento registrado com sucesso!",
          });
        }}
      />

      <ModalHistoricoAjustes
        isOpen={modalHistoricoAberto}
        onOpenChange={setModalHistoricoAberto}
        funcionarios={funcionarios}
        onExportarRelatorio={async (filtros) => {
          try {
            toast({
              title: "Exportando...",
              description: "Gerando arquivo CSV com os dados filtrados",
            });
          } catch (error) {
            toast({
              title: "Erro",
              description: "Falha ao exportar relatório",
              variant: "destructive",
            });
          }
        }}
      />

      <RelatorioAjustes
        isOpen={modalRelatorioAberto}
        onOpenChange={setModalRelatorioAberto}
        funcionarios={funcionarios}
        ajustes={ajustes}
        afastamentos={afastamentos}
      />

      {/* Legenda das Cores */}
      <div className="mt-6">
        <LegendaCoresPonto />
      </div>
    </div>
  );
}