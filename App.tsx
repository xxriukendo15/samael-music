import React, { useState } from 'react';
import { Platform, StatusBar as RNStatusBar, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CONFIG } from './config';
import { LibraryProvider } from './LibraryContext';
import { PlayerProvider } from './PlayerContext';
import SearchScreen from './SearchScreen';
import LibraryScreen from './LibraryScreen';
import PlayerScreen from './PlayerScreen';
import MiniPlayer from './MiniPlayer';

const C = CONFIG.colors;
type Tab = 'search' | 'favorites' | 'downloads' | 'player';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'search', label: 'Buscar', icon: '🔎' },
  { key: 'favorites', label: 'Favoritos', icon: '♥' },
  { key: 'downloads', label: 'Descargas', icon: '⬇' },
  { key: 'player', label: 'Reproductor', icon: '🎧' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('search');
  const topPad = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44;

  return (
    <LibraryProvider>
      <PlayerProvider>
        <View style={[styles.root, { paddingTop: topPad }]}>
          <StatusBar style="light" />
          <View style={styles.header}>
            <Text style={styles.logo}>🎧</Text>
            <Text style={styles.appName}>{CONFIG.appName}</Text>
          </View>

          <View style={{ flex: 1 }}>
            {tab === 'search' && <SearchScreen />}
            {tab === 'favorites' && <LibraryScreen mode="favorites" />}
            {tab === 'downloads' && <LibraryScreen mode="downloads" />}
            {tab === 'player' && <PlayerScreen />}
          </View>

          {tab !== 'player' && <MiniPlayer onOpen={() => setTab('player')} />}

          <View style={styles.tabs}>
            {TABS.map((t) => (
              <TouchableOpacity key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
                <Text style={[styles.tabIcon, tab === t.key && { color: C.primary }]}>{t.icon}</Text>
                <Text style={[styles.tabLabel, tab === t.key && { color: C.primary }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </PlayerProvider>
    </LibraryProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  logo: { fontSize: 28 },
  appName: { color: C.text, fontSize: 20, fontWeight: '800', marginLeft: 10 },
  tabs: { flexDirection: 'row', backgroundColor: C.surface, paddingBottom: 6 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabIcon: { color: C.textMuted, fontSize: 20 },
  tabLabel: { color: C.textMuted, fontSize: 11, marginTop: 2 },
});
