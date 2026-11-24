import React from 'react';
import { Image, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { CONFIG } from './config';
import { usePlayer } from './PlayerContext';

const C = CONFIG.colors;

export default function MiniPlayer({ onOpen }: { onOpen: () => void }) {
  const { current, isPlaying, toggle, next, loading } = usePlayer();
  if (!current) return null;
  return (
    <TouchableOpacity style={styles.bar} onPress={onOpen} activeOpacity={0.9}>
      {current.artwork ? <Image source={{ uri: current.artwork }} style={styles.art} /> : <View style={styles.art} />}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{current.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{loading ? 'Cargando…' : current.artist}</Text>
      </View>
      <TouchableOpacity onPress={toggle} style={styles.btn}>
        <Text style={styles.btnText}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={next} style={styles.btn}>
        <Text style={styles.btnText}>⏭</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#26263a',
  },
  art: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#26263a' },
  info: { flex: 1, marginHorizontal: 10 },
  title: { color: C.text, fontWeight: '600' },
  artist: { color: C.textMuted, fontSize: 12 },
  btn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: C.text, fontSize: 22 },
});
