import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { searchLocations } from '@/services/geocoding';
import { toast } from 'sonner';

interface LocationUpdateInputProps {
  onLocationUpdate: (lat: number, lng: number) => void;
  className?: string;
}

const LocationUpdateInput: React.FC<LocationUpdateInputProps> = ({
  onLocationUpdate,
  className = ''
}) => {
  const { t } = useLanguage();
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!address.trim()) {
      toast.error(t('Please enter an address', '请输入地址'));
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchLocations(address);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        onLocationUpdate(latitude, longitude);
        toast.success(t('Location updated successfully', '位置更新成功'));
        setAddress('');
      } else {
        toast.error(t('Address not found', '未找到地址'));
      }
    } catch (error) {
      console.error('Location search error:', error);
      toast.error(t('Failed to search location', '搜索位置失败'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cosmic-400" />
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('Enter address or paste from clipboard...', '输入地址或从剪贴板粘贴...')}
          className="pl-10 bg-cosmic-900/50 border-cosmic-700 text-white placeholder-cosmic-400"
        />
      </div>
      <Button
        onClick={handleSearch}
        disabled={isSearching || !address.trim()}
        size="sm"
        className="px-3"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default LocationUpdateInput;