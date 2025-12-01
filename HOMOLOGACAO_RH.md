# 📋 Manual de Homologação - Módulo Recursos Humanos (RH)

**Data de Criação:** 30/11/2025
**Versão do Sistema:** 1.2.0
**Público Alvo:** Equipe de QA, Gestores de RH e Administradores do Sistema.

---

## 1. Introdução e Escopo

Este documento orienta o processo de homologação (testes de aceitação) do Módulo de Recursos Humanos do sistema EngFlow. O objetivo é validar se todas as funcionalidades críticas de gestão de pessoal, estrutura organizacional e controle de ponto estão operando conforme o esperado antes da entrega final.

O módulo RH foi recentemente reestruturado para centralizar todas as operações relacionadas a pessoas em um único menu, facilitando a navegação e o controle.

---

## 2. Pré-requisitos para Testes

Para executar os testes abaixo, você precisará de dois tipos de acesso:

1.  **Perfil Administrador/Gestor:**
    *   Usuário com acesso total (todas as permissões de RH).
    *   Exemplo: Valmir ou Ronaldo.
2.  **Perfil Colaborador (Operacional):**
    *   Usuário com permissões restritas (apenas registro de ponto e visualização própria).
    *   Exemplo: Paulo (Pedreiro).

---

## 3. Roteiro de Testes (Passo a Passo)

### 3.1. Estrutura Organizacional (Configuração Inicial)

Antes de cadastrar pessoas, é necessário validar a estrutura base.

*   **Acesse:** Menu Lateral -> Recursos Humanos -> **Setores**.
    *   [ ] **Criar Setor:** Cadastre um novo setor (ex: "Obras Civis"). Verifique se aparece na lista.
    *   [ ] **Editar Setor:** Altere o nome do setor.
    *   [ ] **Excluir Setor:** Tente excluir um setor sem vínculos.

*   **Acesse:** Menu Lateral -> Recursos Humanos -> **Funções**.
    *   [ ] **Criar Função:** Cadastre uma nova função (ex: "Mestre de Obras") vinculada ao setor criado acima.
    *   [ ] **Permissões:** Na criação, verifique a aba "Permissões". Marque permissões específicas (ex: apenas "Registrar Ponto").
    *   [ ] **Nível:** Defina como "Operacional".

*   **Acesse:** Menu Lateral -> Recursos Humanos -> **Jornadas de Trabalho**.
    *   [ ] **Criar Jornada:** Cadastre uma jornada padrão (ex: 08:00 às 17:00, com almoço das 12:00 às 13:00).
    *   [ ] **Validação:** Verifique se o cálculo de horas diárias (8h) está correto.

---

### 3.2. Gestão de Colaboradores

*   **Acesse:** Menu Lateral -> Recursos Humanos -> **Funcionários**.
    *   [ ] **Novo Funcionário:** Clique no botão "+" e cadastre um novo colaborador.
        *   Preencha dados obrigatórios (Nome, CPF, CTPS).
        *   Vincule à Função e Jornada criadas anteriormente.
        *   Defina uma senha de acesso (mínimo 6 dígitos).
    *   [ ] **Login do Colaborador:**
        *   Abra uma janela anônima.
        *   Tente logar com o email e senha do novo funcionário.
        *   Verifique se ele vê apenas os menus permitidos (ex: Dashboard e Registrar Ponto).

---

### 3.3. Controle de Ponto (Operacional)

Realize este teste logado como o **Colaborador**.

*   **Acesse:** Menu Lateral -> **Registrar Ponto**.
    *   [ ] **Bater Ponto (Entrada):** Registre a entrada. Confirme se o horário e a localização (se permitido) foram capturados.
    *   [ ] **Comprovante:** Verifique se o sistema gerou a visualização do comprovante digital.
    *   [ ] **Tentativa de Fraude:** Tente bater o ponto duas vezes seguidas muito rápido (o sistema deve bloquear ou alertar).

---

### 3.4. Gestão de Ponto e Tratamento de Exceções (Gestor)

Realize este teste logado como **Gestor/Administrador**.

*   **Acesse:** Menu Lateral -> Recursos Humanos -> **Controle de Ponto**.
    *   [ ] **Visualização Geral:** Verifique se a tabela exibe **todos** os funcionários ativos, inclusive os que faltaram hoje.
    *   [ ] **Indicador de FALTA:**
        *   Localize um funcionário que não bateu ponto hoje.
        *   Verifique se o horário esperado (que já passou) está marcado em **VERMELHO** com a palavra **"FALTA"**.
    *   [ ] **Cálculo de Horas:**
        *   Verifique um funcionário com jornada completa. O total deve ser 08:00 (ou próximo).
        *   Verifique um funcionário com batida ímpar (esqueceu a volta do almoço). O sistema deve somar apenas os pares fechados ou alertar "Incompleto".
    *   [ ] **Ajuste Manual (Tratamento):**
        *   Clique no ícone de "Lápis" (Editar) sobre um horário de FALTA ou errado.
        *   Insira o horário correto e uma justificativa (ex: "Esquecimento").
        *   Salve e verifique se o cálculo de horas foi atualizado e se o status mudou.
    *   [ ] **Abono de Falta:** Use a função de ajuste para inserir os horários manualmente em caso de abono, ou utilize o módulo de Afastamentos (abaixo).

---

### 3.5. Gestão de Afastamentos

*   **Acesse:** Menu Lateral -> Recursos Humanos -> **Gerenciar Afastamentos**.
    *   [ ] **Registrar Afastamento:**
        *   Selecione um funcionário.
        *   Tipo: "Atestado Médico".
        *   Data: Dia de hoje ou período futuro.
        *   Anexo: (Opcional) Teste o upload de um arquivo simulado.
    *   [ ] **Impacto no Ponto:**
        *   Volte para a tela "Controle de Ponto".
        *   O status do funcionário nesse dia deve aparecer como **"Afastado"** (Azul) e não mais como "Falta" ou "Ausente".

---

### 3.6. Configurações Auxiliares

*   **Acesse:** Menu Lateral -> Recursos Humanos -> **Tipos de Justificativas** e **Tipos de Afastamento**.
    *   [ ] **CRUD:** Verifique se é possível criar novos tipos personalizados para sua empresa (ex: "Folga Aniversário").

---

## 4. Critérios de Aceite

O módulo será considerado homologado se:

1.  A hierarquia (Setor > Função > Funcionário) funcionar sem erros de vínculo.
2.  O login do funcionário novo funcionar imediatamente após o cadastro.
3.  O painel de Controle de Ponto mostrar, em tempo real, quem está presente, quem faltou e quem está de folga/afastado.
4.  O cálculo de horas trabalhadas for preciso, ignorando batidas ímpares/erradas para não gerar bancos de horas negativos indevidos.
5.  A edição manual de ponto pelo gestor for registrada com sucesso.

---

**Suporte:** Em caso de falhas bloqueantes (Erros 500, Tela Branca), reportar imediatamente para a equipe de desenvolvimento com print da tela e descrição do passo realizado.
