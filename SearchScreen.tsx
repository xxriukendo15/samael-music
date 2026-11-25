import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { CONFIG } from './config';
import { Track, searchTracks, trendingTracks } from './audius';
import TrackRow from './TrackRow';

const C = CONFIG.colors;
const GENRES = [
  'Cumbia peruana', 'K-pop', 'Rock', 'Merengue', 'Bachata', 'Reguetón',
  'Chicha', 'Salsa', 'Vallenato', 'Huayno', 'Electrónica', 'Pop', 'Rap',
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('Tendencias');

  const run = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      if (q.trim()) {
        const found = await searchTracks(q.trim());
        setResults(found);
        setTitle(`Resultados: ${q.trim()}`);
      } else {
        setResults(await trendingTracks());
        setTitle('Tendencias en Audius');
      }
    } catch {
      setError('No se pudo conectar con los catálogos. Revisa tu internet e intenta de nuevo.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { run(''); }, [run]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Busca canciones, artistas o géneros…"
        placeholderTextColor={C.textMuted}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => run(query)}
        returnKeyType="search"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genres}>
        {GENRES.map((genre) => (
          <TouchableOpacity key={genre} style={styles.chip} onPress={() => { setQuery(genre); run(genre); }}>
            <Text style={styles.chipText}>{genre}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.section}>{title}</Text>
      <Text style={styles.hint}>Búsqueda combinada: Audius + Apple/iTunes. Algunas canciones solo tienen vista previa.</Text>
      {loading && <ActivityIndicator color={C.primary} style={{ marginVertical: 16 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={results}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TrackRow track={item} queue={results} />}
        ListEmptyComponent={!loading && !error ? <Text style={styles.empty}>Sin resultados. Prueba otro título o artista.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: { backgroundColor: C.surface, color: C.text, margin: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, fontSize: 16 },
  genres: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  chip: { backgroundColor: C.surface, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8 },
  chipText: { color: C.text, fontSize: 13 },
  section: { color: C.text, fontSize: 18, fontWeight: '700', marginHorizontal: 12, marginBottom: 4 },
  hint: { color: C.textMuted, fontSize: 11, marginHorizontal: 12, marginBottom: 8 },
  error: { color: C.accent, textAlign: 'center', margin: 16 },
  empty: { color: C.textMuted, textAlign: 'center', marginTop: 24 },
});
