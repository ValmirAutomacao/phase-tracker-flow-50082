import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingCart, CheckCircle2, Circle } from "lucide-react";
import { ItemCarrinho } from "./CarrinhoItens";

// Interface para itens com status de seleção
export interface ItemSelecionavel extends ItemCarrinho {
  selecionado: boolean;
}

interface SeletorProdutosProps {
  itensRequisicao: ItemCarrinho[];
  itensSelecionados: string[]; // IDs dos itens selecionados
  onSelecaoChange: (itensIds: string[]) => void;
  readonly?: boolean;
}

export function SeletorProdutos({
  itensRequisicao,
  itensSelecionados,
  onSelecaoChange,
  readonly = false
}: SeletorProdutosProps) {
  const [itens, setItens] = useState<ItemSelecionavel[]>([]);

  // Sincronizar itens da requisição com seleção
  useEffect(() => {
    const itensComSelecao: ItemSelecionavel[] = itensRequisicao.map(item => ({
      ...item,
      selecionado: itensSelecionados.includes(item.id)
    }));
    setItens(itensComSelecao);
  }, [itensRequisicao, itensSelecionados]);

  const toggleItemSelecao = (itemId: string) => {
    if (readonly) return;

    const isCurrentlySelected = itensSelecionados.includes(itemId);
    let novosItensSelecionados: string[];

    if (isCurrentlySelected) {
      novosItensSelecionados = itensSelecionados.filter(id => id !== itemId);
    } else {
      novosItensSelecionados = [...itensSelecionados, itemId];
    }

    onSelecaoChange(novosItensSelecionados);
  };

  const selecionarTodos = () => {
    if (readonly) return;

    const todosItensDisponiveis = itens
      .filter(item => item.status === 'pendente')
      .map(item => item.id);
    onSelecaoChange(todosItensDisponiveis);
  };

  const deselecionarTodos = () => {
    if (readonly) return;
    onSelecaoChange([]);
  };

  const itensDisponiveis = itens.filter(item => item.status === 'pendente');
  const itensComprados = itens.filter(item => item.status === 'comprado');
  const totalSelecionados = itensSelecionados.length;

  if (itens.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Itens da Requisição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum item encontrado na requisição</p>
            <p className="text-sm">Selecione uma requisição que contenha itens</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Itens da Requisição
          {totalSelecionados > 0 && (
            <Badge variant="default" className="ml-2">
              {totalSelecionados} selecionado{totalSelecionados !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles de Seleção */}
        {!readonly && itensDisponiveis.length > 0 && (
          <div className="flex gap-2 pb-3 border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={selecionarTodos}
              disabled={itensDisponiveis.length === totalSelecionados}
            >
              Selecionar Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deselecionarTodos}
              disabled={totalSelecionados === 0}
            >
              Limpar Seleção
            </Button>
          </div>
        )}

        {/* Itens Disponíveis (Pendentes) */}
        {itensDisponiveis.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Circle className="h-4 w-4 text-orange-500" />
              Itens Pendentes ({itensDisponiveis.length})
            </h4>
            <div className="space-y-2">
              {itensDisponiveis.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                    item.selecionado
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-background hover:bg-accent/50'
                  } ${readonly ? '' : 'cursor-pointer'}`}
                  onClick={() => !readonly && toggleItemSelecao(item.id)}
                >
                  {!readonly && (
                    <Checkbox
                      checked={item.selecionado}
                      onChange={() => toggleItemSelecao(item.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium">{item.nome}</h5>
                      <Badge variant="secondary" className="text-xs">
                        Qtd: {item.quantidade}
                      </Badge>
                    </div>
                    {item.descricao && (
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {item.descricao}
                      </p>
                    )}
                  </div>

                  {item.selecionado && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Itens já Comprados (Read-only) */}
        {itensComprados.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Itens já Comprados ({itensComprados.length})
            </h4>
            <div className="space-y-2">
              {itensComprados.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg bg-green-50 border-green-200 opacity-75"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500" />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-green-800">{item.nome}</h5>
                      <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                        Qtd: {item.quantidade}
                      </Badge>
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        Comprado
                      </Badge>
                    </div>
                    {item.descricao && (
                      <p className="text-sm text-green-600 truncate max-w-md">
                        {item.descricao}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensagem de Validação */}
        {!readonly && totalSelecionados === 0 && itensDisponiveis.length > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ Selecione pelo menos um item para incluir nesta despesa
            </p>
          </div>
        )}

        {/* Resumo da Seleção */}
        {totalSelecionados > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              📋 {totalSelecionados} item{totalSelecionados !== 1 ? 'ns' : ''} selecionado{totalSelecionados !== 1 ? 's' : ''} para esta despesa
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}