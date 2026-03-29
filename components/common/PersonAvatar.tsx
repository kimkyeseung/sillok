'use client';

/**
 * PersonAvatar — FIELD 태그별 스타일이 적용되는 인물 placeholder avatar.
 * 썸네일이 없을 때 이니셜 + 태그별 배경/아이콘을 표시합니다.
 */

interface PersonAvatarProps {
  name: string;
  /** Primary FIELD tag name_en (e.g. 'Royalty', 'Scholar', 'General') */
  fieldTag?: string | null;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface FieldStyle {
  bg: string;
  text: string;
  icon: string; // SVG path
}

const FIELD_STYLES: Record<string, FieldStyle> = {
  Royalty: {
    bg: 'bg-gradient-to-br from-amber-100 to-yellow-200',
    text: 'text-amber-700',
    icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', // crown/star
  },
  Scholar: {
    bg: 'bg-gradient-to-br from-blue-100 to-indigo-200',
    text: 'text-indigo-700',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', // book
  },
  General: {
    bg: 'bg-gradient-to-br from-red-100 to-rose-200',
    text: 'text-red-700',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', // shield
  },
  Politician: {
    bg: 'bg-gradient-to-br from-purple-100 to-violet-200',
    text: 'text-purple-700',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', // building
  },
  Artist: {
    bg: 'bg-gradient-to-br from-pink-100 to-fuchsia-200',
    text: 'text-pink-700',
    icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42', // paintbrush
  },
  'Independence Activist': {
    bg: 'bg-gradient-to-br from-emerald-100 to-teal-200',
    text: 'text-emerald-700',
    icon: 'M3 21h4l10-10-4-4L3 17v4zm17.71-13.71a1 1 0 000-1.41l-2.59-2.59a1 1 0 00-1.41 0l-1.96 1.96 4 4 1.96-1.96z', // flag/pen
  },
  'Religious Leader': {
    bg: 'bg-gradient-to-br from-orange-100 to-amber-200',
    text: 'text-orange-700',
    icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z', // sun/dharma
  },
  'Culture & Entertainment': {
    bg: 'bg-gradient-to-br from-cyan-100 to-sky-200',
    text: 'text-cyan-700',
    icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3', // music note
  },
  Entrepreneur: {
    bg: 'bg-gradient-to-br from-lime-100 to-green-200',
    text: 'text-lime-700',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', // trending up
  },
  Sports: {
    bg: 'bg-gradient-to-br from-orange-100 to-red-200',
    text: 'text-orange-700',
    icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z', // play/sports
  },
};

const DEFAULT_STYLE: FieldStyle = {
  bg: 'bg-gradient-to-br from-gray-100 to-gray-200',
  text: 'text-gray-500',
  icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', // person
};

const SIZE_MAP = {
  sm: { container: 'h-8 w-8', initial: 'text-xs', icon: 'h-3.5 w-3.5' },
  md: { container: 'h-10 w-10', initial: 'text-sm', icon: 'h-4 w-4' },
  lg: { container: 'h-full w-full', initial: 'text-2xl md:text-3xl', icon: 'h-6 w-6 md:h-8 md:w-8' },
};

export default function PersonAvatar({
  name,
  fieldTag,
  size = 'md',
  className = '',
}: PersonAvatarProps) {
  const style = (fieldTag && FIELD_STYLES[fieldTag]) || DEFAULT_STYLE;
  const sizes = SIZE_MAP[size];
  const initials = name.slice(0, 2);

  return (
    <div
      className={`flex items-center justify-center ${style.bg} ${sizes.container} ${className}`}
    >
      {size === 'sm' ? (
        /* Small: icon only */
        <svg
          className={`${style.text} h-4 w-4`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
        </svg>
      ) : (
        /* Medium / Large: initials + icon */
        <div className="flex flex-col items-center gap-0.5">
          <span className={`font-bold ${style.text} ${sizes.initial} leading-none`}>
            {initials}
          </span>
          {size === 'lg' && (
            <svg
              className={`${style.text} ${sizes.icon} opacity-40`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}

// Re-export for client components that already import from here
export { getPrimaryFieldTag } from '@/lib/person-utils';
