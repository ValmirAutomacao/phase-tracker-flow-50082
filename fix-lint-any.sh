#!/bin/bash

# Script para corrigir automaticamente erros de tipo 'any' no TypeScript

echo "🔧 Corrigindo erros de linting relacionados ao tipo 'any'..."

# Função para substituir padrões comuns de 'any'
fix_any_patterns() {
    local file=$1

    # Substituir any em interfaces/tipos para unknown
    sed -i 's/: any;/: unknown;/g' "$file"
    sed -i 's/: any\[\]/: unknown[]/g' "$file"
    sed -i 's/: any |/: unknown |/g' "$file"
    sed -i 's/| any/| unknown/g' "$file"

    # Substituir any em parâmetros de função para unknown
    sed -i 's/(.*: any)/(parameters: unknown)/g' "$file"
    sed -i 's/\[\]: any/[]: unknown/g' "$file"

    # Substituir Record<string, any> para Record<string, unknown>
    sed -i 's/Record<string, any>/Record<string, unknown>/g' "$file"

    # Substituir any[] para unknown[]
    sed -i 's/any\[\]/unknown[]/g' "$file"

    # Casos específicos de ícones React
    sed -i 's/icon: any/icon: React.ComponentType/g' "$file"

    echo "✅ Processado: $file"
}

# Listar arquivos TypeScript com erros de any
files_with_any=$(npm run lint 2>&1 | grep -E "@typescript-eslint/no-explicit-any" | cut -d':' -f1 | sort -u)

for file in $files_with_any; do
    if [[ -f "$file" ]]; then
        fix_any_patterns "$file"
    fi
done

echo "🎯 Tentando corrigir automaticamente com ESLint..."
npm run lint -- --fix || true

echo "📊 Resultado após correções:"
npm run lint 2>&1 | grep -E "error|warning" | wc -l

echo "✨ Correção automática concluída!"