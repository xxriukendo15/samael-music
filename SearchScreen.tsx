import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, View, StyleSheet } from 'react-native';
import { CONFIG } from './config';
import { Track, searchTracks, trendingTracks } from './audius';
import TrackRow from './TrackRow';

const C = CONFIG.colors;

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
        setResults(await searchTracks(q.trim()));
        setTitle(`Resultados: ${q.trim()}`);
      } else {
        setResults(await trendingTracks());
        setTitle('Tendencias');
      }
    } catch {
      setError('No se pudo conectar. Revisa tu internet e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run('');
  }, [run]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Busca canciones, artistas…"
        placeholderTextColor={C.textMuted}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => run(query)}
        returnKeyType="search"
      />
      <Text style={styles.section}>{title}</Text>
      {loading && <ActivityIndicator color={C.primary} style={{ marginVertical: 16 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={results}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TrackRow track={item} queue={results} />}
        ListEmptyComponent={
          !loading && !error ? <Text style={styles.empty}>Sin resultados.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: {
    backgroundColor: C.surface,
    color: C.text,
    margin: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  section: { color: C.text, fontSize: 18, fontWeight: '700', marginHorizontal: 12, marginBottom: 4 },
  error: { color: C.accent, textAlign: 'center', margin: 16 },
  empty: { color: C.textMuted, textAlign: 'center', marginTop: 24 },
});
