import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "@/styles/responsive.css";

const setorSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
});

export type SetorFormData = z.infer<typeof setorSchema>;

interface SetoresFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SetorFormData) => void;
  editData?: SetorFormData & { id: string };
}

export function SetoresForm({ open, onOpenChange, onSubmit, editData }: SetoresFormProps) {

  const form = useForm<SetorFormData>({
    resolver: zodResolver(setorSchema),
    defaultValues: {
      nome: "",
      descricao: "",
    },
  });

  useEffect(() => {
    if (editData) {
      form.reset(editData);
    } else {
      form.reset({
        nome: "",
        descricao: "",
      });
    }
  }, [editData, form]);

  const handleSubmit = (data: SetorFormData) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="dialog-content-mobile">
            <DialogHeader className="dialog-header">
          <DialogTitle>{editData ? "Editar Setor" : "Novo Setor"}</DialogTitle>
          <DialogDescription>
            {editData ? "Atualize as informações do setor" : "Cadastre um novo setor no sistema"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full">
            <div className="dialog-form-container space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Setor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Engenharia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descreva as responsabilidades do setor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            </div>

            <div className="form-actions">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editData ? "Atualizar" : "Cadastrar"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
