import { Box } from '@mui/material';
import { useAppSelector } from '../app/hooks';

interface LogoProps {
  width?: number;
  alt?: string;
  variant?: 'auto' | 'dark' | 'light';
}

export function Logo({ width = 120, alt = 'Taskbox', variant = 'auto' }: LogoProps) {
  const themeMode = useAppSelector((state) => state.ui.themeMode);
  const logoSrc = variant === 'dark' || (variant === 'auto' && themeMode === 'dark')
    ? '/logo_dark.png'
    : '/logo_light.png';

  return (
    <Box
      component="img"
      src={logoSrc}
      alt={alt}
      sx={{
        width,
        height: 'auto',
        display: 'block',
      }}
    />
  );
}
