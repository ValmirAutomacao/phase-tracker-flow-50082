-- Adicionar campos para integração OCR na tabela despesas_variaveis

ALTER TABLE despesas_variaveis
ADD COLUMN IF NOT EXISTS origem_dados VARCHAR(50),
ADD COLUMN IF NOT EXISTS status_aprovacao VARCHAR(20) DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS funcionario_nome_ocr VARCHAR(255),
ADD COLUMN IF NOT EXISTS funcionario_telefone_ocr VARCHAR(20),
ADD COLUMN IF NOT EXISTS status_ocr VARCHAR(20) DEFAULT 'pendente';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_despesas_variaveis_origem
ON despesas_variaveis(origem_dados);

CREATE INDEX IF NOT EXISTS idx_despesas_variaveis_status_aprovacao
ON despesas_variaveis(status_aprovacao);

CREATE INDEX IF NOT EXISTS idx_despesas_variaveis_status_ocr
ON despesas_variaveis(status_ocr);

-- Comentários nas colunas
COMMENT ON COLUMN despesas_variaveis.origem_dados IS 'Origem dos dados: manual, whatsapp, email, etc';
COMMENT ON COLUMN despesas_variaveis.status_aprovacao IS 'Status de aprovação: pendente, aprovada, rejeitada';
COMMENT ON COLUMN despesas_variaveis.funcionario_nome_ocr IS 'Nome do funcionário extraído via OCR do WhatsApp';
COMMENT ON COLUMN despesas_variaveis.funcionario_telefone_ocr IS 'Telefone do funcionário que enviou via WhatsApp';
COMMENT ON COLUMN despesas_variaveis.status_ocr IS 'Status do processamento OCR: pendente, processado, erro';