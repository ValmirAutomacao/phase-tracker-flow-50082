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
- **Mobile**: 1-2 colunas
- **Tablet**: 2-3 colunas
- **Desktop**: 3-4+ colunas

### Cards e Componentes
- **Mobile**: Layout vertical, texto truncado, ações em stack
- **Desktop**: Layout horizontal, texto completo, ações inline

### Formulários e Diálogos
- **Mobile**: Largura total da viewport, scroll vertical
- **Desktop**: Largura fixa, altura controlada

### Gantt Timeline
- **Mobile**: Sidebar superior, timeline com scroll horizontal
- **Desktop**: Sidebar lateral, timeline com dependências visíveis

## Classes Comuns Utilizadas

### Containers
- `p-4 sm:p-6` - Padding responsivo
- `space-y-4 sm:space-y-6` - Espaçamento vertical responsivo

### Layout
- `flex flex-col sm:flex-row` - Layout vertical em mobile, horizontal em desktop
- `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` - Grid responsivo

### Texto
- `text-2xl sm:text-3xl` - Tamanhos de fonte responsivos
- `truncate` - Truncar texto longo
- `hidden sm:inline` - Mostrar/ocultar elementos por breakpoint

### Componentes
- `w-full sm:w-auto` - Largura responsiva
- `gap-2 sm:gap-4` - Espaçamento responsivo
- `min-w-0 flex-1` - Prevenção de overflow

## Testes Realizados

✅ Layout principal e sidebar
✅ Grids e cards principais
✅ Formulários e diálogos
✅ Componente Gantt Timeline
✅ Breakpoints consistentes