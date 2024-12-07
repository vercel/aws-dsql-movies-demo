'use client';

import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';

interface SearchInputProps {
  inputValue?: string;
  onChange: any;
}

export function Search({ inputValue = '', onChange }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (inputValue) {
      params.set('filter', inputValue);
    } else {
      params.delete('filter');
    }
    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [router, inputValue, searchParams]);

  useEffect(() => {
    if (!isMobile) {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === '/' && document.activeElement !== inputRef.current) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      };

      document.addEventListener('keydown', handleKeyPress);

      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [isMobile]);

  useEffect(() => {
    if (
      !isMobile &&
      inputRef.current &&
      document.activeElement !== inputRef.current
    ) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length,
      );
    }
  }, [isMobile]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        placeholder="Search movies..."
        className="text-base bg-white dark:bg-gray-950 text-black dark:text-white focus:border-black dark:border-gray-700 dark:focus:border-gray-200 w-full pr-8"
        onChange={handleInput}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 items-center justify-center bg-gray-100 dark:bg-gray-900 rounded text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700 md:flex hidden">
        <span className="font-mono text-xs">/</span>
      </div>
    </div>
  );
}
