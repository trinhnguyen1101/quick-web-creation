
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { syncProfileWithSupabase, fetchProfileFromSupabase } from '@/lib/utils/syncProfileData';
import { toast } from 'sonner';

type ProfileSettings = {
  username: string;
  profileImage: string | null;
  backgroundImage: string | null;
};

type Wallet = {
  id: string;
  address: string;
  isDefault: boolean;
};

type SettingsContextType = {
  profile: ProfileSettings;
  wallets: Wallet[];
  updateProfile: (profile: Partial<ProfileSettings>) => void;
  saveProfile: () => void;
  addWallet: (address: string) => void;
  removeWallet: (id: string) => void;
  setDefaultWallet: (id: string) => void;
  hasUnsavedChanges: boolean;
  isSyncing: boolean;
  syncWithSupabase: () => Promise<void>;
};

const defaultProfile: ProfileSettings = {
  username: 'User',
  profileImage: null,
  backgroundImage: null,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [settingsKey, setSettingsKey] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileSettings>(defaultProfile);
  const [savedProfile, setSavedProfile] = useState<ProfileSettings>(defaultProfile);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Get user information and settings key
  useEffect(() => {
    const getCurrentUserInfo = async () => {
      // Check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || null;
      
      if (currentUserId) {
        setUserId(currentUserId);
        
        // Check localStorage for settingsKey
        if (typeof window !== 'undefined') {
          const currentUser = localStorage.getItem('currentUser');
          if (currentUser) {
            const userData = JSON.parse(currentUser);
            const key = userData.settingsKey || `settings_${currentUserId}`;
            setSettingsKey(key);
          } else {
            // Create a settingsKey if none exists
            const newKey = `settings_${currentUserId}`;
            setSettingsKey(newKey);
          }
        }
      }
    };

    getCurrentUserInfo();
  }, []);

  // Load settings from localStorage or Supabase
  useEffect(() => {
    const loadSettings = async () => {
      if (!userId) return;
      
      // First try to load from localStorage
      let settings;
      if (typeof window !== 'undefined' && settingsKey) {
        const saved = localStorage.getItem(settingsKey);
        settings = saved ? JSON.parse(saved) : null;
      }
      
      if (!settings) {
        // If no localStorage data, try to fetch from Supabase
        try {
          setIsSyncing(true);
          const supabaseSettings = await fetchProfileFromSupabase(userId);
          if (supabaseSettings) {
            setProfile(supabaseSettings.profile);
            setSavedProfile(supabaseSettings.profile);
            setWallets(supabaseSettings.wallets);
            return;
          }
        } catch (error) {
          console.error('Error fetching settings from Supabase:', error);
        } finally {
          setIsSyncing(false);
        }
      } else {
        // Use localStorage data
        setProfile(settings.profile || defaultProfile);
        setSavedProfile(settings.profile || defaultProfile);
        setWallets(settings.wallets || []);
      }
    };

    loadSettings();
  }, [userId, settingsKey]);

  // Check for unsaved changes
  useEffect(() => {
    const isChanged = JSON.stringify(profile) !== JSON.stringify(savedProfile);
    setHasUnsavedChanges(isChanged);
  }, [profile, savedProfile]);

  const updateProfile = (updates: Partial<ProfileSettings>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const saveProfile = () => {
    if (settingsKey && typeof window !== 'undefined') {
      setSavedProfile(profile);
      const settingsData = { profile, wallets };
      localStorage.setItem(settingsKey, JSON.stringify(settingsData));

      // Update currentUser data
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        userData.name = profile.username; // Update name only
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }

      // If we have a userId, sync with Supabase
      if (userId) {
        syncProfileWithSupabase(userId)
          .then(() => {
            // Success is handled silently
          })
          .catch(error => {
            console.error('Error syncing with Supabase:', error);
            // Error is already toasted in the sync function
          });
      }
    }
  };

  const addWallet = async (address: string) => {
    const newWallet: Wallet = {
      id: Date.now().toString(),
      address,
      isDefault: wallets.length === 0,
    };
    
    const updatedWallets = [...wallets, newWallet];
    setWallets(updatedWallets);
    
    if (settingsKey) {
      const settingsData = { profile, wallets: updatedWallets };
      localStorage.setItem(settingsKey, JSON.stringify(settingsData));
      
      // If we have a userId, add the wallet to Supabase
      if (userId) {
        try {
          const { error } = await supabase
            .from('user_wallets')
            .insert({
              user_id: userId,
              wallet_address: address,
              is_default: newWallet.isDefault
            });
            
          if (error) throw error;
        } catch (error) {
          console.error('Error adding wallet to Supabase:', error);
          toast.error('Failed to save wallet to database. Changes only saved locally.');
        }
      }
    }
  };

  const removeWallet = async (id: string) => {
    const walletToRemove = wallets.find(w => w.id === id);
    if (!walletToRemove) return;
    
    const remainingWallets = wallets.filter(w => w.id !== id);
    
    // If we're removing the default wallet, make another one default
    if (walletToRemove.isDefault && remainingWallets.length > 0) {
      remainingWallets[0].isDefault = true;
    }
    
    setWallets(remainingWallets);
    
    if (settingsKey) {
      const settingsData = { profile, wallets: remainingWallets };
      localStorage.setItem(settingsKey, JSON.stringify(settingsData));
      
      // If we have a userId, remove the wallet from Supabase
      if (userId) {
        try {
          // We need to find the actual database ID for this wallet
          const { data, error: fetchError } = await supabase
            .from('user_wallets')
            .select('id')
            .eq('wallet_address', walletToRemove.address)
            .eq('user_id', userId);
            
          if (fetchError) throw fetchError;
          
          if (data && data.length > 0) {
            const { error: deleteError } = await supabase
              .from('user_wallets')
              .delete()
              .eq('id', data[0].id);
              
            if (deleteError) throw deleteError;
            
            // If this was the default wallet, update another one
            if (walletToRemove.isDefault && remainingWallets.length > 0) {
              const newDefaultWallet = remainingWallets[0];
              const { data: walletData, error: walletFetchError } = await supabase
                .from('user_wallets')
                .select('id')
                .eq('wallet_address', newDefaultWallet.address)
                .eq('user_id', userId);
                
              if (walletFetchError) throw walletFetchError;
              
              if (walletData && walletData.length > 0) {
                const { error: updateError } = await supabase
                  .from('user_wallets')
                  .update({ is_default: true })
                  .eq('id', walletData[0].id);
                  
                if (updateError) throw updateError;
              }
            }
          }
        } catch (error) {
          console.error('Error removing wallet from Supabase:', error);
          toast.error('Failed to remove wallet from database. Changes only saved locally.');
        }
      }
    }
  };

  const setDefaultWallet = async (id: string) => {
    const updatedWallets = wallets.map(wallet => ({
      ...wallet,
      isDefault: wallet.id === id,
    }));
    
    setWallets(updatedWallets);
    
    if (settingsKey) {
      const settingsData = { profile, wallets: updatedWallets };
      localStorage.setItem(settingsKey, JSON.stringify(settingsData));
      
      // If we have a userId, update default wallet in Supabase
      if (userId) {
        try {
          // Find the wallet that's being set as default
          const newDefaultWallet = updatedWallets.find(w => w.id === id);
          if (!newDefaultWallet) return;
          
          // First, set all wallets to non-default
          const { error: resetError } = await supabase
            .from('user_wallets')
            .update({ is_default: false })
            .eq('user_id', userId);
            
          if (resetError) throw resetError;
          
          // Then set the new default
          const { data, error: fetchError } = await supabase
            .from('user_wallets')
            .select('id')
            .eq('wallet_address', newDefaultWallet.address)
            .eq('user_id', userId);
            
          if (fetchError) throw fetchError;
          
          if (data && data.length > 0) {
            const { error: updateError } = await supabase
              .from('user_wallets')
              .update({ is_default: true })
              .eq('id', data[0].id);
              
            if (updateError) throw updateError;
          }
        } catch (error) {
          console.error('Error updating default wallet in Supabase:', error);
          toast.error('Failed to update default wallet in database. Changes only saved locally.');
        }
      }
    }
  };

  const syncWithSupabase = async () => {
    if (!userId) {
      toast.error('You must be logged in to sync settings');
      return;
    }
    
    setIsSyncing(true);
    
    try {
      await syncProfileWithSupabase(userId);
      toast.success('Settings synchronized with database');
    } catch (error) {
      console.error('Error during sync:', error);
      toast.error('Failed to sync settings with database');
    } finally {
      setIsSyncing(false);
    }
  };

  const value = {
    profile,
    wallets,
    updateProfile,
    saveProfile,
    addWallet,
    removeWallet,
    setDefaultWallet,
    hasUnsavedChanges,
    isSyncing,
    syncWithSupabase,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
