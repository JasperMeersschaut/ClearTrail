import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => navigate('/dashboard'),
  });

  return (
    <div className="auth-page">
      <form
        className="auth-form card"
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
      >
        <h1>Login</h1>
        <label className="field">
          Email
          <input type="email" {...register('email')} />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </label>
        <label className="field">
          Password
          <input type="password" {...register('password')} />
          {errors.password && (
            <span className="error">{errors.password.message}</span>
          )}
        </label>
        {mutation.error && (
          <p className="error">{(mutation.error as Error).message}</p>
        )}
        <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="muted">
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
