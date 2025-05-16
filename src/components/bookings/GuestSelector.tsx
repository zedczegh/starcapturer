
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Minus, Users, Dog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface GuestCategory {
  type: 'adults' | 'children' | 'infants' | 'pets';
  count: number;
  min: number;
  max: number;
}

interface GuestSelectorProps {
  onChange: (guestCounts: Record<string, number>) => void;
  maxGuests?: number;
}

const GuestSelector: React.FC<GuestSelectorProps> = ({ onChange, maxGuests = 10 }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [guests, setGuests] = useState<GuestCategory[]>([
    { type: 'adults', count: 1, min: 1, max: maxGuests },
    { type: 'children', count: 0, min: 0, max: maxGuests },
    { type: 'infants', count: 0, min: 0, max: 5 },
    { type: 'pets', count: 0, min: 0, max: 5 },
  ]);

  const handleIncrement = (index: number) => {
    const newGuests = [...guests];
    if (newGuests[index].count < newGuests[index].max) {
      newGuests[index].count += 1;
      setGuests(newGuests);
      notifyChange(newGuests);
    }
  };

  const handleDecrement = (index: number) => {
    const newGuests = [...guests];
    if (newGuests[index].count > newGuests[index].min) {
      newGuests[index].count -= 1;
      setGuests(newGuests);
      notifyChange(newGuests);
    }
  };

  const notifyChange = (guestList: GuestCategory[]) => {
    const guestCounts = guestList.reduce((acc, guest) => {
      acc[guest.type] = guest.count;
      return acc;
    }, {} as Record<string, number>);
    
    onChange(guestCounts);
  };

  const totalGuests = guests.reduce((sum, guest) => sum + (guest.type === 'adults' || guest.type === 'children' ? guest.count : 0), 0);
  const totalPeople = guests.reduce((sum, guest) => sum + (guest.type !== 'pets' ? guest.count : 0), 0);
  const hasPets = guests.find(g => g.type === 'pets')?.count || 0;

  const getGuestTypeLabel = (type: string) => {
    switch (type) {
      case 'adults':
        return { 
          label: t('Adults', '成人'), 
          description: t('Ages 13+', '13岁及以上') 
        };
      case 'children':
        return { 
          label: t('Children', '儿童'), 
          description: t('Ages 2-12', '2-12岁') 
        };
      case 'infants':
        return { 
          label: t('Infants', '婴儿'), 
          description: t('Under 2', '2岁以下') 
        };
      case 'pets':
        return { 
          label: t('Pets', '宠物'), 
          description: t('Host approval required', '需获得主人批准') 
        };
      default:
        return { label: type, description: '' };
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start border border-cosmic-700/40 bg-cosmic-800/20 hover:bg-cosmic-800/40 py-4 h-auto"
        >
          {totalGuests > 0 ? (
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              <span>
                {totalGuests} {t('guest(s)', '位客人')}
                {hasPets > 0 && (
                  <span className="flex items-center ml-2">
                    <Dog className="mr-1 h-3.5 w-3.5" />
                    {hasPets} {t('pet(s)', '只宠物')}
                  </span>
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              <span>{t('Select guests', '选择客人')}</span>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-cosmic-800 border border-cosmic-700/40">
        {guests.map((guest, index) => {
          const { label, description } = getGuestTypeLabel(guest.type);
          return (
            <div key={guest.type} className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium">{label}</div>
                <div className="text-sm text-gray-400">{description}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 rounded-full ${guest.count <= guest.min ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => handleDecrement(index)}
                  disabled={guest.count <= guest.min}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center">{guest.count}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 rounded-full ${guest.count >= guest.max ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => handleIncrement(index)}
                  disabled={guest.count >= guest.max}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};

export default GuestSelector;
