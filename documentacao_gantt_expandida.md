
# Documentação Completa – Módulo de Cronograma Gantt (Arquitetura & Engenharia) – Versão Expandida

## 1. Traduções Técnicas
- **Finish to Start (FS)** → *Término-Para-Início (TI)*  
- **Start to Start (SS)** → *Início-Para-Início (II)*  
- **Finish to Finish (FF)** → *Término-Para-Término (TT)*  
- **Start to Finish (SF)** → *Início-Para-Término (IT)*  

---

# 2. Módulos e Cadastros Necessários

Para atingir o nível de complexidade e qualidade visual do MS Project, o sistema deve conter os seguintes módulos:

## 2.1. Módulo: Projetos / Obras  
Gerencia informações gerais de cada obra.

### Campos:
- Nome do Projeto  
- Cliente  
- Endereço  
- Responsável  
- Data de Início  
- Data Prevista de Término  
- Status da Obra  
- Orçamento (opcional)

### Funcionalidades:
- Criar, editar e arquivar projetos  
- Acessar o cronograma completo da obra  
- Visualizar progresso geral  

---

## 2.2. Módulo: Fases (Macroetapas)
Representam os grandes estágios do projeto.

### Campos:
- Nome da fase  
- Ordem  
- Data de início (automática ou manual)  
- Data de término (automática ou manual)

### Funcionalidades:
- Criar fases  
- Reordenar fases  
- Expandir / recolher no Gantt  
- Associar tarefas internas  

---

## 2.3. Módulo: Tarefas
O coração do cronograma.

### Campos:
- Nome  
- Responsável  
- Fase  
- Data de início  
- Data de término  
- Duração  
- % de progresso  
- Tipo de tarefa (atividade, entrega, revisão etc.)  
- Cor da barra  
- Observações  

### Funcionalidades:
- Criar, editar e excluir  
- Arrastar no gráfico  
- Redimensionar duração  
- Exibir barra colorida  
- Associar dependências  
- Atribuir marcos  

---

## 2.4. Módulo: Dependências
Define relação entre tarefas.

### Tipos:
- TI – Término-Para-Início  
- II – Início-Para-Início  
- TT – Término-Para-Término  
- IT – Início-Para-Término

### Funcionalidades:
- Criar dependência  
- Visualizar dependências no Gantt  
- Recalcular tarefas sucessoras  
- Evitar dependências circulares  

---

## 2.5. Módulo: Marcos (Milestones)
Representam eventos importantes, sem duração.

### Campos:
- Nome  
- Data  
- Fase (opcional)  
- Cor  

### Funcionalidades:
- Criar marcos  
- Exibir ♦ no gráfico  
- Associar a entregas principais  

---

## 2.6. Módulo: Responsáveis
Cadastro de pessoas e equipes envolvidas.

### Campos:
- Nome  
- Função  
- Disciplina (Arquitetura, Estrutural, Hidráulica etc.)  
- Tipo (Interno/Externo)

### Funcionalidades:
- Listar responsáveis  
- Atribuir tarefas  
- Ver tarefas por responsável  

---

## 2.7. Módulo: Relatórios e Exportações
### Funcionalidades:
- Exportar Gantt para PDF  
- Exportar imagem  
- Gerar relatório por fase  
- Relatório por responsável  
- Relatório de atrasos  

---

# 3. Modelo Completo de Documentação Funcional

*(Conteúdo mantido e ampliado)*

## 3.1. Visão Geral
O módulo deve permitir planejamento visual e acompanhamento completo de obras via gráfico Gantt.

## 3.2. Objetivos
- Planejar cronogramas  
- Controlar progresso  
- Obter visualização gráfica completa  
- Exportar cronogramas  
- Engajar equipes  

---

# 4. Telas do Sistema

*(mantido e ampliado)*

## 4.1. Tela: Lista de Obras  
(...)

## 4.2. Tela: Dashboard  
(...)

## 4.3. Tela: Gantt (principal)
Agora complementada com:

### Modos adicionais:
- Filtrar tarefas por responsável  
- Filtrar por fase  
- Mostrar/esconder dependências  
- Agrupamento visual por equipe  
- Exibição do caminho crítico (opcional)

### Painel lateral opcional:
- Tarefas em atraso  
- Últimas alterações  
- Marcos próximos  

---

# 5. Fluxo do Usuário
(mantido)

---

# 6. Requisitos Funcionais
(mantido e ampliado com RF21 até RF25)

- **RF21:** Permitir filtrar tarefas por responsável  
- **RF22:** Permitir filtrar por fase  
- **RF23:** Exibir caminho crítico  
- **RF24:** Permitir mover grupos inteiros (fases)  
- **RF25:** Mostrar todas as dependências com tooltip  

---

# 7. Requisitos Não Funcionais

(mantido)

---

# 8. Documentação Técnica

Complemento:

## 8.1. Arquitetura Recomendada
- Front-end SPA  
- Back-end com endpoints REST  
- Banco relacional  
- Cache para carregamento rápido  
- Renderização incremental para Gantt com muitos itens  

## 8.2. Volume suportado
- Até 1.000 tarefas  
- Até 200 dependências  
- Até 40 fases  

---

# 9. BRD – Documento de Requisitos do Negócio

(mantido e ampliado)

## 9.1. Escopo Incluído:
- Planejamento completo  
- Visualização avançada  
- Exportações  
- Dependências inteligentes  

## 9.2. Escopo Excluído:
(adicionar)
- Orçamento  
- Integrações externas  

---

# 10. Glossário
(mantido)

---
