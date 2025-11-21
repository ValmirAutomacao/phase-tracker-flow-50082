import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { CARGO_OPTIONS, CurriculoInsert } from "@/types/curriculo";

const curriculoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  cargo_interesse: z.string().min(1, "Selecione um cargo"),
  experiencia: z.string().optional(),
});

type CurriculoFormData = z.infer<typeof curriculoSchema>;


export default function TrabalheConosco() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const { toast } = useToast();

  const form = useForm<CurriculoFormData>({
    resolver: zodResolver(curriculoSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      cargo_interesse: "",
      experiencia: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo (apenas PDF)
      if (file.type !== "application/pdf") {
        toast({
          title: "Erro no arquivo",
          description: "Apenas arquivos PDF são aceitos",
          variant: "destructive",
        });
        return;
      }

      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB",
          variant: "destructive",
        });
        return;
      }

      setArquivo(file);
    }
  };

  const uploadArquivo = async (file: File): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}_${file.name}`;

      const { data, error } = await supabase.storage
        .from('curriculos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        return null;
      }

      return fileName;
    } catch (error) {
      console.error('Erro no upload:', error);
      return null;
    }
  };

  const onSubmit = async (data: CurriculoFormData) => {
    if (!arquivo) {
      toast({
        title: "Arquivo obrigatório",
        description: "Por favor, anexe seu currículo em PDF",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload do arquivo
      const arquivoUrl = await uploadArquivo(arquivo);

      if (!arquivoUrl) {
        toast({
          title: "Erro no upload",
          description: "Não foi possível fazer upload do arquivo",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Salvar dados no banco
      const { error } = await supabase
        .from('curriculos')
        .insert({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          cargo_interesse: data.cargo_interesse,
          experiencia: data.experiencia,
          arquivo_url: arquivoUrl,
          arquivo_nome: arquivo.name,
          arquivo_tamanho: arquivo.size,
        });

      if (error) {
        console.error('Erro ao salvar:', error);
        toast({
          title: "Erro ao enviar",
          description: "Não foi possível salvar seus dados",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Sucesso
      setEnviado(true);
      toast({
        title: "Currículo enviado!",
        description: "Recebemos seu currículo. Entraremos em contato em breve.",
      });

      // Reset do form
      form.reset();
      setArquivo(null);

    } catch (error) {
      console.error('Erro geral:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    }

    setUploading(false);
  };

  if (enviado) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">
              Currículo Enviado com Sucesso!
            </h2>
            <p className="text-gray-600 mb-4">
              Obrigado por seu interesse em trabalhar conosco. Analisaremos seu currículo e entraremos em contato em breve.
            </p>
            <Button
              onClick={() => setEnviado(false)}
              variant="outline"
            >
              Enviar Outro Currículo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Trabalhe Conosco
          </CardTitle>
          <p className="text-center text-gray-600">
            Faça parte da nossa equipe! Envie seu currículo e concorra às nossas vagas.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu.email@exemplo.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Telefone */}
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 99999-9999"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cargo de Interesse */}
              <FormField
                control={form.control}
                name="cargo_interesse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo de Interesse *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cargo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CARGO_OPTIONS.map((cargo) => (
                          <SelectItem key={cargo} value={cargo}>
                            {cargo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Experiência */}
              <FormField
                control={form.control}
                name="experiencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experiência Profissional (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Conte-nos sobre sua experiência, habilidades e qualificações..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Upload de Arquivo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Currículo (PDF) *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    {arquivo ? (
                      <>
                        <FileText className="h-8 w-8 text-green-500" />
                        <span className="text-green-600 font-medium">
                          {arquivo.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-gray-600">
                          Clique para selecionar seu currículo
                        </span>
                        <span className="text-sm text-gray-500">
                          Apenas arquivos PDF (máximo 10MB)
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Botão de Envio */}
              <Button
                type="submit"
                className="w-full"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Currículo"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}