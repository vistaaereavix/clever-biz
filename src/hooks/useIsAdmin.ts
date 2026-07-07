import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useIsAdmin() {
  const { usuario } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!usuario) {
      setIsAdmin(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: usuario.id,
        _role: 'admin',
      });
      if (!cancelled) setIsAdmin(!error && !!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [usuario]);

  return isAdmin;
}