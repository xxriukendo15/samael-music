import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import TrackPlayer, {
  Capability,
  Event,
  State,
  useTrackPlayerEvents,
} from 'react-native-track-player';

import { Track, streamUrl } from './audius';
import { localPath, useLibrary } from './LibraryContext';

type PlayerState = {
  current: Track | null;
  isPlaying: boolean;
  loading: boolean;
  position: number;
  duration: number;
  error: string | null;
  playTrack: (t: Track, queue?: Track[]) => Promise<void>;
  toggle: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seekTo: (ms: number) => Promise<void>;
};

const Ctx = createContext<PlayerState>(null as any);
export const usePlayer = () => useContext(Ctx);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { isDownloaded } = useLibrary();
  const downloadedRef = useRef(isDownloaded);
  downloadedRef.current = isDownloaded;

  const queueRef = useRef<Track[]>([]);
  const indexRef = useRef(0);
  const readyRef = useRef(false);
  const setupRef = useRef<Promise<void> | null>(null);

  const [current, setCurrent] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const setup = useCallback(async () => {
    if (readyRef.current) return;

    if (!setupRef.current) {
      setupRef.current = (async () => {
        await TrackPlayer.setupPlayer();

        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.Stop,
          ],
          compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
          ],
        });

        readyRef.current = true;
      })();
    }

    await setupRef.current;
  }, []);

  useEffect(() => {
    setup().catch(() => {
      setError('No se pudo iniciar el reproductor.');
    });
  }, [setup]);

  useTrackPlayerEvents(
    [Event.PlaybackState, Event.PlaybackTrackChanged],
    async (event) => {
      if (event.type === Event.PlaybackState) {
        setIsPlaying(event.state === State.Playing);
      }

      if (
        event.type === Event.PlaybackTrackChanged &&
        event.nextTrack !== undefined &&
        event.nextTrack !== null
      ) {
        const active = await TrackPlayer.getTrack(event.nextTrack);
        if (active?.id) {
          const found = queueRef.current.findIndex(
            (item) => item.id === String(active.id)
          );
          if (found !== -1) {
            indexRef.current = found;
            setCurrent(queueRef.current[found]);
          }
        }
      }
    }
  );

  useEffect(() => {
    const timer = setInterval(async () => {
      if (!readyRef.current) return;

      try {
        const [pos, dur, state] = await Promise.all([
          TrackPlayer.getPosition(),
          TrackPlayer.getDuration(),
          TrackPlayer.getState(),
        ]);

        setPosition(pos * 1000);
        setDuration(dur * 1000);
        setIsPlaying(state === State.Playing);
      } catch {}
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const playTrack = useCallback(
    async (t: Track, queue?: Track[]) => {
      try {
        setLoading(true);
        setError(null);

        if (queue) queueRef.current = queue;
        else if (!queueRef.current.some((item) => item.id === t.id)) {
          queueRef.current = [t];
        }

        indexRef.current = Math.max(
          0,
          queueRef.current.findIndex((item) => item.id === t.id)
        );

        setCurrent(t);
        setPosition(0);
        setDuration(0);

        await setup();

        if (t.provider === 'youtube') {
          await TrackPlayer.reset();
          setIsPlaying(false);
          return;
        }

        const playable = queueRef.current.filter(
          (item) => item.provider === 'audius'
        );

        const selectedIndex = playable.findIndex(
          (item) => item.id === t.id
        );

        if (selectedIndex === -1) {
          throw new Error('Canción no compatible con audio.');
        }

        const playerTracks = await Promise.all(
          playable.map(async (item) => ({
            id: item.id,
            url: downloadedRef.current(item.id)
              ? localPath(item.id)
              : await streamUrl(item),
            title: item.title,
            artist: item.artist,
            artwork: item.artwork,
            duration: item.duration || undefined,
          }))
        );

        await TrackPlayer.reset();
        await TrackPlayer.add(playerTracks);
        await TrackPlayer.skip(selectedIndex);
        await TrackPlayer.play();
      } catch {
        setError('No se pudo reproducir esta canción.');
        setIsPlaying(false);
      } finally {
        setLoading(false);
      }
    },
    [setup]
  );

  const toggle = useCallback(async () => {
    try {
      await setup();
      const state = await TrackPlayer.getState();

      if (state === State.Playing) {
        await TrackPlayer.pause();
      } else if (current?.provider === 'audius') {
        await TrackPlayer.play
