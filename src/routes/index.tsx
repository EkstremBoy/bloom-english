import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import {
  CARDS,
  CATEGORIES,
  mediaUrl,
  pickDeck,
  type BoomCard,
  type CategoryId,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

type Answer = { cardId: string; choice: string; correct: boolean };
type Phase = "home" | "play" | "summary";

const ALL_IDS = CATEGORIES.map((c) => c.id);

function Home() {
  const [phase, setPhase] = useState<Phase>("home");
  const [selected, setSelected] = useState<Set<CategoryId>>(new Set(ALL_IDS));
  const [count, setCount] = useState(10);
  const [deck, setDeck] = useState<BoomCard[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [choices, setChoices] = useState<string[]>([]);

  const available = useMemo(
    () => CARDS.filter((c) => selected.has(c.category)).length,
    [selected],
  );
  const card = deck[index];
  const correctCount = answers.filter((a) => a.correct).length;
  const missedIds = answers.filter((a) => !a.correct).map((a) => a.cardId);
  const missedCards = missedIds
    .map((id) => CARDS.find((c) => c.id === id))
    .filter((c): c is BoomCard => Boolean(c));

  useEffect(() => {
    if (phase !== "play") return;
    for (let i = index; i < index + 3 && i < deck.length; i++) {
      const next = deck[i];
      if (!next) continue;
      const preload = new Image();
      preload.src = mediaUrl(next.image);
    }
  }, [phase, index, deck]);

  function begin(nextDeck: BoomCard[]) {
    if (nextDeck.length === 0) return;
    setDeck(nextDeck);
    setPhase("play");
    setIndex(0);
    setAnswers([]);
    setPicked(null);
    setChoices(shuffleChoices(nextDeck[0]!));
  }

  function startFromHome() {
    const ids = [...selected];
    const n = Math.min(Math.max(1, count), available);
    begin(pickDeck(ids, n));
  }

  function choose(choice: string) {
    if (picked || !card) return;
    setPicked(choice);
    setAnswers((prev) => [...prev, { cardId: card.id, choice, correct: choice === card.word }]);
  }

  function next() {
    if (!picked) return;
    if (index >= deck.length - 1) {
      setPhase("summary");
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setPicked(null);
    setChoices(shuffleChoices(deck[nextIndex]!));
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-28 pt-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setPhase("home")} className="text-left">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Ages 5–16
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Bloom English
          </h1>
        </button>
        {phase === "play" ? (
          <p className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium tabular-nums text-muted">
            {index + 1} / {deck.length}
          </p>
        ) : null}
      </header>

      {phase === "home" ? (
        <HomePicker
          selected={selected}
          onToggle={(id) => {
            setSelected((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }}
          onAll={() => setSelected(new Set(ALL_IDS))}
          onNone={() => setSelected(new Set())}
          count={count}
          onCount={setCount}
          available={available}
          onStart={startFromHome}
        />
      ) : null}

      {phase === "play" && card ? (
        <PlayCard
          key={card.id}
          card={card}
          index={index}
          total={deck.length}
          picked={picked}
          choices={choices}
          onChoose={choose}
          onNext={next}
          isLast={index === deck.length - 1}
        />
      ) : null}

      {phase === "summary" ? (
        <Summary
          correctCount={correctCount}
          total={deck.length}
          missed={missedCards}
          onAgain={startFromHome}
          onHome={() => setPhase("home")}
          onRetryMissed={() => begin(missedCards.length ? missedCards : deck)}
        />
      ) : null}
    </main>
  );
}

function shuffleChoices(card: BoomCard) {
  const pool = [card.word, ...card.distractors];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool;
}

function HomePicker({
  selected,
  onToggle,
  onAll,
  onNone,
  count,
  onCount,
  available,
  onStart,
}: {
  selected: Set<CategoryId>;
  onToggle: (id: CategoryId) => void;
  onAll: () => void;
  onNone: () => void;
  count: number;
  onCount: (n: number) => void;
  available: number;
  onStart: () => void;
}) {
  const n = Math.min(Math.max(1, count), Math.max(1, available));
  const canStart = selected.size > 0 && available > 0;

  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Choose your topics
        </h2>
        <p className="mt-2 text-base leading-relaxed text-muted">
          Twenty sets of 25 Boom Cards for kids 5 to 16. Tick the topics you
          want, pick how many cards to play, then start. Cards are chosen at
          random from your selection.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAll}
          className="h-10 rounded-xl border border-border bg-surface px-4 text-sm font-semibold"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={onNone}
          className="h-10 rounded-xl border border-border bg-surface px-4 text-sm font-semibold"
        >
          Clear
        </button>
        <p className="flex items-center text-sm text-muted">
          {selected.size} topics · {available} cards ready
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const on = selected.has(cat.id);
          return (
            <li key={cat.id}>
              <button
                type="button"
                onClick={() => onToggle(cat.id)}
                aria-pressed={on}
                className={cn(
                  "group flex w-full flex-col overflow-hidden rounded-[20px] border text-left transition-colors duration-150",
                  on ? "border-primary bg-surface" : "border-border bg-surface/70",
                )}
              >
                <span className="relative block h-28 overflow-hidden sm:h-32">
                  <img src={mediaUrl(cat.image)} alt="" className="h-full w-full object-cover" />
                  <span
                    className={cn(
                      "absolute right-2 top-2 flex size-7 items-center justify-center rounded-full border",
                      on
                        ? "border-primary bg-primary text-primary-fg"
                        : "border-border bg-surface text-transparent",
                    )}
                  >
                    <Check className="size-4" />
                  </span>
                </span>
                <span className="space-y-0.5 p-3">
                  <span className="block font-semibold leading-tight">{cat.name}</span>
                  <span className="block text-xs text-muted">{cat.blurb}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm font-medium">
            Number of cards
            <input
              type="number"
              min={1}
              max={Math.max(1, available)}
              value={count}
              onChange={(e) => onCount(Number(e.target.value) || 1)}
              className="h-11 w-20 rounded-xl border border-border bg-surface px-3 text-base tabular-nums"
              suppressHydrationWarning
            />
            <span className="font-normal text-muted">default 10 · max {available || 0}</span>
          </label>
          <button
            type="button"
            disabled={!canStart}
            onClick={onStart}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-semibold text-primary-fg disabled:opacity-40"
          >
            Start {canStart ? n : 0} cards
          </button>
        </div>
      </div>
    </section>
  );
}

function WordPhoto({ src, word }: { src: string; word: string }) {
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const ready = readySrc === src;

  useEffect(() => {
    let alive = true;
    const img = new Image();
    const markReady = () => {
      if (alive) setReadySrc(src);
    };
    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().then(markReady).catch(markReady);
      } else {
        markReady();
      }
    };
    img.onerror = markReady;
    img.src = src;
    if (img.complete && img.naturalWidth > 0) markReady();
    return () => {
      alive = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#ebe4d8]">
      {ready ? (
        <img
          src={src}
          alt={word}
          data-word={word}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-[#e3d9cc]" aria-hidden />
      )}
    </div>
  );
}

function PlayCard({
  card,
  index,
  total,
  picked,
  choices,
  onChoose,
  onNext,
  isLast,
}: {
  card: BoomCard;
  index: number;
  total: number;
  picked: string | null;
  choices: string[];
  onChoose: (choice: string) => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const locked = picked !== null;
  const isCorrect = picked === card.word;
  const pct = Math.round(((index + (picked ? 1 : 0)) / total) * 100);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5">
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>

      <div className="overflow-hidden rounded-[28px] border border-border bg-surface">
        <WordPhoto src={mediaUrl(card.image)} word={card.word} />
        <div className="space-y-5 p-5 sm:p-7">
          <p className="font-display text-2xl leading-snug tracking-tight sm:text-3xl">
            {card.before}{" "}
            <span
              className={cn(
                "inline-block min-w-24 border-b-2 px-1 text-center",
                !picked && "border-primary text-primary",
                picked && isCorrect && "border-good text-good",
                picked && !isCorrect && "border-bad text-bad",
              )}
            >
              {picked ?? "\u00a0"}
            </span>
            {card.after.startsWith(" ") || card.after.startsWith(".") ? "" : " "}
            {card.after}
          </p>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {choices.map((choice) => {
              const selected = picked === choice;
              const right = choice === card.word;
              return (
                <button
                  key={choice}
                  type="button"
                  disabled={locked}
                  onClick={() => onChoose(choice)}
                  className={cn(
                    "flex min-h-12 items-center justify-center rounded-xl border px-4 text-base font-semibold capitalize transition-colors duration-150",
                    !locked && "border-border bg-bg hover:border-primary hover:bg-surface",
                    locked && selected && right && "border-good bg-good-bg text-good",
                    locked && selected && !right && "border-bad bg-bad-bg text-bad",
                    locked && !selected && right && "border-good bg-good-bg text-good",
                    locked && !selected && !right && "border-border bg-bg text-muted",
                  )}
                >
                  {choice}
                </button>
              );
            })}
          </div>

          {picked ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p
                className={cn(
                  "inline-flex flex-wrap items-center gap-2 text-sm font-medium",
                  isCorrect ? "text-good" : "text-bad",
                )}
              >
                {isCorrect ? <Check className="size-4" /> : <X className="size-4" />}
                {isCorrect ? "Correct." : `The word is “${card.word}”.`}
                <span className="font-normal text-muted">{card.hint}</span>
              </p>
              <button
                type="button"
                onClick={onNext}
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-primary px-6 text-base font-semibold text-primary-fg active:scale-[0.98]"
              >
                {isLast ? "See summary" : "Next card"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted">Choose the missing word.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Summary({
  correctCount,
  total,
  missed,
  onAgain,
  onHome,
  onRetryMissed,
}: {
  correctCount: number;
  total: number;
  missed: BoomCard[];
  onAgain: () => void;
  onHome: () => void;
  onRetryMissed: () => void;
}) {
  const percent = Math.round((correctCount / total) * 100);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6">
      <div className="rounded-[28px] border border-border bg-surface p-6 sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Summary</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          {correctCount} / {total} correct
        </h2>
        <p className="mt-2 text-muted">
          {percent}% — {headline(correctCount, total)}
        </p>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-bg">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>

        {missed.length > 0 ? (
          <div className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
              Words to review
            </h3>
            <ul className="mt-3 space-y-2">
              {missed.map((card) => (
                <li
                  key={card.id}
                  className="flex flex-col gap-1 rounded-xl border border-border bg-bg px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-semibold capitalize">{card.word}</span>
                  <span className="text-sm text-muted">
                    {card.before} {card.word}
                    {card.after}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-8 font-medium text-good">Every word is solid. Beautiful work.</p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onAgain}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-fg"
          >
            <RotateCcw className="size-4" />
            Play again
          </button>
          {missed.length > 0 ? (
            <button
              type="button"
              onClick={onRetryMissed}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-border bg-bg px-5 font-semibold"
            >
              Review missed words
            </button>
          ) : null}
          <button
            type="button"
            onClick={onHome}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-border bg-bg px-5 font-semibold"
          >
            Change topics
          </button>
        </div>
      </div>
    </section>
  );
}

function headline(correct: number, total: number) {
  const ratio = correct / total;
  if (ratio === 1) return "Perfect set.";
  if (ratio >= 0.8) return "Strong work.";
  if (ratio >= 0.5) return "Good start — review the missed words.";
  return "Let’s practise the missed words together.";
}
