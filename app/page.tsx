'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

import { GlassPanel } from '@/components/GlassPanel';
import { NeonButton } from '@/components/NeonButton';
import { StepIndicator, type StepKey } from '@/components/StepIndicator';
import { LanguageToggle } from '@/components/LanguageToggle';
import { GameCard } from '@/components/GameCard';
import { ProductCard } from '@/components/ProductCard';
import { PlayerIdInput } from '@/components/PlayerIdInput';
import { WalletCard, CopyRow } from '@/components/WalletCard';
import { ReceiptUpload } from '@/components/ReceiptUpload';
import { OrderSummary } from '@/components/OrderSummary';

import { GAMES, getGame } from '@/lib/games';
import { WALLETS, getWallet } from '@/lib/wallets';
import { dict, detectLocale, t } from '@/lib/i18n';
import { isValidPlayerId } from '@/lib/validation';
import type { GameId, Locale, OrderPayload, TelegramUserContext, WalletId } from '@/types';

// ---------- Telegram WebApp helpers ----------
function useTelegram() {
  const [tg, setTg] = useState<TelegramUserContext | null>(null);

  useEffect(() => {
    const w = window as any;
    const wa = w.Telegram?.WebApp;
    if (!wa) return;
    try {
      wa.ready?.();
      wa.expand?.();
      try { wa.setHeaderColor?.('#0a0a0b'); } catch {}
      try { wa.setBackgroundColor?.('#0a0a0b'); } catch {}
      const u = wa.initDataUnsafe?.user;
      if (u) {
        setTg({
          id: u.id,
          username: u.username,
          firstName: u.first_name,
          lastName: u.last_name,
          languageCode: u.language_code,
        });
      }
    } catch { /* noop */ }
  }, []);

  return tg;
}

// ---------- Page ----------
export default function HomePage() {
  const [locale, setLocale] = useState<Locale>('ru');
  useEffect(() => { setLocale(detectLocale()); }, []);

  const [tgSendAvailable, setTgSendAvailable] = useState(false);
  useEffect(() => {
    const w = typeof window !== 'undefined' ? (window as any) : null;
    if (w?.Telegram?.WebApp?.sendData) setTgSendAvailable(true);
  }, []);

  const tgUser = useTelegram();

  const [step, setStep] = useState<StepKey>('game');
  const [gameId, setGameId] = useState<GameId | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState('');
  const [walletId, setWalletId] = useState<WalletId | null>(null);
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const game = useMemo(() => (gameId ? getGame(gameId) : null), [gameId]);
  const item = useMemo(
    () => (game && itemId ? game.items.find((i) => i.id === itemId) ?? null : null),
    [game, itemId]
  );
  const wallet = useMemo(() => (walletId ? getWallet(walletId) : null), [walletId]);

  // ---------- Step navigation ----------
  function go(next: StepKey) { setStep(next); }

  function reset() {
    setStep('game');
    setGameId(null);
    setItemId(null);
    setPlayerId('');
    setWalletId(null);
    setReceiptDataUrl(null);
    setOrderId(null);
    setSubmitErr(null);
  }

  function handleGameSelect(id: GameId) {
    setGameId(id);
    setItemId(null);
    setTimeout(() => go('pack'), 220);
  }

  function handlePackSelect(id: string) {
    setItemId(id);
    setTimeout(() => go('id'), 240);
  }

  function handleSendOrderToBot() {
    if (!game || !item || !wallet || !isValidPlayerId(playerId)) return;
    const w = typeof window !== 'undefined' ? (window as any) : null;
    const wa = w?.Telegram?.WebApp;
    if (!wa?.sendData) return;
    const itemLabel = typeof item.label === 'string' ? item.label : item.label[locale];
    const payload = {
      v: 1 as const,
      game: game.id,
      itemId: item.id,
      itemLabel,
      amountTjs: item.priceTjs,
      playerId,
      wallet: wallet.id,
      locale,
      telegram: tgUser ?? undefined,
    };
    try {
      wa.sendData(JSON.stringify(payload));
    } catch {
      /* Telegram client may throw if payload > 4096 chars */
    }
  }

  async function handleSubmit() {
    if (!game || !item || !wallet || !receiptDataUrl) return;
    setSubmitting(true);
    setSubmitErr(null);
    try {
      const payload: OrderPayload = {
        game: game.id,
        itemId: item.id,
        itemLabel: typeof item.label === 'string' ? item.label : item.label[locale],
        amountTjs: item.priceTjs,
        playerId,
        wallet: wallet.id,
        receiptDataUrl,
        telegram: tgUser ?? undefined,
        locale,
      };
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || t(dict.errors.submit, locale));
      }
      setOrderId(String(json.orderId));
      go('done');
    } catch (e: any) {
      setSubmitErr(e?.message || t(dict.errors.submit, locale));
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Render ----------
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col safe-x safe-t safe-b">
      <Header locale={locale} onLocale={setLocale} />

      <section className="px-4 pb-3">
        <StepIndicator current={step} locale={locale} />
      </section>

      <section className="flex-1 px-4 pb-8">
        <AnimatePresence mode="wait" initial={false}>
          {step === 'game' && (
            <StepShell key="game">
              <SectionTitle
                title={t(dict.game.title, locale)}
                subtitle={t(dict.game.subtitle, locale)}
              />
              <div className="mt-5 grid gap-4">
                {GAMES.map((g, i) => (
                  <GameCard
                    key={g.id}
                    game={g}
                    locale={locale}
                    selected={gameId === g.id}
                    onSelect={handleGameSelect}
                    delay={i * 0.07}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {step === 'pack' && game && (
            <StepShell key="pack">
              <SectionTitle
                eyebrow={game.name}
                title={t(dict.pack.title, locale)}
              />

              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 pb-32">
                {game.items.map((it, i) => (
                  <ProductCard
                    key={it.id}
                    item={it}
                    locale={locale}
                    selected={itemId === it.id}
                    onSelect={handlePackSelect}
                    delay={i * 0.04}
                  />
                ))}
              </div>

              {/* Sticky Bottom Bar */}
              <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0b]/85 backdrop-blur-2xl border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.6)]">
                <div className="mx-auto max-w-xl px-4 py-4 safe-b">
                  {itemId && item ? (
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-wider text-white/50">
                          {locale === 'ru' ? 'Выбрано:' : 'Интихоб шуд:'}
                        </div>
                        <div className="font-display font-semibold text-sm truncate">
                          {typeof item.label === 'string' ? item.label : item.label[locale]}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display font-bold text-xl text-neon-blue">
                          {new Intl.NumberFormat('ru-RU').format(item.priceTjs)} <span className="text-sm font-medium text-white/60">{t(dict.currency, locale)}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <FooterNav
                    className="mt-0"
                    onBack={() => go('game')}
                    onNext={() => itemId && go('id')}
                    nextDisabled={!itemId}
                    locale={locale}
                  />
                </div>
              </div>
            </StepShell>
          )}

          {step === 'id' && game && item && (
            <StepShell key="id">
              <SectionTitle
                eyebrow={game.name}
                title={t(dict.id.title, locale)}
              />

              <div className="mt-5 space-y-4">
                <OrderSummary game={game} item={item} locale={locale} />
                <PlayerIdInput
                  value={playerId}
                  onChange={setPlayerId}
                  locale={locale}
                />
              </div>

              <FooterNav
                onBack={() => go('pack')}
                onNext={() => go('pay')}
                nextDisabled={!isValidPlayerId(playerId)}
                locale={locale}
              />
            </StepShell>
          )}

          {step === 'pay' && game && item && (
            <StepShell key="pay">
              <SectionTitle
                eyebrow={game.name}
                title={t(dict.pay.title, locale)}
              />

              <div className="mt-5 space-y-4">
                <OrderSummary game={game} item={item} playerId={playerId} locale={locale} />

                <div className="grid gap-2.5">
                  {WALLETS.map((w, i) => (
                    <WalletCard
                      key={w.id}
                      wallet={w}
                      locale={locale}
                      selected={walletId === w.id}
                      onSelect={setWalletId}
                      delay={i * 0.05}
                    />
                  ))}
                </div>

                <AnimatePresence initial={false}>
                  {wallet && (
                    <motion.div
                      key={wallet.id}
                      initial={{ opacity: 0, y: 12, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <CopyRow
                        label={t(dict.pay.walletLabel, locale)}
                        value={wallet.number}
                        locale={locale}
                      />
                      <CopyRow
                        label={t(dict.pay.amountLabel, locale)}
                        value={`${item.priceTjs} ${t(dict.currency, locale)}`}
                        locale={locale}
                      />
                      {tgSendAvailable && (
                        <div className="space-y-2 pt-1">
                          <p className="text-[11px] text-white/50 leading-snug px-0.5">
                            {t(dict.pay.sendToBotHint, locale)}
                          </p>
                          <NeonButton
                            type="button"
                            variant="ghost"
                            glow="magenta"
                            full
                            onClick={handleSendOrderToBot}
                            disabled={!isValidPlayerId(playerId)}
                          >
                            {t(dict.pay.sendToBot, locale)}
                          </NeonButton>
                        </div>
                      )}
                      <ReceiptUpload
                        locale={locale}
                        value={receiptDataUrl}
                        onChange={(url) => setReceiptDataUrl(url)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {submitErr && (
                  <div className="text-sm text-rose-400 px-1">{submitErr}</div>
                )}
              </div>

              <FooterNav
                onBack={() => go('id')}
                primaryLabel={t(dict.buttons.submit, locale)}
                onNext={handleSubmit}
                nextDisabled={!wallet || !receiptDataUrl || submitting}
                loading={submitting}
                locale={locale}
              />
            </StepShell>
          )}

          {step === 'done' && game && item && (
            <StepShell key="done">
              <SuccessView
                orderId={orderId ?? '—'}
                locale={locale}
                onAgain={reset}
              />
            </StepShell>
          )}
        </AnimatePresence>
      </section>

      <FooterBrand locale={locale} />
    </main>
  );
}

// ============================================================
// Helpers (presentational, kept here for cohesion)
// ============================================================

function Header({
  locale,
  onLocale,
}: {
  locale: Locale;
  onLocale: (l: Locale) => void;
}) {
  return (
    <header className="px-4 pt-4 pb-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="relative h-10 w-10 rounded-2xl glass-strong overflow-hidden ring-1 ring-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/TopUp.png"
            alt="TopUp.TJ"
            className="h-full w-full object-contain p-0.5"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/favicon.svg';
            }}
          />
        </div>
        <div className="leading-tight">
          <div className="font-display font-bold tracking-tight">TopUp.TJ</div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">
            {locale === 'ru' ? 'Премиум · 24/7' : 'Премиум · 24/7'}
          </div>
        </div>
      </div>

      <LanguageToggle value={locale} onChange={onLocale} />
    </header>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mt-2">
      {eyebrow && (
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neon-blue/90">
          {eyebrow}
        </div>
      )}
      <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-white/60">{subtitle}</p>
      )}
    </div>
  );
}

function StepShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
      transition={{ type: 'spring', stiffness: 240, damping: 26 }}
    >
      {children}
    </motion.div>
  );
}

function FooterNav({
  onBack,
  onNext,
  nextDisabled,
  primaryLabel,
  loading,
  locale,
  className,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  primaryLabel?: string;
  loading?: boolean;
  locale: Locale;
  className?: string;
}) {
  return (
    <div className={cn("mt-6 grid grid-cols-[auto_1fr] gap-3", className)}>
      <NeonButton variant="ghost" size="lg" onClick={onBack}>
        ← {t(dict.buttons.back, locale)}
      </NeonButton>
      <NeonButton
        variant="primary"
        size="lg"
        onClick={onNext}
        disabled={nextDisabled}
        loading={loading}
        full
        glow="mixed"
      >
        {primaryLabel ?? t(dict.buttons.next, locale)} →
      </NeonButton>
    </div>
  );
}

function SuccessView({
  orderId,
  locale,
  onAgain,
}: {
  orderId: string;
  locale: Locale;
  onAgain: () => void;
}) {
  return (
    <GlassPanel pad="lg" radius="4xl" neon className="mt-6 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-neon-green/30 to-neon-blue/30 border border-neon-green/40 shadow-neon-green"
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12.5l4.5 4.5L19 7"
            stroke="#39ff7a"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
        {t(dict.done.title, locale)}
      </h2>
      <p className="mt-2 text-sm text-white/65 max-w-sm mx-auto">
        {t(dict.done.subtitle, locale)}
      </p>

      <div className="mt-5 inline-flex items-center gap-2 rounded-full glass px-4 py-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/55">
          {t(dict.done.orderId, locale)}
        </span>
        <span className="font-mono font-bold text-neon-blue tracking-wider">
          {orderId}
        </span>
      </div>

      <p className="mt-4 text-xs text-white/50">{t(dict.done.contact, locale)}</p>

      <div className="mt-6">
        <NeonButton variant="primary" size="lg" full onClick={onAgain}>
          {t(dict.buttons.again, locale)}
        </NeonButton>
      </div>
    </GlassPanel>
  );
}

function FooterBrand({ locale }: { locale: Locale }) {
  return (
    <footer className="px-4 pt-2 pb-5 text-center">
      <div className="text-[10px] uppercase tracking-[0.28em] text-white/35">
        {locale === 'ru'
          ? '© TopUp.TJ · Безопасно · Анонимно'
          : '© TopUp.TJ · Бехатар · Махфӣ'}
      </div>
    </footer>
  );
}
