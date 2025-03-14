
'use client';

import React, { useState, useEffect } from 'react';
import { useSettings } from '@/components/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { Cloud, Database, RefreshCw } from 'lucide-react';
import { supabase } from '@/src/integrations/supabase/client';
import { toast } from 'sonner';

const SettingSync: React.FC = () => {
  const { syncWithSupabase, isSyncing } = useSettings();
  const [user, setUser] = useState<any>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      
      // Get last synced time from localStorage
      if (typeof window !== 'undefined') {
        const lastSyncTime = localStorage.getItem('lastProfileSync');
        setLastSynced(lastSyncTime);
      }
    };

    getUser();
  }, []);

  const handleSync = async () => {
    await syncWithSupabase();
    
    // Update last synced time
    const now = new Date().toISOString();
    localStorage.setItem('lastProfileSync', now);
    setLastSynced(now);
  };

  if (!user) {
    return (
      <div className="w-full max-w-3xl mx-auto animate-slide-up bg-white/5 rounded-[40px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative overflow-hidden border-2 border-[#f6b355]/50">
        <div className="glass-card rounded-xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <div className="text-center text-white">
            Please log in to use sync features.
          </div>
        </div>
      </div>
    );
  }

  const formatLastSynced = () => {
    if (!lastSynced) return 'Never';
    
    try {
      const date = new Date(lastSynced);
      return date.toLocaleString();
    } catch (e) {
      return 'Unknown';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-slide-up bg-white/5 rounded-[40px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative overflow-hidden border-2 border-[#f6b355]/50">
      <div className="glass-card rounded-xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#f6b355] flex items-center">
            <Cloud className="mr-2 h-5 w-5 text-amber" />
            Profile Synchronization
          </h2>
        </div>

        <div className="neo-blur p-6 rounded-xl mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-medium text-white mb-2">Database Sync</h3>
              <p className="text-sm text-white/70">
                Synchronize your profile and wallet settings with the cloud database to access 
                them from any device.
              </p>
              <p className="text-xs text-white/50 mt-2">
                Last synced: {formatLastSynced()}
              </p>
            </div>
            
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="bg-[#f6b355] text-black hover:bg-amber-light transition-all duration-300 font-medium px-6 py-2 rounded-full flex items-center shadow-[0_4px_15px_rgba(246,179,85,0.4)] hover:shadow-[0_6px_20px_rgba(246,179,85,0.6)]"
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </div>
        
        <div className="neo-blur p-6 rounded-xl">
          <h3 className="text-lg font-medium text-white mb-3">What gets synchronized?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/30 p-4 rounded-lg">
              <h4 className="text-[#f6b355] text-sm font-medium mb-2">Profile Data</h4>
              <ul className="text-sm text-white/70 space-y-1 pl-4">
                <li>Username</li>
                <li>Profile Image</li>
                <li>Background Image</li>
              </ul>
            </div>
            <div className="bg-black/30 p-4 rounded-lg">
              <h4 className="text-[#f6b355] text-sm font-medium mb-2">Wallet Data</h4>
              <ul className="text-sm text-white/70 space-y-1 pl-4">
                <li>Wallet Addresses</li>
                <li>Default Wallet Selection</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
      <style jsx>{`
        .neo-blur {
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default SettingSync;
