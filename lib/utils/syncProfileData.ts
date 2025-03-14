
import { supabase } from "@/src/integrations/supabase/client";
import { toast } from "sonner";

export interface ProfileData {
  username: string;
  profileImage: string | null;
  backgroundImage: string | null;
}

export interface WalletData {
  id: string;
  address: string;
  isDefault: boolean;
}

export interface UserSettings {
  profile: ProfileData;
  wallets: WalletData[];
}

// Function to sync profile data with Supabase
export async function syncProfileWithSupabase(userId: string): Promise<void> {
  try {
    // Step 1: Check if we have settings in localStorage
    const settingsKey = localStorage.getItem('currentUser') 
      ? JSON.parse(localStorage.getItem('currentUser') || '{}').settingsKey 
      : null;
    
    if (!settingsKey) return;
    
    const localSettings = localStorage.getItem(settingsKey);
    if (!localSettings) return;
    
    const settings: UserSettings = JSON.parse(localSettings);
    
    // Step 2: Update profile information in Supabase
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: settings.profile.username,
        profile_image: settings.profile.profileImage,
        background_image: settings.profile.backgroundImage
      })
      .eq('id', userId);
    
    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw profileError;
    }
    
    // Step 3: Handle wallets - this is more complex as we need to sync multiple wallets
    if (settings.wallets && settings.wallets.length > 0) {
      // Get existing wallets for this user
      const { data: existingWallets, error: fetchError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId);
      
      if (fetchError) {
        console.error('Error fetching existing wallets:', fetchError);
        throw fetchError;
      }
      
      // Create a map of existing wallet addresses
      const existingWalletMap = new Map();
      existingWallets?.forEach(wallet => {
        existingWalletMap.set(wallet.wallet_address, wallet);
      });
      
      // Process each wallet from localStorage
      for (const wallet of settings.wallets) {
        if (existingWalletMap.has(wallet.address)) {
          // Update existing wallet's default status if needed
          const existingWallet = existingWalletMap.get(wallet.address);
          if (existingWallet.is_default !== wallet.isDefault) {
            const { error: updateError } = await supabase
              .from('user_wallets')
              .update({ is_default: wallet.isDefault })
              .eq('id', existingWallet.id);
            
            if (updateError) {
              console.error('Error updating wallet:', updateError);
              throw updateError;
            }
          }
          
          // Remove from map to track which ones we've processed
          existingWalletMap.delete(wallet.address);
        } else {
          // Insert new wallet
          const { error: insertError } = await supabase
            .from('user_wallets')
            .insert({
              user_id: userId,
              wallet_address: wallet.address,
              is_default: wallet.isDefault
            });
          
          if (insertError) {
            console.error('Error inserting wallet:', insertError);
            throw insertError;
          }
        }
      }
      
      // Any wallets left in the map don't exist in localStorage, consider removing them
      // This is optional and depends on your desired behavior
      // for (const [_, wallet] of existingWalletMap.entries()) {
      //   const { error: deleteError } = await supabase
      //     .from('user_wallets')
      //     .delete()
      //     .eq('id', wallet.id);
      //   
      //   if (deleteError) {
      //     console.error('Error deleting wallet:', deleteError);
      //     throw deleteError;
      //   }
      // }
    }
    
    return;
  } catch (error) {
    console.error('Error syncing data with Supabase:', error);
    toast.error('Failed to sync settings with database');
    throw error;
  }
}

// Function to fetch profile data from Supabase and store to localStorage
export async function fetchProfileFromSupabase(userId: string): Promise<UserSettings | null> {
  try {
    // Step 1: Fetch profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }
    
    // Step 2: Fetch wallet data
    const { data: walletData, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId);
    
    if (walletError) {
      console.error('Error fetching wallets:', walletError);
      throw walletError;
    }
    
    // Step 3: Transform the data to match our local structure
    const settings: UserSettings = {
      profile: {
        username: profileData.username || profileData.display_name || 'User',
        profileImage: profileData.profile_image || null,
        backgroundImage: profileData.background_image || null
      },
      wallets: walletData.map((wallet: any) => ({
        id: wallet.id,
        address: wallet.wallet_address,
        isDefault: wallet.is_default
      }))
    };
    
    // Optional: Update localStorage with this data
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      const settingsKey = userData.settingsKey || `settings_${userId}`;
      
      localStorage.setItem(settingsKey, JSON.stringify(settings));
      
      // Update currentUser with settingsKey if it doesn't exist
      if (!userData.settingsKey) {
        userData.settingsKey = settingsKey;
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }
    }
    
    return settings;
  } catch (error) {
    console.error('Error fetching data from Supabase:', error);
    toast.error('Failed to fetch settings from database');
    return null;
  }
}
