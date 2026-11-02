import { useState, type FormEvent } from "react";
import { Loader2, LogIn, Radio } from "lucide-react";

type LoginPageProps = {
  onSignIn: (email: string, password: string) => Promise<string | null>;
};

export const LoginPage = ({ onSignIn }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const message = await onSignIn(email.trim(), password);
    if (message) setError(message);
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900 dark:bg-slate-900 dark:text-slate-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/15 text-sky-500">
            <Radio className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">Monitor RFID</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Inicia sesión para continuar
          </p>
        </div>

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Correo
        </label>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/50 dark:border-slate-600"
        />

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Contraseña
        </label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/50 dark:border-slate-600"
        />

        {error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          Entrar
        </button>
      </form>
    </div>
  );
};
