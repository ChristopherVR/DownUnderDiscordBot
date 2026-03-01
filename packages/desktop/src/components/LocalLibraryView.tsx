import { useState, useMemo, useEffect, useRef } from 'react';
import { useBotStore, type Track, type PlaybackMode } from '@/stores/useBotStore';
import { formatTime } from '@/lib/utils';
import {
  Music,
  User,
  Disc3,
  FolderOpen,
  Play,
  Pause,
  Plus,
  Search,
  ChevronLeft,
  FileAudio,
  FileVideo,
  LayoutGrid,
  LayoutList,
  ArrowUpDown,
  Hash,
  Clock,
  Shuffle,
} from 'lucide-react';

// ─── Types ───

type LibraryCategory = 'all' | 'artists' | 'albums' | 'folders';
type SortField = 'title' | 'artist' | 'album' | 'duration';
type SortDir = 'asc' | 'desc';
type LayoutMode = 'grid' | 'list';

interface DrillDown {
  type: 'artist' | 'album' | 'folder';
  value: string;
}

interface ArtistInfo {
  name: string;
  trackCount: number;
  albumCount: number;
  totalDuration: number;
  mediaTypes: Set<string>;
}

interface AlbumInfo {
  name: string;
  artist: string;
  trackCount: number;
  totalDuration: number;
  mediaTypes: Set<string>;
}

interface FolderInfo {
  path: string;
  name: string;
  trackCount: number;
  totalDuration: number;
}

// ─── Helpers ───

function groupByArtist(tracks: Track[]): ArtistInfo[] {
  const map = new Map<string, { tracks: Track[]; albums: Set<string> }>();
  for (const t of tracks) {
    const artist = t.artist || 'Unknown Artist';
    const existing = map.get(artist);
    if (existing) {
      existing.tracks.push(t);
      if (t.album) existing.albums.add(t.album);
    } else {
      map.set(artist, {
        tracks: [t],
        albums: new Set(t.album ? [t.album] : []),
      });
    }
  }
  return Array.from(map.entries())
    .map(([name, { tracks: trks, albums }]) => ({
      name,
      trackCount: trks.length,
      albumCount: albums.size,
      totalDuration: trks.reduce((s, t) => s + (t.duration ?? 0), 0),
      mediaTypes: new Set(trks.map((t) => t.mediaType ?? 'audio')),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function groupByAlbum(tracks: Track[]): AlbumInfo[] {
  const map = new Map<string, { tracks: Track[]; artists: Set<string> }>();
  for (const t of tracks) {
    const album = t.album || 'Unknown Album';
    const existing = map.get(album);
    if (existing) {
      existing.tracks.push(t);
      if (t.artist) existing.artists.add(t.artist);
    } else {
      map.set(album, {
        tracks: [t],
        artists: new Set(t.artist ? [t.artist] : []),
      });
    }
  }
  return Array.from(map.entries())
    .map(([name, { tracks: trks, artists }]) => ({
      name,
      artist: artists.size === 1 ? [...artists][0] : `${artists.size} artists`,
      trackCount: trks.length,
      totalDuration: trks.reduce((s, t) => s + (t.duration ?? 0), 0),
      mediaTypes: new Set(trks.map((t) => t.mediaType ?? 'audio')),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function groupByFolder(tracks: Track[]): FolderInfo[] {
  const map = new Map<string, Track[]>();
  for (const t of tracks) {
    if (!t.filePath) continue;
    // Extract parent folder
    const sep = t.filePath.includes('\\') ? '\\' : '/';
    const parts = t.filePath.split(sep);
    parts.pop(); // remove filename
    const folder = parts.join(sep);
    const existing = map.get(folder);
    if (existing) {
      existing.push(t);
    } else {
      map.set(folder, [t]);
    }
  }
  return Array.from(map.entries())
    .map(([path, trks]) => ({
      path,
      name: path.split(/[\\/]/).pop() || path,
      trackCount: trks.length,
      totalDuration: trks.reduce((s, t) => s + (t.duration ?? 0), 0),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function formatDurationLong(seconds: number): string {
  if (!seconds) return '';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs} hr ${mins} min`;
  return `${mins} min`;
}

function sortTracks(tracks: Track[], field: SortField, dir: SortDir): Track[] {
  return [...tracks].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'title':
        cmp = (a.title ?? '').localeCompare(b.title ?? '');
        break;
      case 'artist':
        cmp = (a.artist ?? '').localeCompare(b.artist ?? '');
        break;
      case 'album':
        cmp = (a.album ?? '').localeCompare(b.album ?? '');
        break;
      case 'duration':
        cmp = (a.duration ?? 0) - (b.duration ?? 0);
        break;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

// ─── Gradient palette for cards ───

const CARD_GRADIENTS = [
  'from-indigo-500/20 to-purple-600/10',
  'from-emerald-500/20 to-teal-600/10',
  'from-rose-500/20 to-pink-600/10',
  'from-amber-500/20 to-orange-600/10',
  'from-cyan-500/20 to-blue-600/10',
  'from-fuchsia-500/20 to-violet-600/10',
  'from-lime-500/20 to-green-600/10',
  'from-sky-500/20 to-indigo-600/10',
];

function hashGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CARD_GRADIENTS[Math.abs(hash) % CARD_GRADIENTS.length];
}

// ─── Main component ───

interface LocalLibraryViewProps {
  localFiles: Track[];
  playbackMode: PlaybackMode;
}

export default function LocalLibraryView({ localFiles, playbackMode }: LocalLibraryViewProps) {
  const play = useBotStore((s) => s.play);
  const pause = useBotStore((s) => s.pause);
  const resume = useBotStore((s) => s.resume);
  const addToQueue = useBotStore((s) => s.addToQueue);
  const playTrackLocally = useBotStore((s) => s.playTrackLocally);
  const addTrackToLocalQueue = useBotStore((s) => s.addTrackToLocalQueue);
  const player = useBotStore((s) => s.player);

  const [category, setCategory] = useState<LibraryCategory>('all');
  const [drillDown, setDrillDown] = useState<DrillDown | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [layout, setLayout] = useState<LayoutMode>('grid');

  // Live position tracking
  const [livePos, setLivePos] = useState(0);
  const posInterval = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => {
    if (player.isPlaying) {
      setLivePos(player.position);
      posInterval.current = setInterval(() => {
        setLivePos((p) => Math.min(p + 1, player.duration));
      }, 1000);
    } else {
      setLivePos(player.position);
    }
    return () => clearInterval(posInterval.current);
  }, [player.isPlaying, player.position, player.duration]);

  // Normalise paths so bot-broadcast paths (which may use / or file:// prefix)
  // match the native OS paths from the Tauri local file scan.
  const normPath = (p: string | undefined): string | undefined => {
    if (!p) return undefined;
    let n = p;
    if (n.startsWith('file://')) {
      try { n = decodeURIComponent(new URL(n).pathname); } catch { n = n.slice(7); }
    }
    if (/^\/[A-Za-z]:/.test(n)) n = n.slice(1);
    return n.replace(/\//g, '\\'); // normalise to back-slashes (Windows)
  };
  const currentFilePath = normPath(player.currentTrack?.filePath);
  const queueFilePaths = useMemo(
    () => new Set(player.queue.filter((t) => t.filePath).map((t) => normPath(t.filePath)!)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [player.queue],
  );

  // Reset drill-down when switching categories
  useEffect(() => {
    setDrillDown(null);
    setSearch('');
  }, [category]);

  // ─── Filtered files ───
  const searchLower = search.toLowerCase();
  const filteredFiles = useMemo(() => {
    let files = localFiles;
    if (search) {
      files = files.filter(
        (f) =>
          f.title.toLowerCase().includes(searchLower) ||
          (f.artist ?? '').toLowerCase().includes(searchLower) ||
          (f.album ?? '').toLowerCase().includes(searchLower) ||
          (f.fileName ?? '').toLowerCase().includes(searchLower),
      );
    }
    return files;
  }, [localFiles, searchLower]);

  // ─── Drill-down filtered tracks ───
  const drillTracks = useMemo(() => {
    if (!drillDown) return filteredFiles;
    switch (drillDown.type) {
      case 'artist':
        return filteredFiles.filter((f) => (f.artist || 'Unknown Artist') === drillDown.value);
      case 'album':
        return filteredFiles.filter((f) => (f.album || 'Unknown Album') === drillDown.value);
      case 'folder': {
        return filteredFiles.filter((f) => {
          if (!f.filePath) return false;
          const sep = f.filePath.includes('\\') ? '\\' : '/';
          const parts = f.filePath.split(sep);
          parts.pop();
          return parts.join(sep) === drillDown.value;
        });
      }
    }
  }, [filteredFiles, drillDown]);

  const sortedTracks = useMemo(
    () => sortTracks(drillDown ? drillTracks : filteredFiles, sortField, sortDir),
    [drillDown, drillTracks, filteredFiles, sortField, sortDir],
  );

  // ─── Grouped data for category views ───
  const artists = useMemo(() => groupByArtist(filteredFiles), [filteredFiles]);
  const albums = useMemo(() => groupByAlbum(filteredFiles), [filteredFiles]);
  const folders = useMemo(() => groupByFolder(filteredFiles), [filteredFiles]);

  // ─── Stats ───
  const totalDuration = useMemo(() => localFiles.reduce((s, t) => s + (t.duration ?? 0), 0), [localFiles]);

  // ─── Actions ───
  const handlePlay = (track: Track) => {
    if (playbackMode === 'local' || playbackMode === 'sync') {
      playTrackLocally(track);
      if (playbackMode === 'sync') {
        // Also send to bot
        play(track.filePath ?? track.title, 'local');
      }
    } else {
      play(track.filePath ?? track.title, 'local');
    }
  };

  const handleAddToQueue = (track: Track) => {
    if (playbackMode === 'local' || playbackMode === 'sync') {
      addTrackToLocalQueue(track);
      if (playbackMode === 'sync') {
        addToQueue(track.filePath ?? track.title, 'local');
      }
    } else {
      addToQueue(track.filePath ?? track.title, 'local');
    }
  };

  const handlePlayAll = (tracks: Track[]) => {
    if (tracks.length === 0) return;
    handlePlay(tracks[0]);
    for (let i = 1; i < tracks.length; i++) {
      handleAddToQueue(tracks[i]);
    }
  };

  const handleShuffleAll = (tracks: Track[]) => {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    handlePlayAll(shuffled);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // ─── Category tabs ───
  const categories: { id: LibraryCategory; label: string; icon: typeof Music; count: number }[] = [
    { id: 'all', label: 'All Tracks', icon: Music, count: localFiles.length },
    { id: 'artists', label: 'Artists', icon: User, count: artists.length },
    { id: 'albums', label: 'Albums', icon: Disc3, count: albums.length },
    { id: 'folders', label: 'Folders', icon: FolderOpen, count: folders.length },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 text-[11px] text-t-faint">
        <span>{localFiles.length} tracks</span>
        <span className="h-3 w-px bg-white/10" />
        <span>{artists.length} artists</span>
        <span className="h-3 w-px bg-white/10" />
        <span>{albums.length} albums</span>
        {totalDuration > 0 && (
          <>
            <span className="h-3 w-px bg-white/10" />
            <span>{formatDurationLong(totalDuration)}</span>
          </>
        )}
      </div>

      {/* Category navigation + search bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5">
          {categories.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setCategory(id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-all ${
                category === id
                  ? 'bg-white/[0.1] text-t-primary shadow-sm'
                  : 'text-t-faint hover:bg-white/[0.04] hover:text-t-tertiary'
              }`}
            >
              <Icon size={13} />
              {label}
              <span
                className={`ml-0.5 rounded-full px-1.5 py-px text-[9px] font-bold tabular-nums ${
                  category === id ? 'bg-white/10 text-t-secondary' : 'bg-white/[0.04] text-t-faint'
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-t-faint" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter library…"
              className="h-8 w-48 rounded-lg border border-white/[0.06] bg-white/[0.03] pl-8 pr-3 text-[12px] text-t-secondary placeholder-white/20 outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]"
            />
          </div>

          {/* Layout toggle (for artists/albums grid views) */}
          {(category === 'artists' || category === 'albums') && !drillDown && (
            <div className="flex rounded-lg border border-white/[0.06] bg-white/[0.03]">
              <button
                onClick={() => setLayout('grid')}
                className={`rounded-l-lg p-1.5 transition-colors ${layout === 'grid' ? 'bg-white/[0.08] text-t-secondary' : 'text-t-faint hover:text-t-tertiary'}`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setLayout('list')}
                className={`rounded-r-lg p-1.5 transition-colors ${layout === 'list' ? 'bg-white/[0.08] text-t-secondary' : 'text-t-faint hover:text-t-tertiary'}`}
              >
                <LayoutList size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Drill-down breadcrumb + play all */}
      {drillDown && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrillDown(null)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-t-tertiary transition-colors hover:bg-white/[0.04] hover:text-t-secondary"
            >
              <ChevronLeft size={14} />
              Back
            </button>
            <span className="text-t-ghost">/</span>
            <div className="flex items-center gap-2">
              {drillDown.type === 'artist' && <User size={14} className="text-t-faint" />}
              {drillDown.type === 'album' && <Disc3 size={14} className="text-t-faint" />}
              {drillDown.type === 'folder' && <FolderOpen size={14} className="text-t-faint" />}
              <span className="text-[13px] font-semibold text-t-secondary">
                {drillDown.value.split(/[\\/]/).pop() || drillDown.value}
              </span>
              <span className="text-[11px] text-t-faint">{drillTracks.length} tracks</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePlayAll(sortedTracks)}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-accent-light px-3.5 py-1.5 text-[11px] font-semibold text-black shadow-sm transition-all hover:brightness-110"
            >
              <Play size={12} fill="black" />
              Play All
            </button>
            <button
              onClick={() => handleShuffleAll(drillTracks)}
              className="btn-glass flex items-center gap-1.5 !px-3 !py-1.5 text-[11px]"
            >
              <Shuffle size={12} />
              Shuffle
            </button>
          </div>
        </div>
      )}

      {/* Content area */}
      {localFiles.length === 0 ? (
        <EmptyLibrary />
      ) : drillDown || category === 'all' ? (
        <TrackTable
          tracks={sortedTracks}
          sortField={sortField}
          sortDir={sortDir}
          toggleSort={toggleSort}
          currentFilePath={currentFilePath}
          queueFilePaths={queueFilePaths}
          livePos={livePos}
          player={player}
          onPlay={handlePlay}
          onPause={pause}
          onResume={resume}
          onAddToQueue={handleAddToQueue}
          showAlbum={category !== 'albums' && drillDown?.type !== 'album'}
          showArtist={drillDown?.type !== 'artist'}
          onPlayAll={!drillDown ? () => handlePlayAll(sortedTracks) : undefined}
          onShuffleAll={!drillDown ? () => handleShuffleAll(sortedTracks) : undefined}
        />
      ) : category === 'artists' ? (
        layout === 'grid' ? (
          <ArtistGrid artists={artists} onSelect={(name) => setDrillDown({ type: 'artist', value: name })} />
        ) : (
          <ArtistList artists={artists} onSelect={(name) => setDrillDown({ type: 'artist', value: name })} />
        )
      ) : category === 'albums' ? (
        layout === 'grid' ? (
          <AlbumGrid albums={albums} onSelect={(name) => setDrillDown({ type: 'album', value: name })} />
        ) : (
          <AlbumList albums={albums} onSelect={(name) => setDrillDown({ type: 'album', value: name })} />
        )
      ) : category === 'folders' ? (
        <FolderGrid folders={folders} onSelect={(path) => setDrillDown({ type: 'folder', value: path })} />
      ) : null}
    </div>
  );
}

// ─── Sub-components ───

function EmptyLibrary() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Music size={40} className="text-t-ghost" />
      <p className="text-sm text-t-faint">No media files found</p>
      <p className="text-xs text-t-ghost">Add a music folder above or drag & drop files</p>
    </div>
  );
}

// ─── Track Table ───

interface TrackTableProps {
  tracks: Track[];
  sortField: SortField;
  sortDir: SortDir;
  toggleSort: (field: SortField) => void;
  currentFilePath?: string;
  queueFilePaths: Set<string>;
  livePos: number;
  player: { isPlaying: boolean; duration: number };
  onPlay: (track: Track) => void;
  onPause: () => void;
  onResume: () => void;
  onAddToQueue: (track: Track) => void;
  showAlbum?: boolean;
  showArtist?: boolean;
  onPlayAll?: () => void;
  onShuffleAll?: () => void;
}

function TrackTable({
  tracks,
  sortField,
  sortDir,
  toggleSort,
  currentFilePath,
  queueFilePaths,
  livePos,
  player,
  onPlay,
  onPause,
  onResume,
  onAddToQueue,
  showAlbum = true,
  showArtist = true,
  onPlayAll,
  onShuffleAll,
}: TrackTableProps) {
  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      size={10}
      className={`ml-1 inline transition-transform ${
        sortField === field ? (sortDir === 'desc' ? 'rotate-180 text-t-tertiary' : 'text-t-tertiary') : 'text-t-ghost'
      }`}
    />
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Play all / shuffle controls for "All Tracks" */}
      {onPlayAll && tracks.length > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={onPlayAll}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-accent-light px-3.5 py-1.5 text-[11px] font-semibold text-black shadow-sm transition-all hover:brightness-110"
          >
            <Play size={12} fill="black" />
            Play All
          </button>
          <button onClick={onShuffleAll} className="btn-glass flex items-center gap-1.5 !px-3 !py-1.5 text-[11px]">
            <Shuffle size={12} />
            Shuffle
          </button>
          <span className="ml-2 text-[11px] text-t-faint">{tracks.length} tracks</span>
        </div>
      )}

      {/* Column headers */}
      <div className="flex items-center gap-3 border-b border-white/[0.04] px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-t-faint">
        <div className="w-10 shrink-0 text-center">
          <Hash size={10} className="mx-auto text-t-ghost" />
        </div>
        <button onClick={() => toggleSort('title')} className="min-w-0 flex-1 text-left hover:text-t-tertiary">
          Title <SortIcon field="title" />
        </button>
        {showArtist && (
          <button
            onClick={() => toggleSort('artist')}
            className="hidden w-[18%] text-left hover:text-t-tertiary md:block"
          >
            Artist <SortIcon field="artist" />
          </button>
        )}
        {showAlbum && (
          <button
            onClick={() => toggleSort('album')}
            className="hidden w-[18%] text-left hover:text-t-tertiary lg:block"
          >
            Album <SortIcon field="album" />
          </button>
        )}
        <button onClick={() => toggleSort('duration')} className="w-16 text-right hover:text-t-tertiary">
          <Clock size={10} className="ml-auto inline" /> <SortIcon field="duration" />
        </button>
        <div className="w-16" /> {/* actions spacer */}
      </div>

      {/* Rows */}
      <div className="card-glass rounded-xl p-1">
        {tracks.map((track, i) => {
          const isNowPlaying = !!track.filePath && track.filePath === currentFilePath;
          const isQueued = !!track.filePath && queueFilePaths.has(track.filePath);
          const progressPct = isNowPlaying && player.duration > 0 ? (livePos / player.duration) * 100 : 0;

          return (
            <div
              key={`${track.filePath}-${i}`}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2 transition-all ${
                isNowPlaying ? 'bg-accent/[0.07]' : 'hover:bg-white/[0.03]'
              }`}
              onDoubleClick={() => !isNowPlaying && onPlay(track)}
            >
              {/* Progress bar behind the row */}
              {isNowPlaying && (
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 bg-accent/[0.06] transition-[width] duration-1000 ease-linear"
                  style={{ width: `${progressPct}%` }}
                />
              )}

              {/* Track number / icon */}
              <div className="relative z-[1] flex h-8 w-10 shrink-0 items-center justify-center">
                {isNowPlaying && player.isPlaying ? (
                  <NowPlayingBars />
                ) : isNowPlaying ? (
                  <Pause size={14} className="text-accent" />
                ) : (
                  <span className="text-[11px] tabular-nums text-t-ghost group-hover:hidden">{i + 1}</span>
                )}
                {/* Hover play icon */}
                {!isNowPlaying && (
                  <button
                    onClick={() => onPlay(track)}
                    className="hidden text-t-tertiary hover:text-t-primary group-hover:block"
                  >
                    <Play size={14} />
                  </button>
                )}
              </div>

              {/* Title & file type icon */}
              <div className="relative z-[1] min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {track.mediaType === 'video' ? (
                    <FileVideo size={13} className="shrink-0 text-purple-400/40" />
                  ) : (
                    <FileAudio size={13} className="shrink-0 text-t-ghost" />
                  )}
                  <p className={`truncate text-[13px] font-medium ${isNowPlaying ? 'text-accent' : 'text-t-primary'}`}>
                    {track.title}
                  </p>
                  {isQueued && !isNowPlaying && (
                    <span className="shrink-0 rounded-full bg-amber-400/10 px-1.5 py-px text-[9px] font-medium text-amber-400/70">
                      Queued
                    </span>
                  )}
                </div>
                {/* Mobile: show artist below title */}
                {showArtist && (
                  <p className="truncate text-[11px] text-t-faint md:hidden">{track.artist ?? 'Unknown Artist'}</p>
                )}
              </div>

              {/* Artist column (desktop) */}
              {showArtist && (
                <p className="relative z-[1] hidden w-[18%] truncate text-[12px] text-t-faint md:block">
                  {track.artist ?? 'Unknown Artist'}
                </p>
              )}

              {/* Album column (desktop) */}
              {showAlbum && (
                <p className="relative z-[1] hidden w-[18%] truncate text-[12px] text-t-faint lg:block">
                  {track.album ?? '—'}
                </p>
              )}

              {/* Duration */}
              <span className="relative z-[1] w-16 text-right text-[11px] tabular-nums text-t-faint">
                {isNowPlaying ? (
                  <span className="text-accent/60">{formatTime(livePos)}</span>
                ) : track.duration ? (
                  formatTime(track.duration)
                ) : (
                  ''
                )}
              </span>

              {/* Actions */}
              <div className="relative z-[1] flex w-16 items-center justify-end gap-1">
                {isNowPlaying ? (
                  <button
                    onClick={() => (player.isPlaying ? onPause() : onResume())}
                    className="rounded-full p-1.5 text-accent transition-colors hover:text-accent/80"
                  >
                    {player.isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onPlay(track)}
                      className="rounded-full p-1.5 text-t-ghost opacity-0 hover:text-t-tertiary group-hover:opacity-100"
                    >
                      <Play size={13} />
                    </button>
                    <button
                      onClick={() => onAddToQueue(track)}
                      className="rounded-full p-1.5 text-t-ghost opacity-0 hover:text-t-tertiary group-hover:opacity-100"
                      title="Add to queue"
                    >
                      <Plus size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Artist Grid ───

function ArtistGrid({ artists, onSelect }: { artists: ArtistInfo[]; onSelect: (name: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {artists.map((artist) => (
        <button
          key={artist.name}
          onClick={() => onSelect(artist.name)}
          className="card-glass-hover group flex flex-col items-center gap-3 rounded-xl !p-4 text-center"
        >
          {/* Avatar circle */}
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${hashGradient(artist.name)} shadow-lg transition-transform group-hover:scale-105`}
          >
            <User size={28} className="text-t-tertiary" />
          </div>
          <div>
            <p className="truncate text-[13px] font-semibold text-t-primary">{artist.name}</p>
            <p className="text-[11px] text-t-faint">
              {artist.trackCount} track{artist.trackCount !== 1 ? 's' : ''}
              {artist.albumCount > 0 && ` · ${artist.albumCount} album${artist.albumCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Artist List ───

function ArtistList({ artists, onSelect }: { artists: ArtistInfo[]; onSelect: (name: string) => void }) {
  return (
    <div className="card-glass rounded-xl p-1">
      {artists.map((artist) => (
        <button
          key={artist.name}
          onClick={() => onSelect(artist.name)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-white/[0.04]"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${hashGradient(artist.name)}`}
          >
            <User size={16} className="text-t-tertiary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-t-primary">{artist.name}</p>
            <p className="text-[11px] text-t-faint">
              {artist.trackCount} track{artist.trackCount !== 1 ? 's' : ''}
              {artist.albumCount > 0 && ` · ${artist.albumCount} album${artist.albumCount !== 1 ? 's' : ''}`}
            </p>
          </div>
          <span className="text-[11px] text-t-ghost">{formatDurationLong(artist.totalDuration)}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Album Grid ───

function AlbumGrid({ albums, onSelect }: { albums: AlbumInfo[]; onSelect: (name: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {albums.map((album) => (
        <button
          key={album.name}
          onClick={() => onSelect(album.name)}
          className="card-glass-hover group flex flex-col gap-3 rounded-xl !p-3 text-left"
        >
          {/* Album art placeholder */}
          <div
            className={`flex aspect-square w-full items-center justify-center rounded-lg bg-gradient-to-br ${hashGradient(album.name)} transition-transform group-hover:scale-[1.02]`}
          >
            <Disc3 size={32} className="text-t-faint" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-t-primary">{album.name}</p>
            <p className="truncate text-[11px] text-t-faint">{album.artist}</p>
            <p className="text-[10px] text-t-faint">
              {album.trackCount} track{album.trackCount !== 1 ? 's' : ''}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Album List ───

function AlbumList({ albums, onSelect }: { albums: AlbumInfo[]; onSelect: (name: string) => void }) {
  return (
    <div className="card-glass rounded-xl p-1">
      {albums.map((album) => (
        <button
          key={album.name}
          onClick={() => onSelect(album.name)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-white/[0.04]"
        >
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${hashGradient(album.name)}`}
          >
            <Disc3 size={18} className="text-t-faint" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-t-primary">{album.name}</p>
            <p className="text-[11px] text-t-faint">{album.artist}</p>
          </div>
          <span className="text-[11px] text-t-faint">
            {album.trackCount} track{album.trackCount !== 1 ? 's' : ''}
          </span>
          <span className="text-[11px] text-t-ghost">{formatDurationLong(album.totalDuration)}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Folder Grid ───

function FolderGrid({ folders, onSelect }: { folders: FolderInfo[]; onSelect: (path: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {folders.map((folder) => (
        <button
          key={folder.path}
          onClick={() => onSelect(folder.path)}
          className="card-glass-hover flex items-center gap-4 rounded-xl !p-4 text-left"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-600/10">
            <FolderOpen size={22} className="text-amber-400/50" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-t-primary">{folder.name}</p>
            <p className="truncate text-[11px] text-t-faint" title={folder.path}>
              {folder.path}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-medium text-t-tertiary">{folder.trackCount}</p>
            <p className="text-[10px] text-t-faint">track{folder.trackCount !== 1 ? 's' : ''}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Animated equalizer ───

function NowPlayingBars() {
  return (
    <div className="flex h-4 items-end gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] animate-now-playing-bar rounded-full bg-accent"
          style={{ animationDelay: `${i * 0.15}s`, height: '60%' }}
        />
      ))}
    </div>
  );
}
