import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateLeadPayload {
  titulo?: string
  cliente_nome: string
  cliente_email?: string
  cliente_telefone?: string
  cliente_empresa?: string
  valor_estimado?: number
  origem: string
  descricao?: string
  tags?: string[]
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Parse request body
    const payload: CreateLeadPayload = await req.json()

    console.log('Received lead webhook:', payload)

    // Validar campos obrigatórios
    if (!payload.cliente_nome || !payload.origem) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Campos obrigatórios: cliente_nome, origem' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar board padrão
    const { data: board, error: boardError } = await supabaseClient
      .from('kanban_boards')
      .select('id')
      .eq('nome', 'Pipeline de Vendas')
      .single()

    if (boardError || !board) {
      console.error('Erro ao buscar board:', boardError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Board não encontrado' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar fase "Novo Lead"
    const { data: phase, error: phaseError } = await supabaseClient
      .from('kanban_phases')
      .select('id')
      .eq('board_id', board.id)
      .eq('nome', 'Novo Lead')
      .single()

    if (phaseError || !phase) {
      console.error('Erro ao buscar fase:', phaseError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Fase "Novo Lead" não encontrada' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Criar card na fase "Novo Lead"
    const { data: card, error: cardError } = await supabaseClient
      .from('kanban_cards')
      .insert({
        board_id: board.id,
        phase_id: phase.id,
        titulo: payload.titulo || `Lead - ${payload.cliente_nome}`,
        cliente_nome: payload.cliente_nome,
        cliente_email: payload.cliente_email,
        cliente_telefone: payload.cliente_telefone,
        cliente_empresa: payload.cliente_empresa,
        valor_estimado: payload.valor_estimado,
        descricao: payload.descricao,
        origem: payload.origem,
        tags: payload.tags || [],
        ordem: 999999 // Será ajustado pelo frontend
      })
      .select()
      .single()

    if (cardError) {
      console.error('Erro ao criar card:', cardError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao criar lead',
          details: cardError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Registrar atividade
    await supabaseClient
      .from('kanban_card_activities')
      .insert({
        card_id: card.id,
        tipo: 'criado',
        descricao: `Lead criado via webhook (origem: ${payload.origem})`,
        dados_novos: { origem: payload.origem }
      })

    console.log('Lead criado com sucesso:', card.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        card_id: card.id,
        message: 'Lead criado com sucesso'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro no webhook:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
