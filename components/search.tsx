'use client';

import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useEffect } from 'react';

interface SearchInputProps {
  inputValue?: string;
  onChange: any;
}

export function Search({ inputValue = '', onChange }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length,
      );
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <Input
      ref={inputRef}
      value={inputValue}
      placeholder="Search movies..."
      className="text-base bg-white w-full"
      onChange={handleInput}
    />
  );
}
