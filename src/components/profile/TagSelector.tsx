
import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { safeFilter } from '@/utils/tagCache';
import { safeToString } from '@/utils/stringUtils';

// Common tags that users can select from
const COMMON_TAGS = [
  { value: 'astronomy', label: 'Astronomy' },
  { value: 'astrophotography', label: 'Astrophotography' },
  { value: 'stargazing', label: 'Stargazing' },
  { value: 'milky-way', label: 'Milky Way' },
  { value: 'telescopes', label: 'Telescopes' },
  { value: 'planets', label: 'Planets' },
  { value: 'galaxies', label: 'Galaxies' },
  { value: 'nebulae', label: 'Nebulae' },
  { value: 'dark-sky', label: 'Dark Sky' },
  { value: 'meteor-shower', label: 'Meteor Shower' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'space-science', label: 'Space Science' },
  { value: 'cosmology', label: 'Cosmology' },
  { value: 'night-photography', label: 'Night Photography' },
  { value: 'citizen-science', label: 'Citizen Science' },
  { value: 'professional-astronomer', label: 'Professional Astronomer' },
  { value: 'amateur-astronomer', label: 'Amateur Astronomer' },
  { value: 'meteorology', label: 'Meteorology' },
  { value: 'cosmos-lover', label: 'Cosmos Lover' },
  { value: 'traveler', label: 'Traveler' },
  { value: 'dark-sky-volunteer', label: 'Dark Sky Volunteer' },
];

interface TagSelectorProps {
  onSelect: (tag: string) => void;
  selectedTags: string[];
  disabled?: boolean;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  onSelect,
  selectedTags = [], // Provide default empty array
  disabled = false
}) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [customTag, setCustomTag] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Translate common tags based on current language
  const translateTag = (tag: string): string => {
    // Here you can implement tag translation if needed
    return tag;
  };

  const handleSelectTag = (currentValue: string) => {
    setValue(currentValue);
    if (currentValue && !selectedTags.includes(currentValue)) {
      onSelect(currentValue);
    }
    setOpen(false);
  };

  const handleCustomTagSubmit = () => {
    if (customTag && !selectedTags.includes(customTag)) {
      onSelect(customTag);
      setCustomTag('');
    }
  };

  useEffect(() => {
    if (!open) {
      setValue('');
    }
  }, [open]);

  // Make sure COMMON_TAGS is defined and use safeFilter to handle filtering
  const commonTagsArray = Array.isArray(COMMON_TAGS) ? COMMON_TAGS : [];
  
  // Use safeFilter to ensure we're not filtering undefined values
  const availableTags = safeFilter(
    commonTagsArray,
    tag => !selectedTags.includes(safeToString(tag.value)) && 
           !selectedTags.includes(safeToString(tag.label))
  );

  // Ensure we have a valid list structure even if availableTags is empty
  const safeAvailableTags = Array.isArray(availableTags) ? availableTags : [];
  
  return (
    <div className="flex flex-col space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="justify-between bg-cosmic-800/30 border-cosmic-700/50 hover:bg-cosmic-800/50 text-cosmic-200"
          >
            <div className="flex items-center">
              <TagIcon className="h-4 w-4 mr-2 text-cosmic-400" />
              {t('Select a tag', '选择标签')}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[250px] bg-cosmic-900 border-cosmic-700">
          <Command className="bg-cosmic-900">
            <CommandInput 
              placeholder={t('Search tags...', '搜索标签...')} 
              className="bg-cosmic-800/30 text-cosmic-200 placeholder:text-cosmic-500"
            />
            <CommandEmpty className="py-2 px-3 text-cosmic-400">
              <div className="flex flex-col space-y-2 w-full">
                <p>{t('No tag found. Create a custom one:', '未找到标签。创建自定义标签:')}</p>
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder={t('Enter custom tag', '输入自定义标签')}
                    className="flex-1 py-1 px-2 text-sm rounded bg-cosmic-800 border border-cosmic-700 text-cosmic-200 placeholder:text-cosmic-500"
                  />
                  <Button 
                    size="sm"
                    disabled={!customTag.trim()} 
                    onClick={handleCustomTagSubmit}
                  >
                    {t('Add', '添加')}
                  </Button>
                </div>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {safeAvailableTags.length > 0 ? (
                safeAvailableTags.map((tag) => (
                  <CommandItem
                    key={tag.value}
                    value={tag.value}
                    onSelect={handleSelectTag}
                    className="text-cosmic-200 hover:bg-cosmic-800"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === tag.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <TagIcon className="h-3.5 w-3.5 mr-2 text-cosmic-400" />
                    {translateTag(tag.label)}
                  </CommandItem>
                ))
              ) : (
                <div className="py-2 px-3 text-cosmic-400">
                  {t('No tags available', '没有可用的标签')}
                </div>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TagSelector;
