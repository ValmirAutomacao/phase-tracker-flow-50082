// 🤖 CLAUDE-NOTE: Componente de legenda das cores para justificativas e afastamentos
// 📅 Criado em: 2024-11-29
// 🎯 Propósito: Mostrar visualmente as cores usadas no controle de ponto

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, Info } from "lucide-react";

// Cores dos status de ponto em tempo real
const CORES_STATUS_PONTO = [
  { categoria: 'No Horário', cor: '#22C55E', descricao: 'Entrada/saída dentro do horário esperado' },
  { categoria: 'Atraso', cor: '#EF4444', descricao: 'Entrada após horário previsto' },
  { categoria: 'Saída Antecipada', cor: '#F59E0B', descricao: 'Saída antes do horário previsto' },
  { categoria: 'Intervalo', cor: '#3B82F6', descricao: 'Horários de intervalo (almoço/lanche)' },
  { categoria: 'Hora Extra', cor: '#A855F7', descricao: 'Horários de hora extra' },
  { categoria: 'Ausente', cor: '#6B7280', descricao: 'Horário não registrado' },
];

// Cores das justificativas (customizáveis)
const CORES_JUSTIFICATIVAS = [
  { categoria: 'Erro de Sistema', cor: '#EF4444', descricao: 'Falhas técnicas no sistema' },
  { categoria: 'Problema de Localização', cor: '#3B82F6', descricao: 'Questões de GPS ou localização' },
  { categoria: 'Esquecimento', cor: '#F59E0B', descricao: 'Funcionário esqueceu de bater ponto' },
  { categoria: 'Outros', cor: '#6B7280', descricao: 'Outros motivos diversos' },
];

// Cores fixas dos afastamentos
const CORES_AFASTAMENTOS = [
  { categoria: 'Férias', cor: '#22C55E', descricao: 'Período de descanso anual' },
  { categoria: 'Licença Médica', cor: '#3B82F6', descricao: 'Licença médica acima de 15 dias' },
  { categoria: 'Licença Maternidade', cor: '#EC4899', descricao: 'Licença maternidade (120 dias)' },
  { categoria: 'Licença Paternidade', cor: '#A855F7', descricao: 'Licença paternidade (até 20 dias)' },
  { categoria: 'Atestado Médico', cor: '#F59E0B', descricao: 'Atestado médico até 15 dias' },
  { categoria: 'Falta Justificada', cor: '#EAB308', descricao: 'Falta por motivo justificado' },
  { categoria: 'Outros', cor: '#6B7280', descricao: 'Outros tipos de afastamento' },
];

interface LegendaCoresProps {
  className?: string;
}

export function LegendaCoresPonto({ className = "" }: LegendaCoresProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${className}`}>
      {/* Status de Ponto */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-green-600" />
            Status de Ponto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Cores aplicadas automaticamente baseadas nos horários registrados.</span>
          </div>
          {CORES_STATUS_PONTO.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: item.cor }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{item.categoria}</div>
                <div className="text-xs text-gray-500">{item.descricao}</div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {item.cor}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Justificativas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-blue-600" />
            Cores das Justificativas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>As cores das justificativas são personalizáveis em cada cadastro.</span>
          </div>
          {CORES_JUSTIFICATIVAS.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: item.cor }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{item.categoria}</div>
                <div className="text-xs text-gray-500">{item.descricao}</div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {item.cor}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Afastamentos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-green-600" />
            Cores dos Afastamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>As cores dos afastamentos são fixas e padronizadas por categoria.</span>
          </div>
          {CORES_AFASTAMENTOS.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: item.cor }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{item.categoria}</div>
                <div className="text-xs text-gray-500">{item.descricao}</div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {item.cor}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default LegendaCoresPonto;