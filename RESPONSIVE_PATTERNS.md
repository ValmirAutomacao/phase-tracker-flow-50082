# Padrões de Responsividade - EngFlow

## Breakpoints do Sistema

- **xs**: 475px (celulares pequenos)
- **sm**: 640px (celulares)
- **md**: 768px (tablets)
- **lg**: 1024px (laptops)
- **xl**: 1280px (desktops)
- **2xl**: 1536px (desktops grandes)

## Padrões Implementados

### Layout Principal
- **Mobile**: Sidebar colapsável, header compacto
- **Desktop**: Sidebar fixa, header completo

### Grids
- **Mobile**: 1 coluna (forçado via CSS)
- **Tablet**: 2-3 colunas
- **Desktop**: 3-4+ colunas

### Cards e Componentes
- **Mobile**: Layout vertical, texto truncado, ações em stack
- **Desktop**: Layout horizontal, texto completo, ações inline

### Formulários e Diálogos (MELHORADO ✅)
- **Mobile**: 
  - Largura 95vw
  - Altura máxima 90vh
  - Conteúdo com scroll interno
  - Botões de ação sticky sempre visíveis no rodapé
  - Layout em coluna única para todos os campos
- **Desktop**: 
  - Largura fixa (max-w-2xl)
  - Altura controlada (max 85vh)
  - Scroll interno quando necessário
  - Botões de ação visíveis

### Estrutura de Formulários
Todos os formulários seguem a estrutura:
```tsx
<form className="flex flex-col h-full">
  <div className="dialog-form-container space-y-4">
    {/* Campos do formulário com scroll */}
  </div>
  <div className="flex justify-end gap-3 form-actions mobile-stack">
    {/* Botões sempre visíveis (sticky) */}
  </div>
</form>
```

### Gantt Timeline
- **Mobile**: Sidebar superior, timeline com scroll horizontal
- **Desktop**: Sidebar lateral, timeline com dependências visíveis

## Classes Comuns Utilizadas

### Containers
- `p-4 sm:p-6` - Padding responsivo
- `space-y-4 sm:space-y-6` - Espaçamento vertical responsivo
- `dialog-form-container` - Container com scroll para conteúdo de formulários

### Layout
- `flex flex-col sm:flex-row` - Layout vertical em mobile, horizontal em desktop
- `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` - Grid responsivo
- `mobile-stack` - Força grid em coluna única no mobile

### Texto
- `text-2xl sm:text-3xl` - Tamanhos de fonte responsivos
- `truncate` - Truncar texto longo
- `hidden sm:inline` - Mostrar/ocultar elementos por breakpoint

### Componentes
- `w-full sm:w-auto` - Largura responsiva
- `gap-2 sm:gap-4` - Espaçamento responsivo
- `min-w-0 flex-1` - Prevenção de overflow
- `form-actions` - Botões de ação sticky no rodapé
- `dialog-content-mobile` - Dialog responsivo

## Features Responsivas

### ✅ Scroll Personalizado
- Scrollbar fina e estilizada
- Cores diferentes para light/dark mode
- Aplicado em containers de formulário

### ✅ Botões Sticky
- Sempre visíveis no rodapé
- Background sólido (white/dark)
- Border superior para separação visual
- Funciona em light e dark mode

### ✅ Dark Mode
- Cores adaptadas para todos os componentes
- Scrollbar com cores apropriadas
- Background dos botões sticky ajustado

## Testes Realizados

✅ Layout principal e sidebar
✅ Grids e cards principais
✅ Formulários e diálogos
✅ Componente Gantt Timeline
✅ Breakpoints consistentes
✅ Botões de rodapé sempre visíveis (NOVO)
✅ Scroll interno em formulários longos (NOVO)
✅ Layout responsivo em todas as resoluções (NOVO)