interface OCRResult {
  success: boolean;
  dados_extraidos?: {
    nome_fornecedor: string;
    cnpj_fornecedor?: string;
    valor_total: number;
    forma_pagamento?: string;
    numero_documento?: string;
    data_emissao?: string;
    descricao_itens?: string;
  };
  texto_original?: string;
  arquivo_original?: string;
  processado_em?: string;
  error?: string;
  message?: string;
}

class OCRService {
  private static readonly N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_OCR_URL;

  /**
   * Processa um arquivo de imagem via OCR usando n8n backend
   * @param file Arquivo de imagem (JPG, PNG, PDF)
   * @returns Dados extraídos do documento
   */
  static async processDocument(file: File): Promise<OCRResult> {
    try {
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não suportado. Use JPG, PNG ou PDF.');
      }

      // Validar tamanho (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Máximo 10MB.');
      }

      // Converter arquivo para base64
      const base64 = await this.fileToBase64(file);

      // Preparar payload para n8n
      const base64Only = base64.split(',')[1]; // Remover prefixo data:image/...;base64,

      const payload = {
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        fileBase64: base64Only,
        uploadedAt: new Date().toISOString()
      };

      console.log('📤 Enviando arquivo para OCR:', {
        nome: file.name,
        tipo: file.type,
        tamanho: `${(file.size / 1024).toFixed(1)}KB`,
        base64Length: base64Only?.length || 0,
        hasBase64: !!base64Only,
        base64Preview: base64Only ? base64Only.substring(0, 50) + '...' : 'VAZIO'
      });

      console.log('📋 Payload JSON completo:', JSON.stringify(payload, null, 2));

      // Chamar n8n webhook
      const response = await fetch(this.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Status da resposta:', response.status, response.statusText);
      console.log('📥 Headers:', Object.fromEntries(response.headers));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta HTTP:', errorText);
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      // Tentar ler a resposta como texto primeiro para debug
      const responseText = await response.text();
      console.log('📄 Resposta bruta como texto:', responseText);
      console.log('📏 Comprimento da resposta:', responseText.length);

      // Verificar se a resposta está vazia
      if (!responseText || responseText.trim() === '') {
        console.error('❌ Resposta vazia do n8n');
        throw new Error('O n8n retornou uma resposta vazia');
      }

      // Tentar fazer parse da resposta como JSON
      let n8nResponse;
      try {
        n8nResponse = JSON.parse(responseText);
        console.log('📥 Resposta parseada do n8n:', n8nResponse);
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta como JSON:', parseError);
        console.error('📄 Texto que causou o erro:', responseText);
        throw new Error(`Resposta do n8n não é JSON válido: ${responseText}`);
      }

      // O n8n pode retornar um array, então pegar o primeiro item se necessário
      let responseData = n8nResponse;
      if (Array.isArray(n8nResponse) && n8nResponse.length > 0) {
        responseData = n8nResponse[0];
        console.log('📦 Extraído primeiro item do array:', responseData);
      }

      // Verificar se a resposta contém dados OCR válidos
      if (!responseData) {
        throw new Error('Resposta do n8n vazia ou inválida');
      }

      console.log('📄 Dados recebidos do n8n:', responseData);

      let dadosOCR;

      // CASO 1: Resposta com campo ocr_result (string JSON)
      if (responseData.ocr_result) {
        console.log('📄 Detectado campo ocr_result, fazendo parse...');
        try {
          dadosOCR = JSON.parse(responseData.ocr_result);
          console.log('✅ Parse do ocr_result bem-sucedido:', dadosOCR);
        } catch (parseError) {
          console.error('❌ Erro ao parsear ocr_result:', parseError);
          throw new Error(`Erro ao parsear campo ocr_result: ${responseData.ocr_result}`);
        }
      }
      // CASO 2: Dados diretos (sem ocr_result)
      else if (responseData.nome_fornecedor) {
        console.log('📄 Detectados dados diretos do OCR');
        dadosOCR = responseData;
      }
      // CASO 3: Formato inválido
      else {
        throw new Error('Resposta do n8n não contém dados de OCR válidos');
      }

      // Log de debug para verificar campos recebidos
      console.log('📅 Debug dados OCR recebidos:', {
        data_emissao: dadosOCR.data_emissao,
        campos_disponiveis: Object.keys(dadosOCR)
      });

      // Montar resultado OCR com a estrutura esperada pela aplicação
      const result: OCRResult = {
        success: true,
        dados_extraidos: {
          nome_fornecedor: dadosOCR.nome_fornecedor,
          cnpj_fornecedor: dadosOCR.cnpj_fornecedor,
          valor_total: dadosOCR.valor_total,
          forma_pagamento: dadosOCR.forma_pagamento,
          numero_documento: dadosOCR.numero_documento,
          data_emissao: dadosOCR.data_emissao,
          descricao_itens: dadosOCR.descricao_itens
        },
        texto_original: dadosOCR.texto_original,
        arquivo_original: dadosOCR.arquivo_original,
        processado_em: dadosOCR.processado_em
      };

      console.log('✅ Resultado OCR montado a partir dos dados diretos');

      console.log('📥 Resultado OCR final:', result);

      return result;

    } catch (error) {
      console.error('❌ Erro no processamento OCR:', error);

      return {
        success: false,
        error: 'Erro no processamento OCR',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Converte arquivo para base64
   * @param file Arquivo a ser convertido
   * @returns String base64
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Valida e normaliza dados extraídos do OCR
   * @param dados Resultado completo do OCR (com success, dados_extraidos, etc.)
   * @returns Dados normalizados
   */
  static normalizeDadosOCR(dados: any) {
    // Extrair os dados_extraidos do resultado completo
    const dadosExtraidos = dados.dados_extraidos || dados;

    // Log para debug
    console.log('📅 Debug normalizeData:', {
      data_emissao: dadosExtraidos.data_emissao,
      data_normalizada: dadosExtraidos.data_emissao ? this.normalizeData(dadosExtraidos.data_emissao) : null
    });

    return {
      nome_fornecedor: dadosExtraidos.nome_fornecedor,
      cnpj_fornecedor: dadosExtraidos.cnpj_fornecedor,
      valor_compra: dadosExtraidos.valor_total || null,
      forma_pagamento: dadosExtraidos.forma_pagamento,
      nr_documento: dadosExtraidos.numero_documento,
      data_compra: dadosExtraidos.data_emissao ? this.normalizeData(dadosExtraidos.data_emissao) : null,
      descricao: dadosExtraidos.descricao_itens
    };
  }

  /**
   * Normaliza forma de pagamento para os valores aceitos pelo sistema
   */
  private static normalizeFormaPagamento(formaPagamento?: string): string | null {
    if (!formaPagamento) return null;

    const forma = formaPagamento.toLowerCase();

    if (forma.includes('pix')) return 'pix';
    if (forma.includes('cartão') || forma.includes('cartao')) return 'cartao_avista';
    if (forma.includes('dinheiro') || forma.includes('especie')) return 'dinheiro';

    return formaPagamento; // Retorna valor original se não reconhecer
  }

  /**
   * Normaliza data para formato aceito pelo sistema
   */
  private static normalizeData(data: string): string | null {
    try {
      // Tenta diferentes formatos de data
      const formats = [
        /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
        /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
        /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
      ];

      for (const format of formats) {
        const match = data.match(format);
        if (match) {
          if (format === formats[1]) { // YYYY-MM-DD
            return data; // Já no formato correto
          } else { // DD/MM/YYYY ou DD-MM-YYYY
            const [, dia, mes, ano] = match;
            return `${ano}-${mes}-${dia}`; // Retorna no formato YYYY-MM-DD
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }
}

export { OCRService, type OCRResult };