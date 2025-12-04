import React, { useState } from "react";
import { useTaskResources } from "@/hooks/useTaskResources";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, UserPlus, HardHat } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskResourcesTabProps {
  tarefaId: string;
}

export function TaskResourcesTab({ tarefaId }: TaskResourcesTabProps) {
  const { recursos, isLoading, addRecurso, removeRecurso, isAdding } = useTaskResources(tarefaId);
  
  // Buscar lista de funcionários para o select
  const { data: funcionarios = [] } = useSupabaseQuery<any>('FUNCIONARIOS');

  // Form state
  const [selectedFuncionario, setSelectedFuncionario] = useState("");
  const [qtd, setQtd] = useState("1");
  const [custoUnitario, setCustoUnitario] = useState("0");

  const handleAdd = () => {
    if (!selectedFuncionario) return;

    const func = funcionarios.find((f: any) => f.id === selectedFuncionario);
    
    addRecurso({
      tarefa_id: tarefaId,
      tipo_recurso: 'humano',
      funcionario_id: selectedFuncionario,
      unidade_medida: 'horas',
      quantidade_planejada: Number(qtd),
      custo_unitario: Number(custoUnitario),
    });

    // Reset form
    setSelectedFuncionario("");
    setQtd("1");
    setCustoUnitario("0");
  };

  if (isLoading) {
    return <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
  }

  return (
    <div className="space-y-6 py-4">
      {/* Formulário de Adição */}
      <div className="grid gap-4 p-4 border rounded-lg bg-muted/30">
        <h4 className="font-medium flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Adicionar Recurso
        </h4>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Funcionário / Recurso</Label>
            <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {funcionarios.map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Horas Est.</Label>
              <Input 
                type="number" 
                min="1" 
                value={qtd} 
                onChange={(e) => setQtd(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Custo/Hora</Label>
              <Input 
                type="number" 
                min="0" 
                step="0.01"
                value={custoUnitario} 
                onChange={(e) => setCustoUnitario(e.target.value)} 
              />
            </div>
          </div>
        </div>

        <Button onClick={handleAdd} disabled={!selectedFuncionario || isAdding} size="sm" className="w-full sm:w-auto ml-auto">
          {isAdding ? "Adicionando..." : "Vincular Recurso"}
        </Button>
      </div>

      {/* Lista de Recursos */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Recursos Alocados ({recursos.length})
        </h4>
        
        {recursos.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
            Nenhum recurso vinculado a esta tarefa.
          </p>
        )}

        {recursos.map((rec: any) => (
          <Card key={rec.id} className="overflow-hidden">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                  <HardHat className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">{rec.funcionario?.nome || "Recurso Externo"}</p>
                  <p className="text-xs text-muted-foreground">
                    {rec.quantidade_planejada} {rec.unidade_medida} x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rec.custo_unitario)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right mr-2 hidden sm:block">
                  <span className="block font-bold text-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rec.custo_total_planejado)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Custo Total</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => removeRecurso(rec.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
