import React, { useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function GanttTimeline() {
  const [expanded, setExpanded] = React.useState(new Set(['proj-1']));

  const tasks = [
    {
      id: 'proj-1',
      name: 'Projeto Alpha',
      type: 'project',
      progress: null,
      children: [
        {
          id: 'task-1',
          name: 'Planejamento',
          startDay: 0,
          duration: 5,
          progress: 100,
          weight: 0.15,
          dependsOn: [],
        },
        {
          id: 'task-2',
          name: 'Design',
          startDay: 5,
          duration: 8,
          progress: 75,
          weight: 0.25,
          dependsOn: ['task-1'],
        },
        {
          id: 'task-3',
          name: 'Desenvolvimento',
          startDay: 13,
          duration: 15,
          progress: 45,
          weight: 0.4,
          dependsOn: ['task-2'],
        },
        {
          id: 'task-4',
          name: 'Testes',
          startDay: 28,
          duration: 6,
          progress: 0,
          weight: 0.15,
          dependsOn: ['task-3'],
        },
        {
          id: 'task-5',
          name: 'Deploy',
          startDay: 34,
          duration: 2,
          progress: 0,
          weight: 0.05,
          dependsOn: ['task-4'],
        },
      ],
    },
  ];

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
  const totalDays = 36;
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
  }, [pixelsPerDay]);

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
    <div className="w-full p-6 bg-white rounded-lg border border-gray-200">
      <h1 className="text-2xl font-bold mb-6">Gantt Timeline com Progresso Automático</h1>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200">
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
        <div className="flex-1">
          {/* Header com escala */}
          <div className="flex gap-1 mb-4 relative" style={{ width: timelineWidth }}>
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
            className="absolute top-16 left-80"
            width={timelineWidth + 50}
            height={tasks[0].children.length * 50 + 100}
            style={{ pointerEvents: 'none' }}
          >
            {renderDependencyLines()}
          </svg>

          {/* Barras de tarefas */}
          <div className="relative" style={{ width: timelineWidth }}>
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
      <div className="mt-8 flex gap-4 text-xs border-t pt-4">
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