import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Track, streamUrl } from './audius';

export const MUSIC_DIR = `${FileSystem.documentDirectory}music/`;
export const localPath = (id: string) => `${MUSIC_DIR}${id}.mp3`;

const FAV_KEY = '@samael/favorites';
const DL_KEY = '@samael/downloads';

type LibraryState = {
  favorites: Track[];
  downloads: Track[];
  downloading: string[];
  isFav: (id: string) => boolean;
  isDownloaded: (id: string) => boolean;
  toggleFav: (t: Track) => void;
  download: (t: Track) => Promise<void>;
  removeDownload: (t: Track) => Promise<void>;
};

const Ctx = createContext<LibraryState>(null as any);
export const useLibrary = () => useContext(Ctx);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [downloads, setDownloads] = useState<Track[]>([]);
  const [downloading, setDownloading] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [f, d] = await Promise.all([
          AsyncStorage.getItem(FAV_KEY),
          AsyncStorage.getItem(DL_KEY),
        ]);
        if (f) setFavorites(JSON.parse(f));
        if (d) setDownloads(JSON.parse(d));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(FAV_KEY, JSON.stringify(favorites));
  }, [favorites, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(DL_KEY, JSON.stringify(downloads));
  }, [downloads, loaded]);

  const isFav = (id: string) => favorites.some((t) => t.id === id);
  const isDownloaded = (id: string) => downloads.some((t) => t.id === id);

  const toggleFav = (t: Track) =>
    setFavorites((prev) =>
      prev.some((x) => x.id === t.id) ? prev.filter((x) => x.id !== t.id) : [t, ...prev]
    );

  const download = async (t: Track) => {
    if (downloading.includes(t.id) || isDownloaded(t.id)) return;
    setDownloading((d) => [...d, t.id]);
    try {
      await FileSystem.makeDirectoryAsync(MUSIC_DIR, { intermediates: true }).catch(() => {});
      if (t.provider !== 'audius') {
  Alert.alert(
    'Vista previa',
    'Apple/iTunes solo ofrece una previsualización y no se puede descargar desde Samael Music.'
  );
  return;
}
const url = await streamUrl(t);
      const res = await FileSystem.downloadAsync(url, localPath(t.id));
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
      setDownloads((prev) => [t, ...prev.filter((x) => x.id !== t.id)]);
    } catch {
      await FileSystem.deleteAsync(localPath(t.id), { idempotent: true }).catch(() => {});
      Alert.alert('Error', 'No se pudo descargar la canción.');
    } finally {
      setDownloading((d) => d.filter((x) => x !== t.id));
    }
  };

  const removeDownload = async (t: Track) => {
    await FileSystem.deleteAsync(localPath(t.id), { idempotent: true }).catch(() => {});
    setDownloads((prev) => prev.filter((x) => x.id !== t.id));
  };

  return (
    <Ctx.Provider
      value={{ favorites, downloads, downloading, isFav, isDownloaded, toggleFav, download, removeDownload }}
    >
      {children}
    </Ctx.Provider>
  );
}
