import Navbar from "@/components/home/Navbar";
import FeaturedGame from "@/components/home/FeaturedGame";
import GameSection from "@/components/home/GameSection";
import JackpotBanner from "@/components/JackpotBanner";
import BottomNav from "@/components/home/BottomNav";
import PageWrapper from "@/components/PageWrapper";

// ── Data ──────────────────────────────────────────────────────────────────────

const EVOPLAY_GAMES = [
  { id: "egypt-gods", title: "Egypt Gods", provider: "Evoplay", rtp: 96, bannerUrl: "/games-banner/aviator.jpg", gameLink:"/aviator" },
  { id: "penalty", title: "Penalty Shoot-out: Street", provider: "Evoplay", rtp: 97, bannerUrl:"/games-banner/color-cover.jpg", gameLink:"color-game" },
  { id: "magic-wheel", title: "Magic Wheel", provider: "Evoplay", rtp: 95, bannerUrl:"/games-banner/HeadsTails_270x270.jpg", gameLink:"/heads-tails" },
  // { id: "scratch", title: "Scratch Match", provider: "Evoplay", rtp: 96 },
  // { id: "bingo-task", title: "Bingo Task", provider: "Evoplay", rtp: 95 },
];

const POPULAR_GAMES = [
  { id: "aviator", title: "Aviator", provider: "Spribe", rtp: 97, badge: "hot" },
  { id: "jetx", title: "JetX", provider: "SmartSoft", rtp: 97, badge: "hot" },
  { id: "chicken", title: "Chicken Road", provider: "InOut", rtp: 96, badge: "hot" },
  { id: "plinko", title: "Plinko", provider: "Spribe", rtp: 97, badge: "hot" },
  { id: "mines", title: "Mines", provider: "Spribe", rtp: 97, badge: "hot" },
];

const NEW_GAMES = [
  { id: "starburst", title: "Starburst XXXtreme", provider: "NetEnt", rtp: 96.3 },
  { id: "gates", title: "Gates of Olympus", provider: "Pragmatic", rtp: 96.5 },
  { id: "sweet", title: "Sweet Bonanza", provider: "Pragmatic", rtp: 96.5 },
  { id: "wolf", title: "Wolf Gold", provider: "Pragmatic", rtp: 96 },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CasinoHomePage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* Top navigation bar */}
      <Navbar />

      {/* Scrollable content — pb ensures content isn't hidden behind bottom nav */}
      <PageWrapper>
        {/* Featured / hero game */}
        <FeaturedGame
          title="Heads & Tails"
          provider="Evoplay"
          rtp={96}
          imageUrl=""
          category="Casino"
        />

        {/* More from Evoplay */}
        <GameSection
          title="More from Evoplay"
          games={EVOPLAY_GAMES}
          cardSize="sm"
        />

        {/* Popular Games */}
        {/* <GameSection
          title="Popular Games"
          games={POPULAR_GAMES}
          cardSize="md"
        /> */}

        {/* New Games */}
        {/* <GameSection
          title="New Releases"
          games={NEW_GAMES}
          showSeeAll
          cardSize="sm"
        /> */}

        {/* Live Casino section */}
        {/* <GameSection
          title="Live Casino"
          games={[
            { id: "baccarat", title: "Speed Baccarat", provider: "Evolution", rtp: 98.9 },
            { id: "roulette", title: "Immersive Roulette", provider: "Evolution", rtp: 97.3 },
            { id: "blackjack", title: "Blackjack VIP", provider: "Evolution", rtp: 99.5 },
            { id: "poker", title: "Casino Hold'em", provider: "Evolution", rtp: 97.8 },
          ]}
          showSeeAll
          cardSize="sm"
        /> */}

        {/* Jackpot counter */}
        <JackpotBanner />
      </PageWrapper>

      {/* Fixed bottom tab bar */}
      <BottomNav />
    </div>
  );
}
