import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Upload, Sliders, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import wpHexSphere from '@/assets/wp-hex-sphere.jpg';
import wpTechCircle from '@/assets/wp-tech-circle.webp';
import wpStripes from '@/assets/wp-3d-stripes.jpg';
import wpMeshCurve from '@/assets/wp-mesh-curve.jpg';

interface WallpaperSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_WALLPAPERS = [
  {
    id: 'hex-sphere',
    name: 'Esfera Hex',
    thumbnail: `url(${wpHexSphere})`,
    url: wpHexSphere,
    isGradient: false,
    type: 'image' as const,
  },
  {
    id: 'tech-circle',
    name: 'Tech Circle',
    thumbnail: `url(${wpTechCircle})`,
    url: wpTechCircle,
    isGradient: false,
    type: 'image' as const,
  },
  {
    id: 'stripes-3d',
    name: '3D Stripes',
    thumbnail: `url(${wpStripes})`,
    url: wpStripes,
    isGradient: false,
    type: 'image' as const,
  },
  {
    id: 'mesh-curve',
    name: 'Mesh Curve',
    thumbnail: `url(${wpMeshCurve})`,
    url: wpMeshCurve,
    isGradient: false,
    type: 'image' as const,
  },
  {
    id: 'carbon',
    name: 'Fibra de Carbono',
    thumbnail: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
    url: null,
    isGradient: true,
    type: 'gradient' as const,
  },
  {
    id: 'night-sky',
    name: 'Cielo Nocturno',
    thumbnail: 'linear-gradient(to bottom, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    url: null,
    isGradient: true,
    type: 'gradient' as const,
  },
  {
    id: 'deep-ocean',
    name: 'Océano Profundo',
    thumbnail: 'linear-gradient(135deg, #0a192f 0%, #112240 50%, #0a192f 100%)',
    url: null,
    isGradient: true,
    type: 'gradient' as const,
  },
  {
    id: 'geometric',
    name: 'Geométrico',
    thumbnail: 'linear-gradient(45deg, #1a1a2e 25%, transparent 25%), linear-gradient(-45deg, #1a1a2e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a2e 75%), linear-gradient(-45deg, transparent 75%, #1a1a2e 75%)',
    url: null,
    isGradient: true,
    type: 'gradient' as const,
  },
];

const STORAGE_KEY = 'wallpaper-settings';

interface WallpaperSettings {
  type: 'preset' | 'custom' | 'none';
  presetId?: string;
  presetType?: 'gradient' | 'image';
  presetUrl?: string;
  customUrl?: string;
  opacity: number;
}

export const WallpaperSelector = ({ isOpen, onClose }: WallpaperSelectorProps) => {
  const { isAuthenticated } = useAuth();
  const { updateWallpaper } = useProfile();
  
  const [settings, setSettings] = useState<WallpaperSettings>({
    type: 'none',
    opacity: 0.3,
  });
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        if (parsed.customUrl) {
          setCustomPreview(parsed.customUrl);
        }
      } catch (e) {
        console.error('Failed to parse wallpaper settings:', e);
      }
    }
  }, []);

  // Save settings to localStorage and optionally to DB
  const saveSettings = async (newSettings: WallpaperSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    // Dispatch custom event for background component to listen
    window.dispatchEvent(new CustomEvent('wallpaper-change', { detail: newSettings }));
    
    // Save to database if authenticated
    if (isAuthenticated) {
      const url = newSettings.type === 'custom' ? newSettings.customUrl : null;
      await updateWallpaper(url ?? null, newSettings.opacity);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESET_WALLPAPERS.find(p => p.id === presetId);
    saveSettings({
      ...settings,
      type: 'preset',
      presetId,
      presetType: preset?.type ?? 'gradient',
      presetUrl: preset?.url ?? undefined,
      customUrl: undefined,
    });
    setCustomPreview(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress and convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Max dimensions
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        setCustomPreview(compressed);
        saveSettings({
          ...settings,
          type: 'custom',
          customUrl: compressed,
          presetId: undefined,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleOpacityChange = (value: number[]) => {
    saveSettings({
      ...settings,
      opacity: value[0],
    });
  };

  const handleClearWallpaper = () => {
    saveSettings({
      type: 'none',
      opacity: 0.3,
    });
    setCustomPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative modal-cyber w-full max-w-md rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-cyan-400/15">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-cyan-300" />
                <h2 className="modal-cyber-title text-sm font-semibold">
                  Personalizar Fondo
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Custom Upload */}
              <div>
                <label className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
                  <Upload className="w-4 h-4" />
                  Subir imagen
                </label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 
                           flex items-center justify-center gap-2 text-muted-foreground hover:text-primary
                           transition-colors bg-muted/20"
                >
                  {customPreview ? (
                    <div 
                      className="w-full h-full rounded-lg bg-cover bg-center relative"
                      style={{ backgroundImage: `url(${customPreview})` }}
                    >
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <span className="text-xs text-white">Click para cambiar</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span className="text-sm">Click para subir</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Preset Gallery */}
              <div>
                <label className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
                  <Image className="w-4 h-4" />
                  Galería predefinida
                </label>
                
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_WALLPAPERS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.id)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        settings.type === 'preset' && settings.presetId === preset.id
                          ? 'border-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                          : 'border-transparent hover:border-border/50'
                      }`}
                      style={{
                        background: preset.thumbnail,
                        backgroundSize: preset.isGradient ? undefined : 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {settings.type === 'preset' && settings.presetId === preset.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Opacity Slider */}
              <div>
                <label className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
                  <Sliders className="w-4 h-4" />
                  Opacidad del fondo
                </label>
                
                <div className="flex items-center gap-4">
                  <Slider
                    value={[settings.opacity]}
                    onValueChange={handleOpacityChange}
                    min={0.1}
                    max={1}
                    step={0.05}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-muted-foreground w-12 text-right">
                    {Math.round(settings.opacity * 100)}%
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClearWallpaper}
                  className="flex-1"
                >
                  Quitar fondo
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const useWallpaperSettings = () => {
  const [settings, setSettings] = useState<WallpaperSettings>({
    type: 'none',
    opacity: 0.3,
  });

  useEffect(() => {
    // Load initial settings
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse wallpaper settings:', e);
      }
    }

    // Listen for changes
    const handleChange = (e: CustomEvent<WallpaperSettings>) => {
      setSettings(e.detail);
    };

    window.addEventListener('wallpaper-change', handleChange as EventListener);
    return () => window.removeEventListener('wallpaper-change', handleChange as EventListener);
  }, []);

  return settings;
};

export type { WallpaperSettings };
