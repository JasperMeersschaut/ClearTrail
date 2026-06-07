import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { register as registerUser } from '../api';

const schema = z.object({
  displayName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: async (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
      navigate('/dashboard');
    },
  });

  return (
    <div className="auth-page">
      <form
        className="auth-form card"
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
      >
        <h1>Create Account</h1>
        <label className="field">
          Display name
          <input type="text" {...register('displayName')} />
          {errors.displayName && (
            <span className="error">{errors.displayName.message}</span>
          )}
        </label>
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
          {mutation.isPending ? 'Creating...' : 'Register'}
        </button>
        <p className="muted">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
