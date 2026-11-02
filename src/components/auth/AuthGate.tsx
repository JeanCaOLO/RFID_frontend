import { Loader2 } from "lucide-react";
import App from "../../App";
import { useAuth } from "../../hooks/useAuth";
import { LoginPage } from "./LoginPage";

/**
 * Solo monta la app con sesión iniciada: así las consultas y suscripciones
 * Realtime de la app salen con el token del usuario (las políticas RLS de
 * Supabase solo permiten acceso a usuarios autenticados).
 */
export const AuthGate = () => {
  const { session, loading, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500 dark:bg-slate-900">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginPage onSignIn={signIn} />;
  }

  // key: si cambia el usuario, la app se vuelve a montar desde cero.
  return (
    <App
      key={session.user.id}
      userEmail={session.user.email ?? ""}
      onSignOut={signOut}
    />
  );
};
