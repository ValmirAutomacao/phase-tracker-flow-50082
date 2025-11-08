import React, { useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Etapa {
  id?: string;
  nome: string;
  responsavel?: string;
  dataInicio: string;
  dataPrevisao: string;
  progresso?: number;
  status?: string;
}

interface Obra {
  id: string;
  nome: string;
  etapas?: Etapa[];
}

interface GanttTimelineProps {
  obra?: Obra;
}

export default function GanttTimeline({ obra }: GanttTimelineProps) {
  const [expanded, setExpanded] = React.useState(new Set(['proj-1']));

  const calculateDaysBetween = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateStartDay = (dataInicio: string, projectStart: string) => {
    const projectStartDate = new Date(projectStart);
    const taskStartDate = new Date(dataInicio);
    const diffTime = taskStartDate.getTime() - projectStartDate.getTime();
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getProjectStartDate = (etapas: Etapa[]) => {
    if (!etapas || etapas.length === 0) return new Date().toISOString().split('T')[0];
    return etapas.reduce((earliest, etapa) => {
      return etapa.dataInicio < earliest ? etapa.dataInicio : earliest;
    }, etapas[0].dataInicio);
  };

  const tasks = useMemo(() => {
    if (!obra || !obra.etapas || obra.etapas.length === 0) {
      return [
        {
          id: 'proj-1',
          name: 'Projeto Exemplo',
          type: 'project',
          progress: null,
          children: [
            {
              id: 'task-1',
              name: 'Nenhuma etapa cadastrada',
              startDay: 0,
              duration: 1,
              progress: 0,
              weight: 1,
              dependsOn: [],
            },
          ],
        },
      ];
    }

    const projectStart = getProjectStartDate(obra.etapas);
    const weight = 1 / obra.etapas.length;

    const children = obra.etapas.map((etapa, index) => ({
      id: etapa.id || `task-${index + 1}`,
      name: etapa.nome,
      startDay: calculateStartDay(etapa.dataInicio, projectStart),
      duration: calculateDaysBetween(etapa.dataInicio, etapa.dataPrevisao),
      progress: etapa.progresso || 0,
      weight: weight,
      dependsOn: index > 0 ? [obra.etapas[index - 1].id || `task-${index}`] : [],
      responsavel: etapa.responsavel || 'Não definido'
    }));

    return [
      {
        id: 'proj-1',
        name: obra.nome,
        type: 'project',
        progress: null,
        children: children,
      },
    ];
  }, [obra]);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const calculateProjectProgress = (children) => {
    if (!children) return 0;
    const totalWeight = children.reduce((sum, t) => sum + t.weight, 0);
    const weighted = children.reduce((sum, t) => sum + t.progress * t.weight, 0);
    return Math.round(weighted / totalWeight);
  };

  const getTaskColor = (progress) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress > 0) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const timelineWidth = 500;
  const totalDays = useMemo(() => {
    if (!tasks[0].children || tasks[0].children.length === 0) return 36;
    const maxEndDay = Math.max(...tasks[0].children.map(task => task.startDay + task.duration));
    return Math.max(maxEndDay + 5, 30); // Mínimo de 30 dias
  }, [tasks]);
  const pixelsPerDay = timelineWidth / totalDays;

  const taskPositions = useMemo(() => {
    const positions = {};
    tasks[0].children.forEach((task) => {
      positions[task.id] = {
        left: task.startDay * pixelsPerDay,
        width: task.duration * pixelsPerDay,
      };
    });
    return positions;
  }, [pixelsPerDay, tasks]);

  const renderDependencyLines = () => {
    const children = tasks[0].children;
    const svgLines = [];

    children.forEach((task) => {
      task.dependsOn.forEach((depId) => {
        const fromTask = children.find((t) => t.id === depId);
        if (fromTask && taskPositions[depId] && taskPositions[task.id]) {
          const fromX = taskPositions[depId].left + taskPositions[depId].width;
          const toX = taskPositions[task.id].left;
          const fromY = children.indexOf(fromTask) * 50 + 60;
          const toY = children.indexOf(task) * 50 + 60;

          svgLines.push(
            <g key={`${depId}-${task.id}`}>
              <line
                x1={fromX + 10}
                y1={fromY}
                x2={fromX + 20}
                y2={fromY}
                stroke="#94a3b8"
                strokeWidth="2"
              />
              <line
                x1={fromX + 20}
                y1={fromY}
                x2={fromX + 20}
                y2={toY}
                stroke="#94a3b8"
                strokeWidth="2"
              />
              <line
                x1={fromX + 20}
                y1={toY}
                x2={toX - 5}
                y2={toY}
                stroke="#94a3b8"
                strokeWidth="2"
              />
              <polygon
                points={`${toX},${toY} ${toX - 5},${toY - 4} ${toX - 5},${toY + 4}`}
                fill="#94a3b8"
              />
            </g>
          );
        }
      });
    });

    return svgLines;
  };

  const projectProgress = calculateProjectProgress(tasks[0].children);

  return (
    <div className="w-full p-4 sm:p-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Gantt Timeline com Progresso Automático</h1>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-64 lg:border-r border-gray-200 lg:border-b-0 border-b pb-4 lg:pb-0">
          {tasks.map((project) => (
            <div key={project.id}>
              <div
                className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 font-semibold text-sm"
                onClick={() => toggleExpand(project.id)}
              >
                {expanded.has(project.id) ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <span className="flex-1">{project.name}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {projectProgress}%
                </span>
              </div>

              {expanded.has(project.id) && (
                <div className="pl-4 bg-gray-50">
                  {project.children.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-3 text-xs border-b border-gray-200 hover:bg-gray-100"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{task.name}</div>
                        <div className="text-gray-500">
                          {task.progress}% • Peso: {Math.round(task.weight * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-x-auto">
          {/* Header com escala */}
          <div className="flex gap-1 mb-4 relative min-w-0" style={{ minWidth: Math.max(timelineWidth, 300) }}>
            {Array.from({ length: Math.ceil(totalDays / 5) }).map((_, i) => (
              <div
                key={i}
                className="text-xs text-gray-500 font-medium"
                style={{ width: pixelsPerDay * 5 }}
              >
                {i * 5}d
              </div>
            ))}
          </div>

          {/* SVG para dependências */}
          <svg
            className="absolute top-16 left-0 lg:left-80 hidden lg:block"
            width={timelineWidth + 50}
            height={tasks[0].children.length * 50 + 100}
            style={{ pointerEvents: 'none' }}
          >
            {renderDependencyLines()}
          </svg>

          {/* Barras de tarefas */}
          <div className="relative" style={{ minWidth: Math.max(timelineWidth, 300) }}>
            {expanded.has('proj-1') &&
              tasks[0].children.map((task, index) => (
                <div key={task.id} className="mb-8">
                  <div
                    className="relative h-8 bg-gray-100 rounded border border-gray-200 group"
                    style={{ marginLeft: 0 }}
                  >
                    {/* Barra de progresso */}
                    <div
                      className={`h-full rounded transition-all ${getTaskColor(task.progress)}`}
                      style={{
                        width: `${(task.progress / 100) * 100}%`,
                        marginLeft: `${((taskPositions[task.id]?.left || 0) / timelineWidth) * 100}%`,
                      }}
                    />

                    {/* Container da barra */}
                    <div
                      className="absolute top-0 h-full bg-opacity-30 border-l-2 border-r-2 border-gray-400 rounded flex items-center px-2"
                      style={{
                        left: `${(taskPositions[task.id]?.left || 0)}px`,
                        width: `${taskPositions[task.id]?.width || 0}px`,
                      }}
                    >
                      <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                        {task.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-8 flex flex-wrap gap-4 text-xs border-t pt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span>Completo (100%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <span>Em progresso (50-99%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded" />
          <span>Iniciado (1-49%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded" />
          <span>Não iniciado</span>
        </div>
      </div>
    </div>
  );
}