import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRole } from '@/components/auth/RoleGuard';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Página de acesso negado - exibida quando usuário tenta acessar recurso sem permissão
 */
export default function AcessoNegado() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useRole();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const getRoleDescription = (userRole: string | null) => {
    switch (userRole) {
      case 'admin':
        return 'Administrador - Acesso Total';
      case 'manager':
        return 'Gerente - Acesso Gerencial';
      case 'user':
        return 'Funcionário - Acesso Restrito';
      default:
        return 'Sem role definida';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Acesso Negado
          </CardTitle>
          <CardDescription className="text-gray-600">
            Você não tem permissão para acessar esta página ou recurso
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {user && (
            <div className="bg-gray-100 rounded-lg p-4 text-sm">
              <p><strong>Usuário:</strong> {user.email}</p>
              <p><strong>Nível de Acesso:</strong> {getRoleDescription(role)}</p>
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Para solicitar acesso a este recurso, entre em contato com o administrador do sistema.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={handleGoHome}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir para o Dashboard
            </Button>

            <Button
              variant="outline"
              onClick={handleGoBack}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}