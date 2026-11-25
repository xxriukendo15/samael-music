import React from 'react';
import { Image, Text, TouchableOpacity, View, StyleSheet, ActivityIndicator } from 'react-native';
import { CONFIG } from './config';
import { Track } from './audius';
import { usePlayer } from './PlayerContext';
import { useLibrary } from './LibraryContext';

const C = CONFIG.colors;

export default function TrackRow({ track, queue }: { track: Track; queue: Track[] }) {
  const { playTrack, current, isPlaying } = usePlayer();
  const { isFav, toggleFav, isDownloaded, download, removeDownload, downloading } = useLibrary();
  const active = current?.id === track.id;
  const downloaded = isDownloaded(track.id);
  const busy = downloading.includes(track.id);

  return (
    <TouchableOpacity style={styles.row} onPress={() => playTrack(track, queue)} activeOpacity={0.7}>
      {track.artwork ? (
        <Image source={{ uri: track.artwork }} style={styles.art} />
      ) : (
        <View style={[styles.art, styles.noArt]}>
          <Text style={{ fontSize: 22 }}>🎵</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.title, active && { color: C.primary }]} numberOfLines={1}>
          {active && isPlaying ? '▶ ' : ''}
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>
      <TouchableOpacity onPress={() => toggleFav(track)} style={styles.icon}>
        <Text style={[styles.iconText, isFav(track.id) && { color: C.accent }]}>
          {isFav(track.id) ? '♥' : '♡'}
        </Text>
      </TouchableOpacity>
      {track.provider === 'audius' && (
        <TouchableOpacity
          onPress={() => (downloaded ? removeDownload(track) : download(track))}
          style={styles.icon}
        >
          {busy ? (
            <ActivityIndicator color={C.primary} />
          ) : (
            <Text style={[styles.iconText, downloaded && { color: C.primary }]}>
              {downloaded ? '✓' : '⬇'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  art: { width: 52, height: 52, borderRadius: 8, backgroundColor: C.surface },
  noArt: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginHorizontal: 12 },
  title: { color: C.text, fontSize: 15, fontWeight: '600' },
  artist: { color: C.textMuted, fontSize: 13, marginTop: 2 },
  icon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: C.textMuted, fontSize: 22 },
});
