
import { useState } from 'react';
import { getRandomAstronomyTip } from '@/utils/astronomyTips';

export function useAstronomyTip() {
  const [randomTip, setRandomTip] = useState<[string, string] | null>(getRandomAstronomyTip());
  
  return {
    randomTip,
    setRandomTip
  };
}
