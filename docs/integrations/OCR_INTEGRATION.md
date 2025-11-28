# Integração OCR - DespesasVariaveis

## Visão Geral
Integração completa de processamento OCR para extração automática de dados de comprovantes de despesas variáveis usando n8n como backend.

## Componentes da Integração

### 1. n8n Workflow (`OCR_BACKEND_WORKFLOW.json`)
Workflow simplificado para processamento direto de arquivos:
- **Webhook Upload**: Recebe arquivos via POST
- **Convert Upload**: Converte base64 para arquivo binário
- **Tesseract OCR**: Extração de texto da imagem
- **Extract Data**: Extração estruturada usando GPT-4
- **Format Response**: Formatação da resposta JSON

### 2. OCRService (`src/services/ocrService.ts`)
Serviço frontend para comunicação com n8n:
- Validação de tipos de arquivo (JPG, PNG, PDF)
- Conversão para base64
- Envio para webhook n8n
- Normalização dos dados extraídos

### 3. DespesasVariaveis UI (`src/pages/financeiro/DespesasVariaveis.tsx`)
Interface integrada para upload e processamento:
- Upload de comprovantes com preview
- Processamento OCR em tempo real
- Auto-preenchimento de formulários
- Gerenciamento de despesas pendentes OCR

### 4. Schema do Banco (`src/migrations/add_ocr_fields.sql`)
Campos adicionados à tabela `despesas_variaveis`:
- `origem_dados`: Fonte da despesa (manual, ocr, whatsapp)
- `status_aprovacao`: Status de aprovação (pendente, aprovada, rejeitada)
- `funcionario_nome_ocr`: Nome extraído via OCR
- `funcionario_telefone_ocr`: Telefone para integração WhatsApp
- `status_ocr`: Status do processamento OCR

## Fluxo de Processamento

### Upload e Processamento
1. **Upload de Arquivo**
   - Usuário faz upload de imagem/PDF
   - Validação de tipo e tamanho
   - Exibição de preview

2. **Processamento OCR**
   - Conversão para base64
   - Envio para n8n webhook
   - Tesseract extrai texto
   - GPT-4 estrutura dados

3. **Auto-preenchimento**
   - Dados normalizados preenchem formulário
   - Usuário revisa e ajusta
   - Campos obrigatórios (obra, categorias) preenchidos manualmente

### Dados Extraídos Automaticamente
- **Nome do Fornecedor**: Razão social ou nome
- **CNPJ/CPF**: Documento de identificação
- **Valor Total**: Valor da compra
- **Forma de Pagamento**: PIX, Cartão, Dinheiro
- **Número do Documento**: Nota fiscal, cupom, recibo
- **Data de Emissão**: Data do documento
- **Descrição dos Itens**: Resumo dos produtos/serviços

## Configuração

### Variáveis de Ambiente
```bash
# .env
NEXT_PUBLIC_N8N_OCR_URL=https://seu-n8n.com/webhook/ocr-process
```

### Instalação do Workflow n8n
1. Importe `OCR_BACKEND_WORKFLOW.json` no n8n
2. Configure credenciais OpenAI no nó "GPT Model"
3. Ative o workflow
4. Configure URL do webhook na aplicação

## Tratamento de Erros

### Validações Frontend
- Tipos de arquivo permitidos
- Tamanho máximo (10MB)
- Estados de carregamento

### Fallbacks
- Erro de OCR: dados podem ser preenchidos manualmente
- Timeout: processo pode ser reiniciado
- Falha na extração: formulário permanece editável

## Melhorias Futuras

### Funcionalidades Planejadas
1. **Múltiplos Arquivos**: Upload em lote
2. **Histórico OCR**: Log de processamentos
3. **Validação Inteligente**: Verificação de dados extraídos
4. **Machine Learning**: Melhoria da precisão baseada em feedback
5. **Templates**: Configuração por tipo de documento

### Integrações
1. **WhatsApp**: Recebimento via bot (já preparado)
2. **Email**: Processamento de anexos
3. **Drive**: Sincronização automática
4. **ERP**: Integração com sistemas externos

## Status da Implementação
- ✅ n8n Workflow criado
- ✅ OCRService implementado
- ✅ Interface de upload integrada
- ✅ Auto-preenchimento funcionando
- ✅ Schema do banco atualizado
- ⏳ Testes com documentos reais
- ⏳ Configuração de produção