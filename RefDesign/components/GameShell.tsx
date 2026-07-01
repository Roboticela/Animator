import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { GAMES, CATEGORY_LABELS, DIFFICULTY_COLORS } from '@/lib/games';
import { cn } from '@/lib/utils';
import AppHeader from '@/components/AppHeader';

interface GameShellProps {
  slug: string;
  children: ReactNode;
}

export default function GameShell({ slug, children }: GameShellProps) {
  const navigate = useNavigate();
  const game = GAMES.find((g) => g.slug === slug);

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Gamepad2 className="w-16 h-16 mx-auto text-border" />
            <h2 className="text-2xl font-bold text-foreground">Game not found</h2>
            <button
              onClick={() => navigate('/games')}
              className="px-4 py-2 rounded-xl border border-border hover:bg-accent transition-colors text-foreground"
            >
              Back to Games
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Icon = game.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 gap-4">
        {/* Breadcrumb / back nav */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <motion.button
            onClick={() => navigate('/games')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card/60 hover:bg-accent hover:border-primary/40 transition-all duration-200 text-sm text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Games</span>
          </motion.button>
          <span className="text-border">/</span>
          <span className="text-foreground/60 text-sm truncate">{game.title}</span>
        </motion.div>

        {/* Game header */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="flex items-start gap-4 p-4 rounded-2xl border border-border bg-card/40"
        >
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex-shrink-0">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{game.title}</h1>
              <span
                className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  DIFFICULTY_COLORS[game.difficulty]
                )}
              >
                {game.difficulty}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full text-primary/80 bg-primary/10">
                {CATEGORY_LABELS[game.category]}
              </span>
            </div>
            <p className="text-foreground/60 text-sm mt-1">{game.description}</p>
          </div>
        </motion.div>

        {/* Game content */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex-1"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
