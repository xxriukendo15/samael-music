import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
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
  const soundRef = useRef<Audio.Sound | null>(null);
  const queueRef = useRef<Track[]>([]);
  const indexRef = useRef(0);
  const reqRef = useRef(0);
  const nextRef = useRef<() => Promise<void>>(async () => {});
  const downloadedRef = useRef(isDownloaded);
  downloadedRef.current = isDownloaded;

  const [current, setCurrent] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const onStatus = useCallback((s: AVPlaybackStatus) => {
    if (!s.isLoaded) return;
    setIsPlaying(s.isPlaying);
    setPosition(s.positionMillis);
    setDuration(s.durationMillis ?? 0);
    if (s.didJustFinish) nextRef.current();
  }, []);

  const playTrack = useCallback(
    async (t: Track, queue?: Track[]) => {
      const req = ++reqRef.current;
      try {
        setLoading(true);
        setError(null);
        if (queue) queueRef.current = queue;
        else if (!queueRef.current.some((x) => x.id === t.id)) queueRef.current = [t];
        indexRef.current = Math.max(0, queueRef.current.findIndex((x) => x.id === t.id));
        setCurrent(t);
        setPosition(0);
        setDuration(0);

        if (soundRef.current) {
          await soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
        if (t.provider === 'youtube') {
  setIsPlaying(false);
  return;
        }
        const uri = downloadedRef.current(t.id) ? localPath(t.id) : await streamUrl(t);
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true, progressUpdateIntervalMillis: 500 },
          onStatus
        );
        if (req !== reqRef.current) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
      } catch {
        setError('No se pudo reproducir esta canción.');
        setIsPlaying(false);
      } finally {
        if (req === reqRef.current) setLoading(false);
      }
    },
    [onStatus]
  );

  const toggle = useCallback(async () => {
    const s = soundRef.current;
    if (!s) return;
    const st = await s.getStatusAsync();
    if (!st.isLoaded) return;
    if (st.isPlaying) await s.pauseAsync();
    else await s.playAsync();
  }, []);

  const next = useCallback(async () => {
    const q = queueRef.current;
    if (!q.length) return;
    const i = (indexRef.current + 1) % q.length;
    await playTrack(q[i]);
  }, [playTrack]);
  nextRef.current = next;

  const seekTo = useCallback(async (ms: number) => {
    await soundRef.current?.setPositionAsync(ms).catch(() => {});
  }, []);

  const prev = useCallback(async () => {
    const q = queueRef.current;
    if (!q.length) return;
    if (position > 3000) {
      await seekTo(0);
      return;
    }
    const i = (indexRef.current - 1 + q.length) % q.length;
    await playTrack(q[i]);
  }, [playTrack, position, seekTo]);

  return (
    <Ctx.Provider
      value={{ current, isPlaying, loading, position, duration, error, playTrack, toggle, next, prev, seekTo }}
    >
      {children}
    </Ctx.Provider>
  );
}
