import { lazy, Suspense } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { GAMES } from '@/lib/games';
import GameShell from '@/components/GameShell';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, SITE_NAME } from '@/lib/seo';

const gameComponents: Record<string, ReturnType<typeof lazy>> = {
  'typing-speed-test': lazy(() => import('@/games/TypingSpeedTest')),
  'word-sprint': lazy(() => import('@/games/WordSprint')),
  'typing-accuracy': lazy(() => import('@/games/TypingAccuracy')),
  'home-row-hero': lazy(() => import('@/games/HomeRowHero')),
  'paragraph-marathon': lazy(() => import('@/games/ParagraphMarathon')),
  'typing-race': lazy(() => import('@/games/TypingRace')),
  'typing-stars': lazy(() => import('@/games/TypingStars')),
  'key-memory': lazy(() => import('@/games/KeyMemory')),
  'symbol-smash': lazy(() => import('@/games/SymbolSmash')),
  'keyboard-quiz': lazy(() => import('@/games/KeyboardQuiz')),
  'shortcut-master': lazy(() => import('@/games/ShortcutMaster')),
  'layout-quiz': lazy(() => import('@/games/LayoutQuiz')),
  'function-key-finder': lazy(() => import('@/games/FunctionKeyFinder')),
  'modifier-mash': lazy(() => import('@/games/ModifierMash')),
  'key-reaction-time': lazy(() => import('@/games/KeyReactionTime')),
  'key-location-trainer': lazy(() => import('@/games/KeyLocationTrainer')),
  'n-key-rollover': lazy(() => import('@/games/NKeyRollover')),
  'number-pad-speed': lazy(() => import('@/games/NumberPadSpeed')),
  'shift-challenge': lazy(() => import('@/games/ShiftChallenge')),
  'backspace-blitz': lazy(() => import('@/games/BackspaceBlitz')),
};

function GameLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

export default function GamePage() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return <Navigate to="/games" replace />;

  const game = GAMES.find((g) => g.slug === slug);
  if (!game) return <Navigate to="/games" replace />;

  const GameComponent = gameComponents[slug];
  if (!GameComponent) return <Navigate to="/games" replace />;

  return (
    <>
      <Helmet
        prioritizeSeoTags
        title={`${game.title} — ${SITE_NAME}`}
      >
        <meta name="description" content={game.description} />
        <link rel="canonical" href={`${SITE_URL}/games/${slug}`} />
      </Helmet>
      <GameShell slug={slug}>
        <Suspense fallback={<GameLoadingFallback />}>
          <GameComponent />
        </Suspense>
      </GameShell>
    </>
  );
}
