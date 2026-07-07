import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface OnlineUser {
  user_id: string;
  email: string;
  nome: string;
  online_at: string;
}

const CHANNEL = 'presence:online-users';

/**
 * Joins the global presence channel for all authenticated users.
 * Returns the current list of online users (deduped by user_id).
 */
export function useOnlinePresence() {
  const { usuario } = useAuth();
  const [users, setUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!usuario) {
      setUsers([]);
      return;
    }

    const channel = supabase.channel(CHANNEL, {
      config: { presence: { key: usuario.id } },
    });

    const syncState = () => {
      const state = channel.presenceState() as Record<string, OnlineUser[]>;
      const flat: OnlineUser[] = [];
      const seen = new Set<string>();
      Object.values(state).forEach((arr) => {
        arr.forEach((p) => {
          if (!seen.has(p.user_id)) {
            seen.add(p.user_id);
            flat.push(p);
          }
        });
      });
      setUsers(flat);
    };

    channel
      .on('presence', { event: 'sync' }, syncState)
      .on('presence', { event: 'join' }, syncState)
      .on('presence', { event: 'leave' }, syncState)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: usuario.id,
            email: usuario.email,
            nome: usuario.nome,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [usuario]);

  return users;
}