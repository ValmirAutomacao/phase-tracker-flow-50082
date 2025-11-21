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
  Calendar,
  Download,
  Filter,
  Search,
  Clock,
  Users,
  FileText,
  Printer,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  PontoDiario,
  FuncionarioCompleto,
  JornadaTrabalho,
  TIPO_REGISTRO_LABELS
} from "@/types/ponto";

interface FiltrosPonto {
  funcionario: string;
  dataInicio: string;
  dataFim: string;
  setor: string;
  jornada: string;
}

export default function ControlePonto() {
  const [registrosPonto, setRegistrosPonto] = useState<PontoDiario[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioCompleto[]>([]);
  const [jornadas, setJornadas] = useState<JornadaTrabalho[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosPonto>({
    funcionario: 'todos',
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    setor: 'todos',
    jornada: 'todos'
  });
  const [estatisticas, setEstatisticas] = useState({
    totalRegistros: 0,
    funcionariosPresentes: 0,
    horasExtras: 0,
    atrasos: 0
  });
  const { toast } = useToast();

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
      let query = supabase
        .from('registros_ponto')
        .select(`
          *,
          funcionario:funcionarios (
            id,
            nome,
            cpf,
            funcao:funcoes (
              nome,
              setor:setores (
                nome
              )
            ),
            jornada:jornadas_trabalho (
              nome
            )
          )
        `)
        .gte('data_registro', filtros.dataInicio)
        .lte('data_registro', filtros.dataFim);

      // Aplicar filtros
      if (filtros.funcionario !== 'todos') {
        query = query.eq('funcionario_id', filtros.funcionario);
      }

      const { data, error } = await query.order('data_registro', { ascending: false });

      if (error) throw error;

      // Processar dados para formato de relatório
      const processedData = processarDadosPonto(data || []);
      setRegistrosPonto(processedData);
      calcularEstatisticas(processedData);

    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  const processarDadosPonto = (registros: any[]): PontoDiario[] => {
    const registrosPorDiaFuncionario = new Map<string, any>();

    // Agrupar registros por funcionário e data
    registros.forEach(registro => {
      const chave = `${registro.funcionario_id}_${registro.data_registro}`;

      if (!registrosPorDiaFuncionario.has(chave)) {
        registrosPorDiaFuncionario.set(chave, {
          funcionario_nome: registro.funcionario.nome,
          funcionario_id: registro.funcionario_id,
          cpf: registro.funcionario.cpf,
          setor_nome: registro.funcionario.funcao?.setor?.nome || 'N/A',
          funcao_nome: registro.funcionario.funcao?.nome || 'N/A',
          jornada_nome: registro.funcionario.jornada?.nome || 'N/A',
          data_registro: registro.data_registro,
          primeira_entrada: null,
          primeira_saida: null,
          intervalo_entrada: null,
          intervalo_saida: null,
          segunda_entrada: null,
          segunda_saida: null,
          he_inicio: null,
          he_fim: null
        });
      }

      const pontoData = registrosPorDiaFuncionario.get(chave);

      // Mapear tipos de registro
      switch (registro.tipo_registro) {
        case 'PE':
          pontoData.primeira_entrada = registro.hora_registro;
          break;
        case 'PS':
          pontoData.primeira_saida = registro.hora_registro;
          break;
        case 'INT_ENTRADA':
          pontoData.intervalo_entrada = registro.hora_registro;
          break;
        case 'INT_SAIDA':
          pontoData.intervalo_saida = registro.hora_registro;
          break;
        case 'SE':
          pontoData.segunda_entrada = registro.hora_registro;
          break;
        case 'SS':
          pontoData.segunda_saida = registro.hora_registro;
          break;
        case 'HE_INICIO':
          pontoData.he_inicio = registro.hora_registro;
          break;
        case 'HE_FIM':
          pontoData.he_fim = registro.hora_registro;
          break;
      }
    });

    return Array.from(registrosPorDiaFuncionario.values());
  };

  const calcularEstatisticas = (registros: PontoDiario[]) => {
    const funcionariosUnicos = new Set(registros.map(r => r.funcionario_id));
    const totalRegistros = registros.length;

    setEstatisticas({
      totalRegistros,
      funcionariosPresentes: funcionariosUnicos.size,
      horasExtras: registros.filter(r => r.he_inicio || r.he_fim).length,
      atrasos: registros.filter(r => {
        // Lógica simplificada para detectar atrasos
        if (!r.primeira_entrada) return false;
        const entrada = new Date(`2000-01-01T${r.primeira_entrada}`);
        const horaEsperada = new Date(`2000-01-01T08:00:00`); // Simplificado
        return entrada > horaEsperada;
      }).length
    });
  };

  const exportarExcel = () => {
    // Implementar exportação para Excel
    toast({
      title: "Exportação",
      description: "Funcionalidade de exportação será implementada em breve",
    });
  };

  const imprimirRelatorio = () => {
    window.print();
  };

  const formatarHora = (hora: string | null): string => {
    if (!hora) return '-';
    return hora.slice(0, 5);
  };

  const getStatusDia = (ponto: PontoDiario): 'completo' | 'incompleto' | 'ausente' => {
    const temEntrada = ponto.primeira_entrada;
    const temSaida = ponto.segunda_saida || ponto.primeira_saida;

    if (!temEntrada) return 'ausente';
    if (!temSaida) return 'incompleto';
    return 'completo';
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Total de Registros</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{estatisticas.totalRegistros}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Funcionários Presentes</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{estatisticas.funcionariosPresentes}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Horas Extras</span>
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
          <div className="flex gap-4 mb-6">
            <Button onClick={exportarExcel} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button onClick={imprimirRelatorio} variant="outline" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
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
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-gray-500">
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
                        <TableCell className="text-center font-mono">
                          {formatarHora(registro.primeira_entrada)}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {formatarHora(registro.primeira_saida)}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {formatarHora(registro.intervalo_entrada)}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {formatarHora(registro.intervalo_saida)}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {formatarHora(registro.segunda_entrada)}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {formatarHora(registro.segunda_saida)}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {formatarHora(registro.he_inicio)}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {formatarHora(registro.he_fim)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={status === 'completo' ? 'default' : status === 'incompleto' ? 'secondary' : 'destructive'}
                            className={
                              status === 'completo' ? 'bg-green-100 text-green-800' :
                              status === 'incompleto' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {status === 'completo' ? 'Completo' :
                             status === 'incompleto' ? 'Incompleto' : 'Ausente'}
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
    </div>
  );
}