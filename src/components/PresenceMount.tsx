import { useEffect } from 'react';
import { useOnlinePresence } from '../hooks/useOnlinePresence';
import { touchLastActive } from '../lib/admin.functions';

/**
 * Mounts the presence channel for the current user and pings last_active
 * on mount + every 5 minutes.
 */
export function PresenceMount() {
  useOnlinePresence();

  useEffect(() => {
    const ping = () => {
      touchLastActive().catch(() => {});
    };
    ping();
    const id = window.setInterval(ping, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  return null;
}