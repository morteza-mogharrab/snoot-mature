import { useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useMaybeDb, useUI } from './store/AppStore';
import { useIsMobile } from './hooks';
import { BottomNav, MobileHeader, Sidebar, TopBar } from './components/layout/Nav';
import { Confetti, Toasts } from './components/ui/Kit';
import { LogoMark, Wordmark } from './components/ui/Brand';
import { PostModal, ShareSheet } from './components/post/PostModal';
import { StoryViewer } from './components/stories/Stories';
import { Composer } from './components/create/Composer';
import { PetChat } from './components/profile/PetChat';
import { HomePage } from './pages/HomePage';
import { ClipsPage } from './pages/ClipsPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { MapPage } from './pages/MapPage';
import { WalksPage } from './pages/WalksPage';
import { EventDetailPage, EventsPage } from './pages/EventsPage';
import { PackDetailPage, PacksPage } from './pages/PacksPage';
import { MessagesPage } from './pages/MessagesPage';
import { RewardsPage } from './pages/RewardsPage';
import { AdoptPage, ContestsPage, LostPage } from './pages/CommunityPages';
import { PetProfilePage } from './pages/PetProfilePage';
import { MePage, NotificationsPage, PostPage } from './pages/MePage';

function Splash() {
  return (
    <div className="splash" aria-label="Loading Snoot">
      <div className="splash-inner"><LogoMark size={76} /><Wordmark size={40} /><span className="faint small">Where every pet is the main character</span></div>
    </div>
  );
}

function RouteEffects() {
  const { pathname } = useLocation();
  const { closePost, setMenuOpen } = useUI();
  useEffect(() => { window.scrollTo(0, 0); closePost(); setMenuOpen(false); }, [pathname, closePost, setMenuOpen]);
  return null;
}

function Shell() {
  const db = useMaybeDb();
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const { storyViewer, composer, chatPetId } = useUI();
  if (!db) return <Splash />;
  const immersive = pathname.startsWith('/clips') || pathname.startsWith('/map') || pathname.startsWith('/messages');
  return (
    <div className={`app ${immersive ? 'immersive' : ''}`}>
      <RouteEffects />
      {!isMobile && <Sidebar />}
      <div className="main-col">
        {isMobile ? !pathname.startsWith('/clips') && <MobileHeader /> : !immersive && <TopBar />}
        <main className="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/clips" element={<ClipsPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/walks" element={<WalksPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/packs" element={<PacksPage />} />
            <Route path="/packs/:id" element={<PackDetailPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:id" element={<MessagesPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/contests" element={<ContestsPage />} />
            <Route path="/adopt" element={<AdoptPage />} />
            <Route path="/lost" element={<LostPage />} />
            <Route path="/pet/:handle" element={<PetProfilePage />} />
            <Route path="/post/:id" element={<PostPage />} />
            <Route path="/me" element={<MePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
      </div>
      {isMobile && !pathname.match(/^\/messages\/.+/) && <BottomNav />}
      <PostModal />
      <ShareSheet />
      {composer && <Composer key={JSON.stringify(composer)} />}
      {storyViewer && <StoryViewer key={storyViewer.storyIds.join() + storyViewer.startIndex} />}
      {chatPetId && <PetChat />}
      <Toasts />
      <Confetti />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter><Shell /></HashRouter>
    </AppProvider>
  );
}
