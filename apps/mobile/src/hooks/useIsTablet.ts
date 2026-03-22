import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

const TABLET_MIN_WIDTH = 768;

export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(
    () => Dimensions.get('window').width >= TABLET_MIN_WIDTH,
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsTablet(window.width >= TABLET_MIN_WIDTH);
    });
    return () => subscription.remove();
  }, []);

  return isTablet;
}
