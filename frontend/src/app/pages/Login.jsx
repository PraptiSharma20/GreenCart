import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { useLang } from '../context/language';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t('fill_all_fields'));
      return;
    }

    try {
      const loggedInUser = await login(email, password);
      toast.success(t('sign_in_success'), { duration: 2000 });
      const role = loggedInUser?.role;
      const to = role === 'admin' ? '/admin/dashboard' : role === 'vendor' ? '/vendor/dashboard' : '/';
      navigate(to);
    } catch (error) {
      toast.error(error.message || t('invalid_credentials'));
    }
  };

  // If already logged in
  if (user) {
    const to = user.role === 'admin' ? '/admin/dashboard' : user.role === 'vendor' ? '/vendor/dashboard' : '/';
    navigate(to);
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md">
        <Card className="p-8">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">{t('sign_in')}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('sign_in_to')} {t('app_name')} {t('account_suffix')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              {t('sign_in')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('dont_have_account')}{' '}
              <Link
                to="/register"
                className="text-green-600 dark:text-green-400 hover:underline"
              >
                {t('register_here')}
              </Link>
            </p>
          </div>

        </Card>
      </div>
    </div>
  );
}
