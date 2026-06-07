import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';
import { useLang } from '../context/language';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('customer');

  const { register, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error(t('fill_all_fields'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('passwords_no_match'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('password_min_length'));
      return;
    }

    try {
      await register(name, email, password, role);
      toast.success(t('account_created'));

      if (role === 'vendor') {
        navigate('/vendor/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(error.message || t('invalid_credentials'));
    }
  };

  if (user) {
    navigate('/');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md">
        <Card className="p-8">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">{t('register_title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('register_sub')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">{t('full_name_label')}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">{t('email')}</Label>
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
              <Label htmlFor="password">{t('password_label')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">{t('confirm_password_label')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <Label className="mb-3 block">{t('account_type')}</Label>

              <RadioGroup value={role} onValueChange={(value) => setRole(value)}>
                <div className="flex items-center space-x-2 rounded-lg border border-gray-200 dark:border-gray-600 p-4 dark:bg-gray-800/50">
                  <RadioGroupItem value="customer" id="customer" />
                  <Label htmlFor="customer" className="flex-1 cursor-pointer">
                    <div className="font-medium text-gray-900 dark:text-white">{t('account_customer')}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('account_customer_desc')}</div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 rounded-lg border border-gray-200 dark:border-gray-600 p-4 dark:bg-gray-800/50">
                  <RadioGroupItem value="vendor" id="vendor" />
                  <Label htmlFor="vendor" className="flex-1 cursor-pointer">
                    <div className="font-medium text-gray-900 dark:text-white">{t('account_vendor')}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('account_vendor_desc')}</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full" size="lg">
              {t('register_submit')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('already_have_account')}{' '}
              <Link to="/login" className="text-green-600 dark:text-green-400 hover:underline">
                {t('sign_in_here')}
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
