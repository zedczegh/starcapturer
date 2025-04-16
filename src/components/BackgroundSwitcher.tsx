
import React from 'react';
import { useBackground } from '@/contexts/BackgroundContext';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const BackgroundSwitcher = () => {
  const { currentBackground, setBackground, backgroundOptions } = useBackground();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="fixed bottom-4 right-4 z-50 bg-black/30 backdrop-blur-sm hover:bg-black/50 border-white/20"
        >
          <Settings className="h-4 w-4 mr-2" />
          Background
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-black/70 backdrop-blur-md border-white/10">
        {backgroundOptions.map((option) => (
          <DropdownMenuItem 
            key={option.id} 
            className={`flex items-center gap-2 ${currentBackground === option.src ? 'bg-white/10' : ''}`}
            onClick={() => setBackground(option.src)}
          >
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ 
                backgroundImage: `url(${option.src})`, 
                backgroundSize: 'cover',
                border: currentBackground === option.src ? '2px solid white' : 'none'
              }} 
            />
            {option.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BackgroundSwitcher;
