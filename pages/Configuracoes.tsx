import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Percent, Users, Shield } from "lucide-react";

export default function Configuracoes() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          Configurações
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie as configurações do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Margem Padrão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <Label>Margem global (%)</Label>
            <Input type="number" defaultValue="20" min={0} max={100} />
          </div>
          <p className="text-xs text-muted-foreground">
            Essa margem será aplicada automaticamente em todas as novas vendas. Pode ser sobrescrita por venda individualmente.
          </p>
          <Button>Salvar Margem</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Usuários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">A</span>
              </div>
              <div>
                <p className="font-medium text-sm">Admin</p>
                <p className="text-xs text-muted-foreground">admin@email.com</p>
              </div>
            </div>
            <Badge className="flex items-center gap-1"><Shield className="h-3 w-3" />Admin</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-sm font-semibold">V</span>
              </div>
              <div>
                <p className="font-medium text-sm">Vendedor 1</p>
                <p className="text-xs text-muted-foreground">vendedor@email.com</p>
              </div>
            </div>
            <Badge variant="secondary">Vendedor</Badge>
          </div>
          <Button variant="outline" className="mt-2">Convidar Usuário</Button>
        </CardContent>
      </Card>
    </div>
  );
}
