// supabase/functions/admin-users/index.ts
// Edge Function para gestão de usuários com service_role key (segura no servidor)
//
// Deploy: supabase functions deploy admin-users
// Secrets: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<sua_key>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verifica autenticação do usuário chamador (anon key)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente com anon key para verificar sessão
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verifica se o usuário é admin
    const role = user.user_metadata?.role;
    if (role !== "admin") {
      return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente admin com service_role key (seguro no servidor)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await req.json();
    const { action } = body;

    // ── Listar usuários ───────────────────────────────────────
    if (action === "list") {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      const users = (data.users ?? []).map((u) => ({
        id: u.id,
        email: u.email ?? "",
        role: (u.user_metadata?.role as string) ?? "vendedor",
        created_at: new Date(u.created_at).toLocaleDateString("pt-BR"),
      }));
      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Criar usuário ─────────────────────────────────────────
    if (action === "create") {
      const { email, password, role: newRole } = body;
      if (!email || !password) throw new Error("Email e senha são obrigatórios");

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: newRole ?? "vendedor" },
      });
      if (error) throw error;
      return new Response(JSON.stringify({ user: { id: data.user.id } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Deletar usuário ───────────────────────────────────────
    if (action === "delete") {
      const { userId } = body;
      if (!userId) throw new Error("userId é obrigatório");

      // Impede auto-deleção
      if (userId === user.id) throw new Error("Você não pode remover sua própria conta");

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return new Response(JSON.stringify({ deleted: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação desconhecida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});