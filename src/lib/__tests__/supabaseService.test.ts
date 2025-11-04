import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do cliente Supabase
vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
  },
}))

// Mock do ErrorHandler
vi.mock('../errorHandler', () => ({
  ErrorHandler: {
    mapSupabaseError: vi.fn(),
  },
  withErrorHandling: vi.fn((fn: unknown) => fn),
  withRetry: vi.fn((fn: unknown) => fn),
}))

// Import após os mocks
import { SupabaseService, supabaseService } from '../supabaseService'
import { supabase } from '../supabaseClient'
import { ErrorHandler } from '../errorHandler'

// Dados de teste
const mockCliente = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  nome: 'Empresa Teste',
  email: 'contato@empresateste.com',
  telefone: '(11) 99999-9999',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

const mockClienteToAdd = {
  nome: 'Nova Empresa',
  email: 'nova@empresa.com',
  telefone: '(11) 77777-7777',
}

const mockClienteUpdate = {
  nome: 'Empresa Atualizada',
  telefone: '(11) 88888-8888',
}

describe('SupabaseService', () => {
  let service: SupabaseService
  let mockChain: any

  beforeEach(() => {
    service = new SupabaseService()
    vi.clearAllMocks()

    // Setup do mock chain
    mockChain = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    }

    vi.mocked(supabase.from).mockReturnValue(mockChain)
  })

  describe('getFromSupabase', () => {
    it('deve buscar todos os registros de uma tabela', async () => {
      const mockData = [mockCliente]
      mockChain.order.mockResolvedValue({ data: mockData, error: null })

      const result = await service.getFromSupabase('engflow_clientes')

      expect(supabase.from).toHaveBeenCalledWith('clientes')
      expect(mockChain.select).toHaveBeenCalledWith('*')
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockData)
    })

    it('deve retornar array vazio quando não há dados', async () => {
      mockChain.order.mockResolvedValue({ data: null, error: null })

      const result = await service.getFromSupabase('engflow_clientes')

      expect(result).toEqual([])
    })

    it('deve lançar erro quando Supabase retorna erro', async () => {
      const mockError = { message: 'Database error' }
      mockChain.order.mockResolvedValue({ data: null, error: mockError })

      const mappedError = { type: 'DATABASE_ERROR', message: 'Erro de banco de dados' }
      vi.mocked(ErrorHandler.mapSupabaseError).mockReturnValue(mappedError)

      await expect(service.getFromSupabase('engflow_clientes')).rejects.toEqual(mappedError)
      expect(ErrorHandler.mapSupabaseError).toHaveBeenCalledWith(mockError)
    })

    it('deve lançar erro para chave de storage inválida', async () => {
      await expect(service.getFromSupabase('chave_invalida')).rejects.toThrow(
        'Chave de storage inválida: chave_invalida'
      )
    })
  })

  describe('addToSupabase', () => {
    it('deve adicionar um novo item e retornar o item criado', async () => {
      mockChain.single.mockResolvedValue({ data: mockCliente, error: null })

      const result = await service.addToSupabase('engflow_clientes', mockClienteToAdd)

      expect(supabase.from).toHaveBeenCalledWith('clientes')
      expect(mockChain.insert).toHaveBeenCalledWith(mockClienteToAdd)
      expect(mockChain.select).toHaveBeenCalled()
      expect(mockChain.single).toHaveBeenCalled()
      expect(result).toEqual(mockCliente)
    })

    it('deve lançar erro quando insert retorna erro', async () => {
      const mockError = { message: 'Insert error' }
      mockChain.single.mockResolvedValue({ data: null, error: mockError })

      await expect(service.addToSupabase('engflow_clientes', mockClienteToAdd)).rejects.toThrow(
        'Erro ao adicionar em clientes: Insert error'
      )
    })

    it('deve lançar erro quando nenhum dado é retornado', async () => {
      mockChain.single.mockResolvedValue({ data: null, error: null })

      await expect(service.addToSupabase('engflow_clientes', mockClienteToAdd)).rejects.toThrow(
        'Nenhum dado retornado ao adicionar em clientes'
      )
    })
  })

  describe('updateInSupabase', () => {
    it('deve atualizar um item específico e retornar o item atualizado', async () => {
      const updatedCliente = { ...mockCliente, ...mockClienteUpdate }
      mockChain.single.mockResolvedValue({ data: updatedCliente, error: null })

      const result = await service.updateInSupabase('engflow_clientes', mockCliente.id, mockClienteUpdate)

      expect(supabase.from).toHaveBeenCalledWith('clientes')
      expect(mockChain.update).toHaveBeenCalledWith(mockClienteUpdate)
      expect(mockChain.eq).toHaveBeenCalledWith('id', mockCliente.id)
      expect(mockChain.select).toHaveBeenCalled()
      expect(mockChain.single).toHaveBeenCalled()
      expect(result).toEqual(updatedCliente)
    })

    it('deve lançar erro quando update retorna erro', async () => {
      const mockError = { message: 'Update error' }
      mockChain.single.mockResolvedValue({ data: null, error: mockError })

      await expect(service.updateInSupabase('engflow_clientes', mockCliente.id, mockClienteUpdate)).rejects.toThrow(
        'Erro ao atualizar em clientes: Update error'
      )
    })

    it('deve lançar erro quando item não é encontrado', async () => {
      mockChain.single.mockResolvedValue({ data: null, error: null })

      await expect(service.updateInSupabase('engflow_clientes', mockCliente.id, mockClienteUpdate)).rejects.toThrow(
        `Item com ID ${mockCliente.id} não encontrado em clientes`
      )
    })
  })

  describe('deleteFromSupabase', () => {
    it('deve deletar um item específico', async () => {
      mockChain.eq.mockResolvedValue({ error: null })

      await service.deleteFromSupabase('engflow_clientes', mockCliente.id)

      expect(supabase.from).toHaveBeenCalledWith('clientes')
      expect(mockChain.delete).toHaveBeenCalled()
      expect(mockChain.eq).toHaveBeenCalledWith('id', mockCliente.id)
    })

    it('deve lançar erro quando delete retorna erro', async () => {
      const mockError = { message: 'Delete error' }
      mockChain.eq.mockResolvedValue({ error: mockError })

      await expect(service.deleteFromSupabase('engflow_clientes', mockCliente.id)).rejects.toThrow(
        'Erro ao deletar de clientes: Delete error'
      )
    })
  })

  describe('getByIdFromSupabase', () => {
    it('deve buscar um item específico por ID', async () => {
      mockChain.single.mockResolvedValue({ data: mockCliente, error: null })

      const result = await service.getByIdFromSupabase('engflow_clientes', mockCliente.id)

      expect(supabase.from).toHaveBeenCalledWith('clientes')
      expect(mockChain.select).toHaveBeenCalledWith('*')
      expect(mockChain.eq).toHaveBeenCalledWith('id', mockCliente.id)
      expect(mockChain.single).toHaveBeenCalled()
      expect(result).toEqual(mockCliente)
    })

    it('deve retornar null quando item não é encontrado', async () => {
      const mockError = { code: 'PGRST116', message: 'No rows returned' }
      mockChain.single.mockResolvedValue({ data: null, error: mockError })

      const result = await service.getByIdFromSupabase('engflow_clientes', mockCliente.id)

      expect(result).toBeNull()
    })
  })

  describe('Testando tabelas mapeadas', () => {
    const tableMappings = [
      { key: 'engflow_clientes', table: 'clientes' },
      { key: 'engflow_obras', table: 'obras' },
      { key: 'engflow_funcionarios', table: 'funcionarios' },
      { key: 'engflow_funcoes', table: 'funcoes' },
      { key: 'engflow_setores', table: 'setores' },
      { key: 'engflow_despesas', table: 'despesas' },
      { key: 'engflow_videos', table: 'videos' },
      { key: 'engflow_requisicoes', table: 'requisicoes' },
    ]

    tableMappings.forEach(({ key, table }) => {
      it(`deve mapear corretamente ${key} para tabela ${table}`, async () => {
        mockChain.order.mockResolvedValue({ data: [], error: null })

        await service.getFromSupabase(key)

        expect(supabase.from).toHaveBeenCalledWith(table)
      })
    })
  })
})

describe('Instância singleton supabaseService', () => {
  it('deve ser uma instância de SupabaseService', () => {
    expect(supabaseService).toBeInstanceOf(SupabaseService)
  })
})