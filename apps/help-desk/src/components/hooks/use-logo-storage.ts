import { useState, useEffect, useCallback } from 'react';
import { useAppSettingList, useCreateAppSetting, useUpdateAppSetting } from './generated/hooks/use-app-setting';
import type { AppSetting } from './generated/models/app-setting-model';

const PRIMARY_LOGO_KEY = 'primary_logo';
const SECONDARY_LOGO_KEY = 'secondary_logo';

// Maximum size for base64 string to fit in Dataverse (2000 char limit with some buffer)
const MAX_SETTING_VALUE_LENGTH = 1900;

export interface CompanyLogos {
  primary: string | null;
  secondary: string | null;
}

const DEFAULT_LOGOS: CompanyLogos = {
  primary: null,
  secondary: null,
};

/**
 * Compresses an image to fit within the Dataverse field limit.
 * Returns a compressed base64 data URL or null if compression fails.
 */
async function compressImageToFit(dataUrl: string, maxLength: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // Start with small dimensions and very low quality for logos
      // Logos should be small icons anyway
      let maxDimension = 48; // Start very small
      let quality = 0.5;
      let result: string | null = null;

      // Try progressively smaller sizes until we fit
      while (maxDimension >= 16 && !result) {
        const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Try different quality levels
        for (quality = 0.5; quality >= 0.1; quality -= 0.1) {
          const compressed = canvas.toDataURL('image/jpeg', quality);
          if (compressed.length <= maxLength) {
            result = compressed;
            break;
          }
        }

        // If still too large, try PNG (might be smaller for simple graphics)
        if (!result) {
          const pngCompressed = canvas.toDataURL('image/png');
          if (pngCompressed.length <= maxLength) {
            result = pngCompressed;
          }
        }

        maxDimension -= 8; // Reduce size and try again
      }

      resolve(result);
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export function useLogoStorage() {
  const [logos, setLogos] = useState<CompanyLogos>(DEFAULT_LOGOS);
  
  // Fetch all app settings to find logo entries
  const { data: settings = [], isLoading, refetch } = useAppSettingList({
    filter: `settingType eq 'logo'`,
  });
  
  const createSetting = useCreateAppSetting();
  const updateSetting = useUpdateAppSetting();

  // Load logos from database when settings are fetched
  useEffect(() => {
    if (!isLoading && settings.length > 0) {
      const primarySetting = settings.find((s: AppSetting) => s.settingKey === PRIMARY_LOGO_KEY);
      const secondarySetting = settings.find((s: AppSetting) => s.settingKey === SECONDARY_LOGO_KEY);
      
      setLogos({
        primary: primarySetting?.settingValue || null,
        secondary: secondarySetting?.settingValue || null,
      });
    }
  }, [settings, isLoading]);

  // Save logo for a company - persists to database
  const saveLogo = useCallback(async (company: 'primary' | 'secondary', dataUrl: string) => {
    const settingKey = company === 'primary' ? PRIMARY_LOGO_KEY : SECONDARY_LOGO_KEY;
    
    // Check if the data URL exceeds the limit
    let finalDataUrl = dataUrl;
    if (dataUrl.length > MAX_SETTING_VALUE_LENGTH) {
      // Compress the image to fit within limits
      const compressed = await compressImageToFit(dataUrl, MAX_SETTING_VALUE_LENGTH);
      if (!compressed) {
        throw new Error('Unable to compress image to fit within storage limits. Please use a smaller image.');
      }
      finalDataUrl = compressed;
    }
    
    // Update local state immediately for UI responsiveness
    setLogos(prev => ({ ...prev, [company]: finalDataUrl }));
    
    // Find existing setting
    const existingSetting = settings.find((s: AppSetting) => s.settingKey === settingKey);
    
    try {
      if (existingSetting) {
        // Update existing setting
        await updateSetting.mutateAsync({
          id: existingSetting.id,
          changedFields: {
            settingValue: finalDataUrl,
            updatedDate: new Date().toISOString(),
          },
        });
      } else {
        // Create new setting
        await createSetting.mutateAsync({
          settingKey,
          settingValue: finalDataUrl,
          settingType: 'logo',
          updatedDate: new Date().toISOString(),
        });
      }
      // Refetch to ensure sync
      refetch();
    } catch (error: unknown) {
      console.error('Error saving logo to database:', error);
      // Revert local state on error
      setLogos(prev => ({ ...prev, [company]: existingSetting?.settingValue || null }));
      throw error; // Re-throw so the UI can show an error message
    }
  }, [settings, updateSetting, createSetting, refetch]);

  // Remove logo for a company
  const removeLogo = useCallback(async (company: 'primary' | 'secondary') => {
    const settingKey = company === 'primary' ? PRIMARY_LOGO_KEY : SECONDARY_LOGO_KEY;
    const existingSetting = settings.find((s: AppSetting) => s.settingKey === settingKey);
    
    // Update local state immediately
    setLogos(prev => ({ ...prev, [company]: null }));
    
    if (existingSetting) {
      try {
        // Set value to empty string instead of deleting (keeps the setting for future use)
        await updateSetting.mutateAsync({
          id: existingSetting.id,
          changedFields: {
            settingValue: '',
            updatedDate: new Date().toISOString(),
          },
        });
        refetch();
      } catch (error: unknown) {
        console.error('Error removing logo from database:', error);
        // Revert local state on error
        setLogos(prev => ({ ...prev, [company]: existingSetting.settingValue || null }));
      }
    }
  }, [settings, updateSetting, refetch]);

  // Reset all logos
  const resetLogos = useCallback(async () => {
    setLogos(DEFAULT_LOGOS);
    
    const primarySetting = settings.find((s: AppSetting) => s.settingKey === PRIMARY_LOGO_KEY);
    const secondarySetting = settings.find((s: AppSetting) => s.settingKey === SECONDARY_LOGO_KEY);
    
    try {
      const updates = [];
      if (primarySetting) {
        updates.push(updateSetting.mutateAsync({
          id: primarySetting.id,
          changedFields: { settingValue: '', updatedDate: new Date().toISOString() },
        }));
      }
      if (secondarySetting) {
        updates.push(updateSetting.mutateAsync({
          id: secondarySetting.id,
          changedFields: { settingValue: '', updatedDate: new Date().toISOString() },
        }));
      }
      await Promise.all(updates);
      refetch();
    } catch (error: unknown) {
      console.error('Error resetting logos:', error);
    }
  }, [settings, updateSetting, refetch]);

  // Convert file to data URL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return {
    logos,
    isLoading,
    saveLogo,
    removeLogo,
    resetLogos,
    fileToDataUrl,
  };
}
