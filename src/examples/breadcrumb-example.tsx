// Exemplo de uso do BreadcrumbResponsive
import React from 'react';
import { BreadcrumbResponsive } from '@/components/ui/breadcrumb-responsive';

export function ExemploBreadcrumb() {
  const breadcrumbItems = [
    { href: "/", label: "Início" },
    { href: "/cadastros", label: "Cadastros" },
    { href: "/cadastros/clientes", label: "Clientes" },
    { href: "/cadastros/clientes/novo", label: "Novo Cliente" },
    { label: "Formulário de Cadastro" }, // Página atual (sem href)
  ];

  return (
    <div className="p-4">
      <BreadcrumbResponsive
        items={breadcrumbItems}
        maxDisplayItems={3}
      />
    </div>
  );
}