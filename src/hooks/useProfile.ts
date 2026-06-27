import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useAuth } from './useAuth';

export interface ProfileSettings {
  wallpaper_url: string | null;
  wallpaper_opacity: number;
  music_preference: string | null;
}

export const useProfile = () => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallpaper_url, wallpaper_opacity, music_preference')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          wallpaper_url: data.wallpaper_url,
          wallpaper_opacity: data.wallpaper_opacity ?? 0.3,
          music_preference: data.music_preference,
        });

        // Apply wallpaper to localStorage for CustomBackground
        if (data.wallpaper_url) {
          const settings = {
            type: 'custom',
            customUrl: data.wallpaper_url,
            opacity: data.wallpaper_opacity ?? 0.3,
          };
          localStorage.setItem('wallpaper-settings', JSON.stringify(settings));
          window.dispatchEvent(new CustomEvent('wallpaper-change', { detail: settings }));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, loadProfile]);

  const updateWallpaper = useCallback(async (url: string | null, opacity: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          wallpaper_url: url,
          wallpaper_opacity: opacity,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, wallpaper_url: url, wallpaper_opacity: opacity } : null);
    } catch (error) {
      console.error('Error updating wallpaper:', error);
    }
  }, [user]);

  const updateMusicPreference = useCallback(async (preference: string | null) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          music_preference: preference,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, music_preference: preference } : null);
    } catch (error) {
      console.error('Error updating music preference:', error);
    }
  }, [user]);

  return {
    profile,
    isLoading,
    updateWallpaper,
    updateMusicPreference,
    reloadProfile: loadProfile,
  };
};
