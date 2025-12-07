import React, { useMemo, useState, useRef, useEffect } from "react";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronRight, Diamond, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tarefa } from "@/services/projectService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export type ViewMode = "day" | "week" | "month" | "quarter";

interface MSProjectGanttProps {
  tasks: Tarefa[];
  dependencies: DependencyInfo[];
  viewMode: ViewMode;
  onTaskClick?: (task: Tarefa) => void;
  onTaskDoubleClick?: (task: Tarefa) => void;
  onDateChange?: (taskId: string, start: Date, end: Date) => void;
}

interface DependencyInfo {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: string; // FS, SS, FF, SF
  lag: number;
}

interface ProcessedTask extends Tarefa {
  isExpanded?: boolean;
  hasChildren?: boolean;
  children?: ProcessedTask[];
}

// Cores por tipo/status
const getTaskColor = (task: Tarefa) => {
  if (task.tipo === "marco") return "bg-amber-500";
  if (task.tipo === "etapa") return "bg-primary/80";
  if (task.percentual_concluido === 100) return "bg-emerald-500";
  if (task.percentual_concluido >= 50) return "bg-sky-500";
  if (task.percentual_concluido > 0) return "bg-amber-400";
  return "bg-slate-400";
};

const getProgressColor = (task: Tarefa) => {
  if (task.percentual_concluido === 100) return "bg-emerald-600";
  if (task.percentual_concluido >= 50) return "bg-sky-600";
  return "bg-amber-500";
};

export function MSProjectGantt({
  tasks,
  dependencies,
  viewMode,
  onTaskClick,
  onTaskDoubleClick,
  onDateChange,
}: MSProjectGanttProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const ganttRef = useRef<HTMLDivElement>(null);

  // Process tasks into hierarchical structure
  const { processedTasks, flatTasks } = useMemo(() => {
    const taskMap = new Map<string, ProcessedTask>();
    const rootTasks: ProcessedTask[] = [];

    // First pass: create task map
    tasks.forEach((t) => {
      taskMap.set(t.id, { ...t, children: [], hasChildren: false, isExpanded: expandedIds.has(t.id) });
    });

    // Second pass: build hierarchy
    tasks.forEach((t) => {
      const processed = taskMap.get(t.id)!;
      if (t.parent_id && taskMap.has(t.parent_id)) {
        const parent = taskMap.get(t.parent_id)!;
        parent.children!.push(processed);
        parent.hasChildren = true;
      } else {
        rootTasks.push(processed);
      }
    });

    // Flatten for display (respecting expansion)
    const flatten = (items: ProcessedTask[], level = 0): ProcessedTask[] => {
      let result: ProcessedTask[] = [];
      items.forEach((item) => {
        result.push({ ...item, nivel: level });
        if (item.hasChildren && expandedIds.has(item.id)) {
          result = result.concat(flatten(item.children || [], level + 1));
        }
      });
      return result;
    };

    return {
      processedTasks: rootTasks,
      flatTasks: flatten(rootTasks),
    };
  }, [tasks, expandedIds]);

  // Calculate timeline boundaries
  const { startDate, endDate, totalDays } = useMemo(() => {
    if (tasks.length === 0) {
      const now = new Date();
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(addDays(now, 90)),
        totalDays: 90,
      };
    }

    let minDate = new Date();
    let maxDate = new Date();

    tasks.forEach((t) => {
      if (t.data_inicio_planejada) {
        const start = new Date(t.data_inicio_planejada);
        if (!minDate || start < minDate) minDate = start;
      }
      if (t.data_fim_planejada) {
        const end = new Date(t.data_fim_planejada);
        if (!maxDate || end > maxDate) maxDate = end;
      }
    });

    // Add padding
    const paddedStart = addDays(startOfMonth(minDate), -7);
    const paddedEnd = addDays(endOfMonth(maxDate), 14);

    return {
      startDate: paddedStart,
      endDate: paddedEnd,
      totalDays: differenceInDays(paddedEnd, paddedStart),
    };
  }, [tasks]);

  // Generate timeline headers based on view mode
  const timelineHeaders = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    if (viewMode === "day") {
      return days.map((d) => ({
        date: d,
        label: format(d, "dd", { locale: ptBR }),
        subLabel: format(d, "EEE", { locale: ptBR }),
        isWeekend: isWeekend(d),
        width: 30,
      }));
    }
    
    if (viewMode === "week") {
      const weeks: { date: Date; label: string; width: number; isWeekend: boolean; subLabel?: string }[] = [];
      let currentWeek: Date[] = [];
      
      days.forEach((d, i) => {
        currentWeek.push(d);
        if (d.getDay() === 0 || i === days.length - 1) {
          weeks.push({
            date: currentWeek[0],
            label: `${format(currentWeek[0], "dd/MM")} - ${format(currentWeek[currentWeek.length - 1], "dd/MM")}`,
            width: currentWeek.length * 20,
            isWeekend: false,
          });
          currentWeek = [];
        }
      });
      return weeks;
    }
    
    // Month view
    const months: { date: Date; label: string; width: number; isWeekend: boolean; subLabel?: string }[] = [];
    let currentMonth: Date[] = [];
    
    days.forEach((d, i) => {
      if (currentMonth.length === 0 || isSameMonth(d, currentMonth[0])) {
        currentMonth.push(d);
      } else {
        months.push({
          date: currentMonth[0],
          label: format(currentMonth[0], "MMMM yyyy", { locale: ptBR }),
          width: currentMonth.length * (viewMode === "month" ? 8 : 4),
          isWeekend: false,
        });
        currentMonth = [d];
      }
      
      if (i === days.length - 1) {
        months.push({
          date: currentMonth[0],
          label: format(currentMonth[0], "MMMM yyyy", { locale: ptBR }),
          width: currentMonth.length * (viewMode === "month" ? 8 : 4),
          isWeekend: false,
        });
      }
    });
    
    return months;
  }, [startDate, endDate, viewMode]);

  const pixelsPerDay = viewMode === "day" ? 30 : viewMode === "week" ? 20 : viewMode === "month" ? 8 : 4;
  const totalWidth = totalDays * pixelsPerDay;
  const rowHeight = 36;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Calculate task bar position
  const getTaskBarStyle = (task: Tarefa) => {
    if (!task.data_inicio_planejada || !task.data_fim_planejada) {
      return { left: 0, width: 0 };
    }

    const taskStart = new Date(task.data_inicio_planejada);
    const taskEnd = new Date(task.data_fim_planejada);
    
    const startOffset = differenceInDays(taskStart, startDate);
    const duration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);

    return {
      left: startOffset * pixelsPerDay,
      width: duration * pixelsPerDay - 4,
    };
  };

  // Render dependency lines
  const renderDependencyLines = () => {
    if (!ganttRef.current) return null;

    return dependencies.map((dep) => {
      const fromIndex = flatTasks.findIndex((t) => t.id === dep.fromTaskId);
      const toIndex = flatTasks.findIndex((t) => t.id === dep.toTaskId);

      if (fromIndex === -1 || toIndex === -1) return null;

      const fromTask = flatTasks[fromIndex];
      const toTask = flatTasks[toIndex];

      const fromBar = getTaskBarStyle(fromTask);
      const toBar = getTaskBarStyle(toTask);

      const fromY = fromIndex * rowHeight + rowHeight / 2;
      const toY = toIndex * rowHeight + rowHeight / 2;

      // FS: End of from -> Start of to
      const fromX = fromBar.left + fromBar.width;
      const toX = toBar.left;

      const midX = fromX + 15;

      return (
        <g key={dep.id}>
          <path
            d={`M ${fromX} ${fromY} 
                L ${midX} ${fromY} 
                L ${midX} ${toY} 
                L ${toX - 5} ${toY}`}
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <polygon
            points={`${toX},${toY} ${toX - 6},${toY - 4} ${toX - 6},${toY + 4}`}
            fill="hsl(var(--muted-foreground))"
            opacity="0.5"
          />
        </g>
      );
    });
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background border rounded-lg overflow-hidden">
        {/* Headers */}
        <div className="flex border-b bg-muted/30">
          {/* Task list header */}
          <div className="w-[300px] min-w-[300px] border-r px-3 py-2 font-medium text-sm bg-muted/50">
            Nome da Tarefa
          </div>

          {/* Timeline header */}
          <ScrollArea className="flex-1" type="always">
            <div className="flex" style={{ width: totalWidth }}>
              {timelineHeaders.map((header, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-shrink-0 border-r text-center text-xs py-1",
                    header.isWeekend && "bg-muted/50"
                  )}
                  style={{ width: header.width }}
                >
                  <div className="font-medium truncate px-1">{header.label}</div>
                  {header.subLabel && (
                    <div className="text-muted-foreground text-[10px]">{header.subLabel}</div>
                  )}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Task list */}
          <ScrollArea className="w-[300px] min-w-[300px] border-r">
            {flatTasks.map((task, index) => (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-2 px-2 border-b hover:bg-muted/50 cursor-pointer",
                  index % 2 === 0 ? "bg-background" : "bg-muted/20"
                )}
                style={{ height: rowHeight, paddingLeft: 8 + task.nivel * 20 }}
                onClick={() => onTaskClick?.(task)}
                onDoubleClick={() => onTaskDoubleClick?.(task)}
              >
                {/* Expand/Collapse */}
                {task.hasChildren ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(task.id);
                    }}
                    className="p-0.5 hover:bg-muted rounded"
                  >
                    {expandedIds.has(task.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <span className="w-5" />
                )}

                {/* Task icon */}
                {task.tipo === "marco" ? (
                  <Diamond className="h-4 w-4 text-amber-500" />
                ) : task.percentual_concluido === 100 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : null}

                {/* Task name */}
                <span className={cn("text-sm truncate flex-1", task.tipo === "etapa" && "font-semibold")}>
                  {task.nome}
                </span>

                {/* Progress badge */}
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {task.percentual_concluido}%
                </span>
              </div>
            ))}
          </ScrollArea>

          {/* Gantt chart area */}
          <ScrollArea className="flex-1" type="always">
            <div
              ref={ganttRef}
              className="relative"
              style={{ width: totalWidth, height: flatTasks.length * rowHeight }}
            >
              {/* Background grid */}
              {timelineHeaders.map((header, i) => {
                let offset = 0;
                for (let j = 0; j < i; j++) {
                  offset += timelineHeaders[j].width;
                }
                return (
                  <div
                    key={i}
                    className={cn(
                      "absolute top-0 bottom-0 border-r border-border/30",
                      header.isWeekend && "bg-muted/30"
                    )}
                    style={{ left: offset, width: header.width }}
                  />
                );
              })}

              {/* Row backgrounds */}
              {flatTasks.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "absolute left-0 right-0 border-b border-border/20",
                    index % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                  )}
                  style={{ top: index * rowHeight, height: rowHeight }}
                />
              ))}

              {/* Dependency lines */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width={totalWidth}
                height={flatTasks.length * rowHeight}
              >
                {renderDependencyLines()}
              </svg>

              {/* Task bars */}
              {flatTasks.map((task, index) => {
                const barStyle = getTaskBarStyle(task);
                
                if (barStyle.width === 0) return null;

                return (
                  <Tooltip key={task.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "absolute rounded cursor-pointer transition-all hover:opacity-90 hover:shadow-md",
                          task.tipo === "marco" ? "flex items-center justify-center" : getTaskColor(task)
                        )}
                        style={{
                          left: barStyle.left,
                          top: index * rowHeight + (task.tipo === "marco" ? 8 : 10),
                          width: task.tipo === "marco" ? 20 : barStyle.width,
                          height: task.tipo === "marco" ? 20 : 16,
                          transform: task.tipo === "marco" ? "rotate(45deg)" : undefined,
                        }}
                        onClick={() => onTaskClick?.(task)}
                        onDoubleClick={() => onTaskDoubleClick?.(task)}
                      >
                        {task.tipo !== "marco" && (
                          <>
                            {/* Progress bar */}
                            <div
                              className={cn("absolute left-0 top-0 bottom-0 rounded", getProgressColor(task))}
                              style={{ width: `${task.percentual_concluido}%` }}
                            />
                            {/* Task name on bar */}
                            <span className="absolute inset-0 flex items-center px-2 text-[10px] text-white font-medium truncate z-10">
                              {barStyle.width > 80 ? task.nome : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold">{task.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.data_inicio_planejada && format(new Date(task.data_inicio_planejada), "dd/MM/yyyy")}
                          {" → "}
                          {task.data_fim_planejada && format(new Date(task.data_fim_planejada), "dd/MM/yyyy")}
                        </p>
                        <p className="text-xs">Progresso: {task.percentual_concluido}%</p>
                        {task.descricao && (
                          <p className="text-xs text-muted-foreground">{task.descricao}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2 border-t bg-muted/20 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span>Concluído</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-sky-500" />
            <span>Em progresso</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-400" />
            <span>Iniciado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-400" />
            <span>Não iniciado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Diamond className="h-3 w-3 text-amber-500" />
            <span>Marco</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/80" />
            <span>Etapa/Fase</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
