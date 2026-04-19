'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAppStore } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export function AuthModals() {
  const { t } = useI18n();
  const { authModal, setAuthModal, setUser } = useAppStore();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error(t('auth.emailRequired'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t('auth.invalidCredentials'));
      } else {
        setUser(data.user);
        setAuthModal(null);
        toast.success(t('auth.loginSuccess'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName || !regEmail || !regPassword || !regUsername) {
      toast.error('All fields are required');
      return;
    }
    if (regPassword.length < 6) {
      toast.error(t('auth.passwordMinLength'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, username: regUsername, email: regEmail, password: regPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t('common.error'));
      } else {
        setUser(data.user);
        setAuthModal(null);
        toast.success(t('auth.registerSuccess'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Login Modal */}
      <Dialog open={authModal === 'login'} onOpenChange={(open) => !open && setAuthModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">{t('auth.login')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{t('auth.email')}</Label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('auth.password')}</Label>
                <button className="text-xs text-[#229ED9] hover:underline">{t('auth.forgotPassword')}</button>
              </div>
              <Input
                type="password"
                placeholder="••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button
              className="w-full bg-[#229ED9] hover:bg-[#1a8bc4]"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? t('common.loading') : t('auth.login')}
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">or</span>
            </div>

            <Button variant="outline" className="w-full" onClick={() => {
              setLoginEmail('admin@tgdir.com');
              setLoginPassword('admin123');
            }}>
              🚀 Demo Admin Login
            </Button>
            <Button variant="outline" className="w-full" onClick={() => {
              setLoginEmail('user@example.com');
              setLoginPassword('admin123');
            }}>
              👤 Demo User Login
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t('auth.dontHaveAccount')} </span>
              <button onClick={() => setAuthModal('register')} className="text-[#229ED9] hover:underline font-medium">
                {t('auth.register')}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={authModal === 'register'} onOpenChange={(open) => !open && setAuthModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">{t('auth.register')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('auth.name')}</Label>
                <Input
                  placeholder="John Doe"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.username')}</Label>
                <Input
                  placeholder="johndoe"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('auth.email')}</Label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('auth.password')}</Label>
              <Input
                type="password"
                placeholder="••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              />
            </div>
            <Button
              className="w-full bg-[#229ED9] hover:bg-[#1a8bc4]"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? t('common.loading') : t('auth.register')}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">{t('auth.alreadyHaveAccount')} </span>
              <button onClick={() => setAuthModal('login')} className="text-[#229ED9] hover:underline font-medium">
                {t('auth.login')}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
