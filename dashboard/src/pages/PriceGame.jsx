import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, ArrowRight, RotateCcw, Flame, Tag, Delete, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryBadge } from "@/components/ui/category-badge";
import { StatTile } from "@/components/ui/stat-tile";
import { fmt, fmtDate } from "@/lib/fmt";
import { productImg } from "@/lib/productImg";

const ROUNDS = 10;

function fisherYatesShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getScore(guess, actual) {
  const pctOff = actual === 0 ? 100 : Math.abs((guess - actual) / actual) * 100;
  // 0% off → 100 pts, 50% off → 0 pts (linear), beyond 50% → 0
  const points = pctOff >= 50 ? 0 : Math.round((1 - pctOff / 50) * 100);
  let label;
  if (pctOff <= 5) label = "Перфектно!";
  else if (pctOff <= 15) label = "Почти!";
  else if (pctOff <= 30) label = "Добре";
  else if (pctOff < 50) label = "Горе-долу";
  else label = "Далеч...";
  return { points, pctOff, label };
}

const LEADERBOARD_KEY = "vibebag-price-game-leaderboard";

function loadLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
  } catch {
    return [];
  }
}

function saveToLeaderboard(score) {
  const board = loadLeaderboard();
  board.push({ score, date: new Date().toISOString() });
  board.sort((a, b) => b.score - a.score);
  const top5 = board.slice(0, 5);
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(top5));
  } catch {
    /* noop */
  }
  return top5;
}

function scoreColor(points) {
  if (points >= 90) return "var(--brand)";
  if (points >= 70) return "#22c55e";
  if (points >= 40) return "#eab308";
  if (points > 0) return "#f97316";
  return "#ef4444";
}

const RATINGS = [
  {
    min: 1000,
    max: 1000,
    emoji: "⭐",
    titles: [
      "Едно с касовия апарат",
      "Ценови пророк",
      "Скенерът ти завижда",
      "Реалитест: ПЕРФЕКТЕН",
    ],
  },
  {
    min: 901,
    max: 999,
    emoji: "👑",
    titles: [
      "Абсолютен касов бог",
      "Господар на цените",
      "Етикетен оракул",
      "€ Легенда",
      "Кралят на магазина",
    ],
  },
  {
    min: 801,
    max: 900,
    emoji: "🔥",
    titles: [
      "Ценови нинджа",
      "Майстор на етикета",
      "Касов шампион",
      "Пазарен аналитик",
      "Евро гуру",
    ],
  },
  {
    min: 651,
    max: 800,
    emoji: "😎",
    titles: ["Ценорадар", "Касов стратег", "Етикетен експерт", "Пазарен хищник", "Евроусет Pro"],
  },
  {
    min: 501,
    max: 650,
    emoji: "🙂",
    titles: ["Имаш нюх", "В час с цените", "Пазаруваш редовно", "Ценови играч", "Евроусет v1"],
  },
  {
    min: 351,
    max: 500,
    emoji: "🤔",
    titles: [
      "Ставаш за пазар",
      "Средна класа купувач",
      "Ок, не си зле",
      "Понякога уцелваш",
      "Касов оптимист",
    ],
  },
  {
    min: 201,
    max: 350,
    emoji: "😅",
    titles: [
      "Аматьор на касата",
      "Леко заблуден",
      "Пазарен новак",
      "Гадаеш на късмет",
      "Почти позна",
    ],
  },
  {
    min: 101,
    max: 200,
    emoji: "🥴",
    titles: [
      "Случаен клиент",
      "Пазаруваш по спомен",
      "Ценови турист",
      "Виждал си етикет… някога",
      "Евро? Какво беше това?",
    ],
  },
  {
    min: 0,
    max: 100,
    emoji: "💀",
    titles: [
      "Изгубен в магазина",
      "Никога не си пазарувал",
      "Цените са мит",
      "Живееш в 2015-та",
      "Богаташ без касова бележка",
    ],
  },
];

function getRating(total) {
  const tier = RATINGS.find((r) => total >= r.min && total <= r.max) || RATINGS[RATINGS.length - 1];
  const title = tier.titles[Math.floor(Math.random() * tier.titles.length)];
  return { emoji: tier.emoji, title };
}

function buildRounds(productList) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const cutoff = sixMonthsAgo.toISOString().slice(0, 10);

  // Collect product + entry pairs where the purchase is within the last 6 months
  const candidates = [];
  for (const product of productList) {
    if (!product.priceHistory || product.priceHistory.length === 0) continue;
    const recentEntries = product.priceHistory.filter((e) => e.date >= cutoff);
    for (const entry of recentEntries) {
      candidates.push({ product, entry });
    }
  }

  const shuffled = fisherYatesShuffle([...candidates]);
  // Deduplicate by product — keep first occurrence (random due to shuffle)
  const seen = new Set();
  const unique = shuffled.filter(({ product }) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });

  return unique.slice(0, Math.min(ROUNDS, unique.length));
}

export default function PriceGame({ productList }) {
  const [rounds, setRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [phase, setPhase] = useState("intro"); // intro | guessing | revealed | finished
  const [results, setResults] = useState([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState(loadLeaderboard);
  const [rating, setRating] = useState(null);
  const inputRef = useRef(null);

  const highScore = leaderboard.length > 0 ? leaderboard[0].score : 0;

  // Pick 9 random product IDs for the intro hero grid
  const heroProducts = useMemo(() => {
    const shuffled = fisherYatesShuffle([...productList].filter((p) => p.id));
    return shuffled.slice(0, 9);
  }, [productList]);

  const current = rounds.length > 0 ? rounds[roundIndex] : null;
  const totalRounds = rounds.length;
  const maxPossible = totalRounds * 100;

  function handleStart() {
    const built = buildRounds(productList);
    if (built.length === 0) return;
    setRounds(built);
    setRoundIndex(0);
    setGuess("");
    setResults([]);
    setStreak(0);
    setBestStreak(0);
    setRating(null);
    setPhase("guessing");
  }

  function handleGuess() {
    const parsed = parseFloat(guess);
    if (isNaN(parsed) || parsed < 0) return;

    const actual = current.entry.unitPrice;
    const { points, pctOff, label } = getScore(parsed, actual);
    const newStreak = pctOff <= 10 ? streak + 1 : 0;
    const newBest = Math.max(bestStreak, newStreak);

    setResults([
      ...results,
      {
        product: current.product,
        date: current.entry.date,
        actual,
        guess: parsed,
        pctOff,
        points,
        label,
        wasPromo: current.entry.wasPromo,
      },
    ]);
    setStreak(newStreak);
    setBestStreak(newBest);
    setPhase("revealed");
  }

  function handleNext() {
    if (roundIndex + 1 >= totalRounds) {
      const finalScore = results.reduce((s, r) => s + r.points, 0);
      const newBoard = saveToLeaderboard(finalScore);
      setLeaderboard(newBoard);
      setRating(getRating(finalScore));
      setPhase("finished");
    } else {
      setRoundIndex(roundIndex + 1);
      setGuess("");
      setPhase("guessing");
    }
  }

  useEffect(() => {
    if (phase === "guessing" && inputRef.current) {
      inputRef.current.focus();
    }
    if (phase === "revealed") {
      // Delay adding the listener so the Enter keypress that triggered
      // the reveal doesn't immediately fire handleNext
      const timer = setTimeout(() => {
        const onKey = (e) => {
          if (e.key === "Enter") handleNext();
        };
        window.addEventListener("keydown", onKey);
        cleanup = () => window.removeEventListener("keydown", onKey);
      }, 50);
      let cleanup;
      return () => {
        clearTimeout(timer);
        cleanup?.();
      };
    }
  }, [roundIndex, phase]);

  if (productList.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <Crosshair size={48} className="mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Нямате достатъчно поръчки за играта.</p>
      </div>
    );
  }

  const totalScore = results.reduce((sum, r) => sum + r.points, 0);

  // --- Intro screen ---
  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            {/* Product image grid */}
            <div className="mx-auto mb-6 grid w-fit grid-cols-3 gap-2">
              {heroProducts.map((p) => (
                <div
                  key={p.id}
                  className="size-20 overflow-hidden rounded-xl border bg-white p-2"
                >
                  <img
                    src={productImg(p.id)}
                    alt=""
                    className="size-full object-contain"
                  />
                </div>
              ))}
            </div>

            <h1 className="text-3xl font-bold tracking-tight">Реалитест</h1>
            <p className="mt-2 text-muted-foreground">
              Познай цената на {ROUNDS} продукта от последните ти поръчки.
            </p>
            <p className="mt-1 text-muted-foreground">
              Колкото по-близо до реалната цена, толкова повече точки — до 100 на въпрос.
            </p>

            <div className="mt-8">
              <Button
                size="lg"
                onClick={handleStart}
                style={{ backgroundColor: "var(--brand)" }}
                className="gap-2 px-8 py-6 text-lg text-white hover:opacity-90"
              >
                <Crosshair size={20} />
                Започни играта
              </Button>
            </div>

            {leaderboard.length > 0 && (
              <div className="mt-8">
                <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Топ резултати
                </p>
                <div className="mx-auto max-w-xs">
                  {leaderboard.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b py-2 last:border-0 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center font-semibold text-muted-foreground">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                        </span>
                        <span className="tabular-nums font-medium">{entry.score} точки</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {fmtDate(entry.date.slice(0, 10))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Finished screen ---
  if (phase === "finished") {
    const avgOff =
      results.length > 0 ? results.reduce((s, r) => s + r.pctOff, 0) / results.length : 0;

    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Резултат
          </p>
          <p className="mt-2 text-5xl font-bold tracking-tight" style={{ color: "var(--brand)" }}>
            {totalScore} / {maxPossible}
          </p>
          <p className="mt-2 text-3xl">{rating.emoji}</p>
          <p className="mt-1 text-lg font-medium text-muted-foreground">{rating.title}</p>
          {leaderboard.length > 0 && totalScore >= leaderboard[0].score && (
            <p className="mt-1 text-sm font-semibold text-orange-500">Нов рекорд!</p>
          )}
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            variant="sheet"
            label="Точки"
            value={totalScore}
            color="var(--brand)"
            icon={Crosshair}
          />
          <StatTile
            variant="sheet"
            label="Рекорд"
            value={highScore}
            color="#f97316"
            icon={Trophy}
          />
          <StatTile
            variant="sheet"
            label="Най-добър стрийк"
            value={bestStreak}
            color="#8b5cf6"
            icon={Flame}
          />
          <StatTile
            variant="sheet"
            label="Средно отклонение"
            value={`${avgOff.toFixed(1)}%`}
            color="#6b7280"
            icon={Tag}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3">Продукт</th>
                  <th className="px-4 py-3 text-right">Твоят отговор</th>
                  <th className="px-4 py-3 text-right">Реална цена</th>
                  <th className="px-4 py-3 text-right">Точки</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        {productImg(r.product.id) && (
                          <img
                            src={productImg(r.product.id)}
                            alt=""
                            className="size-9 rounded object-contain bg-white shrink-0"
                          />
                        )}
                        <div>
                          <div className="font-medium">{r.product.name}</div>
                          <div className="text-xs text-muted-foreground">{fmtDate(r.date)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmt(r.guess)} &euro;</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmt(r.actual)} &euro;</td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className="inline-block min-w-[2.5rem] rounded-full px-2 py-0.5 text-center text-xs font-semibold text-white"
                        style={{ backgroundColor: scoreColor(r.points) }}
                      >
                        {r.points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button onClick={handleStart} className="gap-2">
            <RotateCcw size={16} />
            Играй пак
          </Button>
        </div>
      </div>
    );
  }

  // --- Guessing / Revealed screen ---
  const lastResult = phase === "revealed" ? results[results.length - 1] : null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Progress */}
      <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Въпрос {roundIndex + 1} от {totalRounds}
        </span>
        <div className="flex items-center gap-4">
          {streak > 1 && (
            <span className="flex items-center gap-1 text-orange-500">
              <Flame size={14} />
              {streak}
            </span>
          )}
          <span>{totalScore} точки</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${((roundIndex + (phase === "revealed" ? 1 : 0)) / totalRounds) * 100}%`,
            backgroundColor: "var(--brand)",
          }}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Product info */}
          <div className="mb-6 flex items-start gap-5">
            {productImg(current.product.id) && (
              <img
                src={productImg(current.product.id)}
                alt=""
                className="size-24 rounded-xl object-contain bg-white shrink-0"
              />
            )}
            <div>
              <CategoryBadge category={current.product.category} />
              <h2 className="mt-3 text-2xl font-bold tracking-tight">{current.product.name}</h2>
              {current.product.brand && (
                <p className="mt-1 text-sm text-muted-foreground">{current.product.brand}</p>
              )}
              <p className="mt-3 inline-block rounded-md bg-muted px-3 py-1.5 text-sm">
                Купено на <span className="font-medium">{fmtDate(current.entry.date)}</span>
              </p>
            </div>
          </div>

          {phase === "guessing" && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Каква беше цената? (за бройка/кг)
                </label>
                <div className="flex gap-3">
                  <Input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={guess}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || /^\d*\.?\d*$/.test(v)) setGuess(v);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                    className="text-lg tabular-nums"
                  />
                  <Button
                    onClick={handleGuess}
                    disabled={!guess || parseFloat(guess) < 0}
                    style={{ backgroundColor: "var(--brand)" }}
                    className="shrink-0 text-white hover:opacity-90"
                  >
                    Познай!
                  </Button>
                </div>
              </div>
              {/* Numpad */}
              <div className="grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setGuess((prev) => prev + key)}
                    className="h-12 rounded-lg border bg-card text-lg font-medium transition-colors hover:bg-muted active:bg-muted/70"
                  >
                    {key}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setGuess((prev) => prev + ".")}
                  className="h-12 rounded-lg border bg-card text-lg font-medium transition-colors hover:bg-muted active:bg-muted/70"
                >
                  .
                </button>
                <button
                  type="button"
                  onClick={() => setGuess((prev) => prev + "0")}
                  className="h-12 rounded-lg border bg-card text-lg font-medium transition-colors hover:bg-muted active:bg-muted/70"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setGuess((prev) => prev.slice(0, -1))}
                  className="flex h-12 items-center justify-center rounded-lg border bg-card transition-colors hover:bg-muted active:bg-muted/70"
                >
                  <Delete size={18} />
                </button>
              </div>
            </div>
          )}

          {phase === "revealed" && lastResult && (
            <div className="space-y-5">
              {/* Score label */}
              <div
                className="rounded-lg px-4 py-3 text-center"
                style={{ backgroundColor: scoreColor(lastResult.points) + "18" }}
              >
                <p className="text-2xl font-bold" style={{ color: scoreColor(lastResult.points) }}>
                  {lastResult.label}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  +{lastResult.points} точки &middot; {lastResult.pctOff.toFixed(1)}% отклонение
                </p>
              </div>

              {/* Guess vs actual */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border bg-muted/50 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Твоят отговор
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {fmt(lastResult.guess)} &euro;
                  </p>
                </div>
                <div
                  className="rounded-lg border p-4 text-center"
                  style={{ borderColor: "var(--brand)" }}
                >
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Реална цена
                  </p>
                  <p
                    className="mt-1 text-2xl font-semibold tabular-nums"
                    style={{ color: "var(--brand)" }}
                  >
                    {fmt(lastResult.actual)} &euro;
                  </p>
                </div>
              </div>

              {lastResult.wasPromo && (
                <p className="text-center text-sm text-muted-foreground">
                  Продуктът беше на промоция
                </p>
              )}

              <div className="text-center">
                <Button onClick={handleNext} className="gap-2">
                  {roundIndex + 1 >= totalRounds ? "Виж резултата" : "Следващ"}
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
