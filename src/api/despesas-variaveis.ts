import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Configuração do Supabase (você deve ajustar com suas credenciais)
const supabaseUrl = process.env.SUPABASE_URL || 'sua-url-supabase';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sua-chave-supabase';
const supabase = createClient(supabaseUrl, supabaseKey);

interface OCRData {
  funcionario_nome: string;
  funcionario_telefone: string;
  nome_fornecedor: string;
  cnpj_fornecedor: string;
  valor_compra: string;
  forma_pagamento?: string;
  numero_documento: string;
  data_compra: string;
  status_ocr: 'processado' | 'erro';
  webhook_origem: string;
}

// Endpoint para receber dados do OCR via n8n
router.post('/ocr', async (req, res) => {
  try {
    const ocrData: OCRData = req.body;

    console.log('📄 OCR Data recebido:', ocrData);

    // Validar dados obrigatórios
    if (!ocrData.nome_fornecedor || !ocrData.valor_compra || !ocrData.numero_documento) {
      return res.status(400).json({
        error: 'Dados obrigatórios faltando',
        required: ['nome_fornecedor', 'valor_compra', 'numero_documento']
      });
    }

    // Buscar funcionário pelo telefone ou nome
    const { data: funcionario } = await supabase
      .from('funcionarios')
      .select('id, nome')
      .or(`telefone.eq.${ocrData.funcionario_telefone},nome.ilike.%${ocrData.funcionario_nome}%`)
      .single();

    // Converter valor para número
    const valorNumerico = parseFloat(ocrData.valor_compra.replace(/[R$\s.]/g, '').replace(',', '.'));

    // Mapear forma de pagamento
    const formaPagamentoMap: Record<string, string> = {
      'pix': 'pix',
      'cartão': 'cartao_avista',
      'cartao': 'cartao_avista',
      'dinheiro': 'pix', // Default para PIX se não identificado
      'boleto': 'pix'
    };

    const formaPagamento = formaPagamentoMap[
      ocrData.forma_pagamento?.toLowerCase() || 'pix'
    ] || 'pix';

    // Criar despesa variável no Supabase
    const despesaVariavel = {
      // Funcionário (se encontrado)
      comprador_funcionario_id: funcionario?.id || null,

      // Dados extraídos do OCR
      nome_fornecedor: ocrData.nome_fornecedor,
      cnpj_fornecedor: ocrData.cnpj_fornecedor,
      valor_compra: valorNumerico,
      forma_pagamento: formaPagamento,
      nr_documento: ocrData.numero_documento,
      data_compra: ocrData.data_compra, // Data da compra vinda do OCR
      data_lancamento: new Date().toISOString().split('T')[0], // Data de lançamento automática

      // Metadados do processamento
      status_ocr: ocrData.status_ocr,
      origem_dados: ocrData.webhook_origem,
      funcionario_nome_ocr: ocrData.funcionario_nome,
      funcionario_telefone_ocr: ocrData.funcionario_telefone,

      // Status inicial
      status_aprovacao: 'pendente',
      created_at: new Date().toISOString(),

      // Campos obrigatórios (podem ser preenchidos depois)
      obra_id: null, // Será preenchido manualmente
      categorias: [], // Será preenchido manualmente
      descricao: `Despesa processada via OCR - WhatsApp de ${ocrData.funcionario_nome}`
    };

    const { data: novaDespesa, error: erroInsert } = await supabase
      .from('despesas_variaveis')
      .insert([despesaVariavel])
      .select()
      .single();

    if (erroInsert) {
      console.error('Erro ao inserir despesa:', erroInsert);
      return res.status(500).json({
        error: 'Erro ao salvar despesa no banco',
        details: erroInsert.message
      });
    }

    // Log da ação
    console.log(`✅ Despesa variável criada via OCR:`, {
      id: novaDespesa.id,
      funcionario: ocrData.funcionario_nome,
      fornecedor: ocrData.nome_fornecedor,
      valor: valorNumerico
    });

    // Resposta de sucesso
    res.status(201).json({
      success: true,
      message: 'Despesa criada com sucesso via OCR',
      despesa_id: novaDespesa.id,
      data: {
        id: novaDespesa.id,
        funcionario_encontrado: !!funcionario,
        funcionario_id: funcionario?.id,
        fornecedor: ocrData.nome_fornecedor,
        valor: valorNumerico,
        status: 'pendente_complemento' // Indica que precisa de dados manuais
      }
    });

  } catch (error) {
    console.error('❌ Erro no processamento OCR:', error);

    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Endpoint para listar despesas pendentes de OCR
router.get('/pendentes-ocr', async (req, res) => {
  try {
    const { data: despesasPendentes, error } = await supabase
      .from('despesas_variaveis')
      .select(`
        *,
        funcionarios:comprador_funcionario_id (nome, telefone),
        obras:obra_id (nome)
      `)
      .eq('status_aprovacao', 'pendente')
      .not('origem_dados', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      despesas: despesasPendentes,
      total: despesasPendentes.length
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro ao buscar despesas pendentes',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;