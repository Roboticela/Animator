import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Search } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { GAMES, CATEGORY_LABELS, DIFFICULTY_COLORS, type GameEntry } from '@/lib/games';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

const CATEGORIES = ['all', 'typing', 'quiz', 'reaction', 'challenge'] as const;
type FilterCategory = (typeof CATEGORIES)[number];

export default function GamesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');

  const filtered = GAMES.filter((g) => {
    const matchCategory = activeCategory === 'all' || g.category === activeCategory;
    const matchSearch =
      !search ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet
        prioritizeSeoTags
        title={`Keyboard Games — ${SITE_NAME}`}
      >
        <meta
          name="description"
          content="Play 20 keyboard games including typing speed test, word sprint, key memory, and more. Improve your typing skills with fun challenges."
        />
        <link rel="canonical" href={`${SITE_URL}/games`} />
      </Helmet>

      <AppHeader />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <Gamepad2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Keyboard Games</h1>
          <p className="text-foreground/60 max-w-lg mx-auto">
            20 focused games to test and sharpen your keyboard skills — from typing speed to key
            memory.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              placeholder="Search games…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all text-sm"
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 border',
                  activeCategory === cat
                    ? 'bg-primary text-background border-primary'
                    : 'border-border bg-card text-foreground/70 hover:bg-accent hover:text-foreground'
                )}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="text-foreground/40 text-sm"
        >
          {filtered.length} game{filtered.length !== 1 ? 's' : ''}
        </motion.p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-3"
          >
            <Gamepad2 className="w-12 h-12 text-border" />
            <p className="text-foreground/50">No games match your search.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((game, i) => (
              <GameCard key={game.slug} game={game} index={i} onPlay={() => navigate(`/games/${game.slug}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GameCard({
  game,
  index,
  onPlay,
}: {
  game: GameEntry;
  index: number;
  onPlay: () => void;
}) {
  const Icon = game.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      whileHover={{ y: -2 }}
      onClick={onPlay}
      className="group relative flex flex-col gap-3 p-4 rounded-2xl border border-border bg-card cursor-pointer hover:border-primary/40 hover:bg-card/80 transition-all duration-200"
    >
      {/* Icon */}
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/10 group-hover:bg-primary/15 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            DIFFICULTY_COLORS[game.difficulty]
          )}
        >
          {game.difficulty}
        </span>
      </div>

      {/* Text */}
      <div className="flex-1">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm leading-tight">
          {game.title}
        </h3>
        <p className="text-foreground/50 text-xs mt-1 leading-relaxed line-clamp-2">
          {game.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <span className="text-xs text-foreground/40 font-medium">
          {CATEGORY_LABELS[game.category]}
        </span>
        <span className="text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
          Play →
        </span>
      </div>
    </motion.div>
  );
}
