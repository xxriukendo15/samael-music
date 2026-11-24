import React from 'react';
import { FlatList, Text, View, StyleSheet } from 'react-native';
import { CONFIG } from './config';
import { useLibrary } from './LibraryContext';
import TrackRow from './TrackRow';
import DonateButton from './DonateButton';

const C = CONFIG.colors;

export default function LibraryScreen({ mode }: { mode: 'favorites' | 'downloads' }) {
  const { favorites, downloads } = useLibrary();
  const data = mode === 'favorites' ? favorites : downloads;
  const title = mode === 'favorites' ? 'Tus favoritos' : 'Descargas (sin conexión)';

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={data}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TrackRow track={item} queue={data} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {mode === 'favorites'
              ? 'Toca ♡ en una canción para guardarla aquí.'
              : 'Toca ⬇ en una canción para descargarla.'}
          </Text>
        }
        ListFooterComponent={
          <View style={{ paddingHorizontal: 12 }}>
            <DonateButton />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: C.text, fontSize: 20, fontWeight: '700', margin: 12 },
  empty: { color: C.textMuted, textAlign: 'center', marginTop: 32, paddingHorizontal: 24 },
});
