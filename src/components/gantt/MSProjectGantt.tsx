import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronRight, Diamond, CheckCircle2, Plus, Trash2, Link } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tarefa } from "@/services/projectService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export type ViewMode = "day" | "week" | "month" | "quarter";

interface MSProjectGanttProps {
  tasks: Tarefa[];
  dependencies: DependencyInfo[];
  viewMode: ViewMode;
  onTaskClick?: (task: Tarefa) => void;
  onTaskDoubleClick?: (task: Tarefa) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Tarefa>) => void;
  onTaskCreate?: (parentId: string | null) => void;
  onTaskDelete?: (taskId: string) => void;
  onDependencyCreate?: (fromId: string, toId: string, type: string) => void;
  onDependencyDelete?: (depId: string) => void;
  onDateChange?: (taskId: string, start: Date, end: Date) => void;
  editable?: boolean;
}

export interface DependencyInfo {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: string;
  lag: number;
}

interface ProcessedTask extends Tarefa {
  isExpanded?: boolean;
  hasChildren?: boolean;
  children?: ProcessedTask[];
}

interface DragState {
  taskId: string;
  type: "move" | "resize-start" | "resize-end";
  startX: number;
  originalStart: Date;
  originalEnd: Date;
}

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
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  onDependencyCreate,
  onDependencyDelete,
  onDateChange,
  editable = true,
}: MSProjectGanttProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(tasks.map(t => t.id)));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
  const ganttRef = useRef<HTMLDivElement>(null);

  const { flatTasks } = useMemo(() => {
    const taskMap = new Map<string, ProcessedTask>();
    const rootTasks: ProcessedTask[] = [];

    tasks.forEach((t) => {
      taskMap.set(t.id, { ...t, children: [], hasChildren: false, isExpanded: expandedIds.has(t.id) });
    });

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

    const sortTasks = (items: ProcessedTask[]) => {
      items.sort((a, b) => (a.indice || 0) - (b.indice || 0));
      items.forEach(item => { if (item.children) sortTasks(item.children); });
    };
    sortTasks(rootTasks);

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

    return { flatTasks: flatten(rootTasks) };
  }, [tasks, expandedIds]);

  const { startDate, endDate, totalDays } = useMemo(() => {
    if (tasks.length === 0) {
      const now = new Date();
      return { startDate: startOfMonth(now), endDate: endOfMonth(addDays(now, 90)), totalDays: 90 };
    }
    let minDate = new Date();
    let maxDate = new Date();
    tasks.forEach((t) => {
      if (t.data_inicio_planejada) {
        const start = new Date(t.data_inicio_planejada);
        if (start < minDate) minDate = start;
      }
      if (t.data_fim_planejada) {
        const end = new Date(t.data_fim_planejada);
        if (end > maxDate) maxDate = end;
      }
    });
    const paddedStart = addDays(startOfMonth(minDate), -7);
    const paddedEnd = addDays(endOfMonth(maxDate), 14);
    return { startDate: paddedStart, endDate: paddedEnd, totalDays: differenceInDays(paddedEnd, paddedStart) };
  }, [tasks]);

  const timelineHeaders = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    if (viewMode === "day") {
      return days.map((d) => ({ date: d, label: format(d, "dd", { locale: ptBR }), subLabel: format(d, "EEE", { locale: ptBR }), isWeekend: isWeekend(d), width: 30 }));
    }
    if (viewMode === "week") {
      const weeks: { date: Date; label: string; width: number; isWeekend: boolean }[] = [];
      let currentWeek: Date[] = [];
      days.forEach((d, i) => {
        currentWeek.push(d);
        if (d.getDay() === 0 || i === days.length - 1) {
          weeks.push({ date: currentWeek[0], label: `${format(currentWeek[0], "dd/MM")} - ${format(currentWeek[currentWeek.length - 1], "dd/MM")}`, width: currentWeek.length * 20, isWeekend: false });
          currentWeek = [];
        }
      });
      return weeks;
    }
    const months: { date: Date; label: string; width: number; isWeekend: boolean }[] = [];
    let currentMonth: Date[] = [];
    days.forEach((d, i) => {
      if (currentMonth.length === 0 || isSameMonth(d, currentMonth[0])) {
        currentMonth.push(d);
      } else {
        months.push({ date: currentMonth[0], label: format(currentMonth[0], "MMMM yyyy", { locale: ptBR }), width: currentMonth.length * 8, isWeekend: false });
        currentMonth = [d];
      }
      if (i === days.length - 1) {
        months.push({ date: currentMonth[0], label: format(currentMonth[0], "MMMM yyyy", { locale: ptBR }), width: currentMonth.length * 8, isWeekend: false });
      }
    });
    return months;
  }, [startDate, endDate, viewMode]);

  const pixelsPerDay = viewMode === "day" ? 30 : viewMode === "week" ? 20 : 8;
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

  const getTaskBarStyle = (task: Tarefa) => {
    if (!task.data_inicio_planejada || !task.data_fim_planejada) return { left: 0, width: 0 };
    const taskStart = new Date(task.data_inicio_planejada);
    const taskEnd = new Date(task.data_fim_planejada);
    const startOffset = differenceInDays(taskStart, startDate);
    const duration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);
    return { left: startOffset * pixelsPerDay, width: duration * pixelsPerDay - 4 };
  };

  const startEditing = (taskId: string, field: string, currentValue: string) => {
    if (!editable) return;
    setEditingCell({ taskId, field });
    setEditValue(currentValue);
  };

  const commitEdit = () => {
    if (!editingCell || !onTaskUpdate) return;
    const { taskId, field } = editingCell;
    const updates: Partial<Tarefa> = {};
    if (field === "nome") updates.nome = editValue;
    else if (field === "duracao") {
      const duracao = parseInt(editValue) || 1;
      updates.duracao_dias = duracao;
      const task = tasks.find(t => t.id === taskId);
      if (task?.data_inicio_planejada) {
        updates.data_fim_planejada = format(addDays(new Date(task.data_inicio_planejada), duracao - 1), "yyyy-MM-dd");
      }
    } else if (field === "percentual") {
      updates.percentual_concluido = Math.min(100, Math.max(0, parseInt(editValue) || 0));
    }
    onTaskUpdate(taskId, updates);
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitEdit();
    else if (e.key === "Escape") { setEditingCell(null); setEditValue(""); }
  };

  const handleDateChange = (taskId: string, field: "start" | "end", date: Date | undefined) => {
    if (!date || !onTaskUpdate) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updates: Partial<Tarefa> = {};
    if (field === "start") {
      updates.data_inicio_planejada = format(date, "yyyy-MM-dd");
      if (task.data_fim_planejada && task.data_inicio_planejada) {
        const duration = differenceInDays(new Date(task.data_fim_planejada), new Date(task.data_inicio_planejada));
        updates.data_fim_planejada = format(addDays(date, duration), "yyyy-MM-dd");
      }
    } else {
      updates.data_fim_planejada = format(date, "yyyy-MM-dd");
      if (task.data_inicio_planejada) {
        updates.duracao_dias = differenceInDays(date, new Date(task.data_inicio_planejada)) + 1;
      }
    }
    onTaskUpdate(taskId, updates);
  };

  const handleBarMouseDown = (e: React.MouseEvent, task: Tarefa, type: "move" | "resize-start" | "resize-end") => {
    if (!editable || !task.data_inicio_planejada || !task.data_fim_planejada) return;
    e.preventDefault();
    e.stopPropagation();
    setDragState({ taskId: task.id, type, startX: e.clientX, originalStart: new Date(task.data_inicio_planejada), originalEnd: new Date(task.data_fim_planejada) });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState || !onTaskUpdate) return;
    const deltaX = e.clientX - dragState.startX;
    const daysDelta = Math.round(deltaX / pixelsPerDay);
    if (daysDelta === 0) return;
    const updates: Partial<Tarefa> = {};
    if (dragState.type === "move") {
      updates.data_inicio_planejada = format(addDays(dragState.originalStart, daysDelta), "yyyy-MM-dd");
      updates.data_fim_planejada = format(addDays(dragState.originalEnd, daysDelta), "yyyy-MM-dd");
    } else if (dragState.type === "resize-start") {
      const newStart = addDays(dragState.originalStart, daysDelta);
      if (newStart < dragState.originalEnd) {
        updates.data_inicio_planejada = format(newStart, "yyyy-MM-dd");
        updates.duracao_dias = differenceInDays(dragState.originalEnd, newStart) + 1;
      }
    } else if (dragState.type === "resize-end") {
      const newEnd = addDays(dragState.originalEnd, daysDelta);
      if (newEnd > dragState.originalStart) {
        updates.data_fim_planejada = format(newEnd, "yyyy-MM-dd");
        updates.duracao_dias = differenceInDays(newEnd, dragState.originalStart) + 1;
      }
    }
    onTaskUpdate(dragState.taskId, updates);
  }, [dragState, pixelsPerDay, onTaskUpdate]);

  const handleMouseUp = useCallback(() => { setDragState(null); }, []);

  useEffect(() => {
    if (dragState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  const handleLinkEnd = (taskId: string) => {
    if (!editable || !linkingFrom || !onDependencyCreate) return;
    if (linkingFrom !== taskId) onDependencyCreate(linkingFrom, taskId, "FS");
    setLinkingFrom(null);
  };

  const renderDependencyLines = () => {
    return dependencies.map((dep) => {
      const fromIndex = flatTasks.findIndex((t) => t.id === dep.fromTaskId);
      const toIndex = flatTasks.findIndex((t) => t.id === dep.toTaskId);
      if (fromIndex === -1 || toIndex === -1) return null;
      const fromBar = getTaskBarStyle(flatTasks[fromIndex]);
      const toBar = getTaskBarStyle(flatTasks[toIndex]);
      const fromY = fromIndex * rowHeight + rowHeight / 2;
      const toY = toIndex * rowHeight + rowHeight / 2;
      const fromX = fromBar.left + fromBar.width;
      const toX = toBar.left;
      const midX = (fromX + toX) / 2;
      return (
        <g key={dep.id} className="cursor-pointer" onClick={() => editable && onDependencyDelete?.(dep.id)}>
          <path d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX - 5} ${toY}`} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.5" />
          <polygon points={`${toX},${toY} ${toX - 6},${toY - 4} ${toX - 6},${toY + 4}`} fill="hsl(var(--muted-foreground))" opacity="0.5" />
        </g>
      );
    });
  };

  const columns = { wbs: 60, name: 180, duration: 60, start: 90, end: 90, progress: 50, predecessors: 80 };
  const gridWidth = Object.values(columns).reduce((a, b) => a + b, 0);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background border rounded-lg overflow-hidden">
        {editable && (
          <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
            <Button size="sm" variant="outline" onClick={() => onTaskCreate?.(null)}><Plus className="h-4 w-4 mr-1" />Nova Tarefa</Button>
            {selectedTaskId && (
              <>
                <Button size="sm" variant="outline" onClick={() => onTaskCreate?.(selectedTaskId)}><Plus className="h-4 w-4 mr-1" />Subtarefa</Button>
                <Button size="sm" variant={linkingFrom ? "default" : "outline"} onClick={() => linkingFrom ? setLinkingFrom(null) : setLinkingFrom(selectedTaskId)}><Link className="h-4 w-4 mr-1" />{linkingFrom ? "Cancelar" : "Vincular"}</Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => onTaskDelete?.(selectedTaskId)}><Trash2 className="h-4 w-4 mr-1" />Excluir</Button>
              </>
            )}
          </div>
        )}
        <div className="flex border-b bg-muted/30">
          <div className="flex border-r bg-muted/50 text-xs font-medium">
            <div className="px-2 py-2 border-r" style={{ width: columns.wbs }}>WBS</div>
            <div className="px-2 py-2 border-r" style={{ width: columns.name }}>Nome da Tarefa</div>
            <div className="px-2 py-2 border-r text-center" style={{ width: columns.duration }}>Duração</div>
            <div className="px-2 py-2 border-r text-center" style={{ width: columns.start }}>Início</div>
            <div className="px-2 py-2 border-r text-center" style={{ width: columns.end }}>Término</div>
            <div className="px-2 py-2 border-r text-center" style={{ width: columns.progress }}>%</div>
            <div className="px-2 py-2 text-center" style={{ width: columns.predecessors }}>Predec.</div>
          </div>
          <ScrollArea className="flex-1" type="always">
            <div className="flex" style={{ width: totalWidth }}>
              {timelineHeaders.map((header, i) => (
                <div key={i} className={cn("flex-shrink-0 border-r text-center text-xs py-1", header.isWeekend && "bg-muted/50")} style={{ width: header.width }}>
                  <div className="font-medium truncate px-1">{header.label}</div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <ScrollArea className="border-r" style={{ width: gridWidth }}>
            {flatTasks.map((task, index) => {
              const taskDeps = dependencies.filter(d => d.toTaskId === task.id);
              const predecessorText = taskDeps.map(d => { const pt = flatTasks.find(t => t.id === d.fromTaskId); return pt?.ordem_wbs || String(pt?.indice) || ""; }).join(", ");
              return (
                <div key={task.id} className={cn("flex items-center border-b text-xs cursor-pointer", index % 2 === 0 ? "bg-background" : "bg-muted/20", selectedTaskId === task.id && "bg-primary/10 ring-1 ring-primary/30")} style={{ height: rowHeight }} onClick={() => { if (linkingFrom) handleLinkEnd(task.id); else { setSelectedTaskId(task.id); onTaskClick?.(task); } }} onDoubleClick={() => onTaskDoubleClick?.(task)}>
                  <div className="px-2 border-r h-full flex items-center text-muted-foreground" style={{ width: columns.wbs, paddingLeft: 8 + (task.nivel || 0) * 12 }}>
                    {task.hasChildren && <button onClick={(e) => { e.stopPropagation(); toggleExpand(task.id); }} className="p-0.5 hover:bg-muted rounded mr-1">{expandedIds.has(task.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}</button>}
                    <span className="truncate">{task.ordem_wbs || task.indice}</span>
                  </div>
                  <div className="px-2 border-r h-full flex items-center gap-1" style={{ width: columns.name }}>
                    {task.tipo === "marco" && <Diamond className="h-3 w-3 text-amber-500" />}
                    {editingCell?.taskId === task.id && editingCell.field === "nome" ? <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={handleKeyDown} className="h-6 text-xs" autoFocus /> : <span className={cn("truncate flex-1", task.tipo === "etapa" && "font-semibold")} onDoubleClick={(e) => { e.stopPropagation(); startEditing(task.id, "nome", task.nome); }}>{task.nome}</span>}
                  </div>
                  <div className="px-2 border-r h-full flex items-center justify-center" style={{ width: columns.duration }}>
                    {editingCell?.taskId === task.id && editingCell.field === "duracao" ? <Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={handleKeyDown} className="h-6 text-xs w-12 text-center" autoFocus /> : <span className="cursor-pointer hover:text-primary" onDoubleClick={(e) => { e.stopPropagation(); startEditing(task.id, "duracao", String(task.duracao_dias || 1)); }}>{task.duracao_dias || 1}d</span>}
                  </div>
                  <div className="px-1 border-r h-full flex items-center justify-center" style={{ width: columns.start }}>
                    {editable ? <Popover><PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-6 px-1 text-xs">{task.data_inicio_planejada ? format(new Date(task.data_inicio_planejada), "dd/MM/yy") : "-"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><CalendarComponent mode="single" selected={task.data_inicio_planejada ? new Date(task.data_inicio_planejada) : undefined} onSelect={(date) => handleDateChange(task.id, "start", date)} initialFocus className="p-3 pointer-events-auto" /></PopoverContent></Popover> : <span>{task.data_inicio_planejada ? format(new Date(task.data_inicio_planejada), "dd/MM/yy") : "-"}</span>}
                  </div>
                  <div className="px-1 border-r h-full flex items-center justify-center" style={{ width: columns.end }}>
                    {editable ? <Popover><PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-6 px-1 text-xs">{task.data_fim_planejada ? format(new Date(task.data_fim_planejada), "dd/MM/yy") : "-"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><CalendarComponent mode="single" selected={task.data_fim_planejada ? new Date(task.data_fim_planejada) : undefined} onSelect={(date) => handleDateChange(task.id, "end", date)} initialFocus className="p-3 pointer-events-auto" /></PopoverContent></Popover> : <span>{task.data_fim_planejada ? format(new Date(task.data_fim_planejada), "dd/MM/yy") : "-"}</span>}
                  </div>
                  <div className="px-2 border-r h-full flex items-center justify-center" style={{ width: columns.progress }}>
                    {editingCell?.taskId === task.id && editingCell.field === "percentual" ? <Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={handleKeyDown} className="h-6 text-xs w-10 text-center" autoFocus /> : <span className="cursor-pointer hover:text-primary" onDoubleClick={(e) => { e.stopPropagation(); startEditing(task.id, "percentual", String(task.percentual_concluido || 0)); }}>{task.percentual_concluido || 0}%</span>}
                  </div>
                  <div className="px-2 h-full flex items-center justify-center text-muted-foreground" style={{ width: columns.predecessors }}><span className="truncate">{predecessorText || "-"}</span></div>
                </div>
              );
            })}
          </ScrollArea>
          <ScrollArea className="flex-1" type="always">
            <div ref={ganttRef} className="relative" style={{ width: totalWidth, height: flatTasks.length * rowHeight }}>
              {timelineHeaders.map((header, i) => { let offset = 0; for (let j = 0; j < i; j++) offset += timelineHeaders[j].width; return <div key={i} className={cn("absolute top-0 bottom-0 border-r border-border/30", header.isWeekend && "bg-muted/30")} style={{ left: offset, width: header.width }} />; })}
              {flatTasks.map((_, index) => <div key={index} className={cn("absolute left-0 right-0 border-b border-border/20", index % 2 === 0 ? "bg-transparent" : "bg-muted/10")} style={{ top: index * rowHeight, height: rowHeight }} />)}
              <svg className="absolute inset-0" width={totalWidth} height={flatTasks.length * rowHeight} style={{ pointerEvents: editable ? "auto" : "none" }}>{renderDependencyLines()}</svg>
              {flatTasks.map((task, index) => {
                const barStyle = getTaskBarStyle(task);
                if (barStyle.width === 0) return null;
                const isSelected = selectedTaskId === task.id;
                return (
                  <Tooltip key={task.id}>
                    <TooltipTrigger asChild>
                      <div className={cn("absolute rounded transition-all group", task.tipo === "marco" ? "flex items-center justify-center" : getTaskColor(task), isSelected && "ring-2 ring-primary", editable && "cursor-grab")} style={{ left: barStyle.left, top: index * rowHeight + (task.tipo === "marco" ? 8 : 10), width: task.tipo === "marco" ? 20 : barStyle.width, height: task.tipo === "marco" ? 20 : 16, transform: task.tipo === "marco" ? "rotate(45deg)" : undefined }} onClick={(e) => { e.stopPropagation(); if (linkingFrom) handleLinkEnd(task.id); else { setSelectedTaskId(task.id); onTaskClick?.(task); } }} onMouseDown={(e) => handleBarMouseDown(e, task, "move")}>
                        {task.tipo !== "marco" && (
                          <>
                            {editable && <><div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 opacity-0 group-hover:opacity-100" onMouseDown={(e) => handleBarMouseDown(e, task, "resize-start")} /><div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 opacity-0 group-hover:opacity-100" onMouseDown={(e) => handleBarMouseDown(e, task, "resize-end")} /></>}
                            <div className={cn("absolute left-0 top-0 bottom-0 rounded", getProgressColor(task))} style={{ width: `${task.percentual_concluido}%` }} />
                            <span className="absolute inset-0 flex items-center px-2 text-[10px] text-white font-medium truncate z-10">{barStyle.width > 80 ? task.nome : ""}</span>
                          </>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top"><p className="font-semibold">{task.nome}</p><p className="text-xs">{task.data_inicio_planejada && format(new Date(task.data_inicio_planejada), "dd/MM/yyyy")} → {task.data_fim_planejada && format(new Date(task.data_fim_planejada), "dd/MM/yyyy")}</p><p className="text-xs">Progresso: {task.percentual_concluido}%</p></TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500" /><span>Concluído</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-sky-500" /><span>Em progresso</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-400" /><span>Iniciado</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-400" /><span>Não iniciado</span></div>
            <div className="flex items-center gap-1.5"><Diamond className="w-3 h-3 text-amber-500" /><span>Marco</span></div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground"><span>{flatTasks.length} tarefas</span><span>•</span><span>{dependencies.length} dependências</span></div>
        </div>
      </div>
    </TooltipProvider>
  );
}
