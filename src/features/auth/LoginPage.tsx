import { useRef, useState, type FormEvent } from 'react';
import { LogIn } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../../api/bazaarApi';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Alert } from '../../components/feedback/Alert';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ERROR_COPY, fieldMessage, toAppError, type AppError } from '../../lib/errors';
import type { ReturnTo } from './RequireAuth';
import { selectSession, signedIn } from './sessionSlice';

const DEMO = { email: 'demo@bugbazaar.dev', password: 'duck1234' };

function returnPath(state: unknown): string {
  const from = (state as ReturnTo | null)?.from;
  return from ? `${from.pathname}${from.search}` : '/account';
}

export default function LoginPage() {
  useDocumentTitle('Sign in');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const session = useAppSelector(selectSession);
  const [login, { isLoading }] = useLoginMutation();
  const inFlight = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<AppError | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  if (session.status === 'signed-in' && !isLoading) {
    return <Navigate to={returnPath(location.state)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Double-submit guard: Enter + click, or two fast clicks, send one request.
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(signedIn(result));
      navigate(returnPath(location.state), { replace: true });
    } catch (err) {
      const appError = toAppError(err);
      setError(appError);
      if (appError.kind === 'validation') {
        (appError.fields.email ? emailRef : passwordRef).current?.focus();
      }
    } finally {
      inFlight.current = false;
    }
  };

  const fields = error?.kind === 'validation' ? error.fields : {};
  const emailError = fields.email ? fieldMessage('email', fields.email) : undefined;
  const passwordError = fields.password ? fieldMessage('password', fields.password) : undefined;

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-slate-600">Sign in to check out and see your account.</p>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          {session.status === 'signed-out' && session.reason === 'expired' && !error && (
            <div className="mb-5">
              <Alert tone="info" title="Your session expired">
                Sign in again to continue.
              </Alert>
            </div>
          )}
          {error && error.kind !== 'validation' && (
            <div className="mb-5">
              <Alert
                title={
                  error.kind === 'unauthorized'
                    ? 'Email or password is incorrect'
                    : ERROR_COPY[error.kind].title
                }
              >
                {error.kind === 'unauthorized'
                  ? 'Check your details and try again.'
                  : ERROR_COPY[error.kind].description}
              </Alert>
            </div>
          )}
          {error?.kind === 'validation' && (
            <div className="mb-5">
              <Alert title="Please fix the highlighted fields" />
            </div>
          )}

          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            <TextField
              ref={emailRef}
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
            />
            <TextField
              ref={passwordRef}
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError}
            />
            <Button type="submit" size="lg" className="w-full" loading={isLoading}>
              {!isLoading && <LogIn className="size-5" aria-hidden="true" />}
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Demo account</p>
            <p className="mt-1">
              <span className="font-mono">{DEMO.email}</span> /{' '}
              <span className="font-mono">{DEMO.password}</span>
            </p>
            <button
              type="button"
              className="text-brand-700 mt-2 font-semibold hover:underline"
              onClick={() => {
                setEmail(DEMO.email);
                setPassword(DEMO.password);
              }}
            >
              Fill in demo details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
