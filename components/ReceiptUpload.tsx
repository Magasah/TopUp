'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { dict, t } from '@/lib/i18n';
import type { Locale } from '@/types';

const ACCEPT = 'image/png,image/jpeg,image/webp';
const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  locale: Locale;
  /** Returns base64 data URL */
  onChange: (dataUrl: string | null, file: File | null) => void;
  value?: string | null;
}

export function ReceiptUpload({ locale, onChange, value }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = useCallback(
    async (file: File | null) => {
      setError(null);
      if (!file) {
        onChange(null, null);
        return;
      }
      if (!ACCEPT.split(',').includes(file.type) || file.size > MAX_BYTES) {
        setError(t(dict.pay.receiptInvalid, locale));
        onChange(null, null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        onChange(result, file);
      };
      reader.onerror = () => setError(t(dict.pay.receiptInvalid, locale));
      reader.readAsDataURL(file);
    },
    [locale, onChange]
  );

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0] ?? null;
          void handleFile(f);
        }}
        className={cn(
          'relative block cursor-pointer rounded-2xl glass p-5 text-center transition-all duration-300 overflow-hidden',
          drag && 'shadow-neon-blue ring-1 ring-neon-blue/40',
          value && 'p-3'
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />

        <AnimatePresence mode="wait" initial={false}>
          {value ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="flex items-center gap-3 text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="receipt preview"
                className="h-20 w-20 rounded-xl object-cover ring-1 ring-white/10"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-[0.2em] text-white/55">
                  {t(dict.pay.receiptTitle, locale)}
                </div>
                <div className="mt-0.5 text-sm font-semibold text-neon-green">
                  ✓ {locale === 'ru' ? 'Готово к отправке' : 'Тайёр аст'}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (inputRef.current) inputRef.current.value = '';
                    void handleFile(null);
                  }}
                  className="mt-2 text-xs text-white/60 underline-offset-4 hover:underline hover:text-white"
                >
                  {locale === 'ru' ? 'Заменить файл' : 'Файлро иваз кунед'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-neon-blue/30 to-neon-magenta/30 border border-white/10">
                <UploadIcon />
              </div>
              <div className="font-semibold tracking-tight">
                {t(dict.buttons.upload, locale)}
              </div>
              <div className="mt-1 text-xs text-white/55">
                {t(dict.pay.receiptHint, locale)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </label>

      {error && (
        <p className="mt-2 text-xs text-rose-400">{error}</p>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V4m0 0-4 4m4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
