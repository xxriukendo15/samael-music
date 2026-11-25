import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { CONFIG } from './config';
import { usePlayer } from './PlayerContext';
import { useLibrary } from './LibraryContext';
import DonateButton from './DonateButton';
import YoutubePlayer from 'react-native-youtube-iframe';

const C = CONFIG.colors;

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function PlayerScreen() {
  const {
    current,
    isPlaying,
    loading,
    position,
    duration,
    error,
    toggle,
    next,
    prev,
    seekTo,
  } = usePlayer();

  const {
    isFav,
    toggleFav,
    isDownloaded,
    download,
    removeDownload,
  } = useLibrary();

  const youtubeRef = useRef<any>(null);

  const [youtubePlaying, setYoutubePlaying] = useState(false);
  const [youtubePosition, setYoutubePosition] = useState(0);
  const [youtubeDuration, setYoutubeDuration] = useState(0);

  const isYoutube = current?.provider === 'youtube';

  useEffect(() => {
    setYoutubePlaying(false);
    setYoutubePosition(0);
    setYoutubeDuration(0);
  }, [current?.id]);

  useEffect(() => {
    if (!isYoutube) return;

    const timer = setInterval(async () => {
      try {
        if (!youtubeRef.current) return;

        const time = await youtubeRef.current.getCurrentTime();
        const total = await youtubeRef.current.getDuration();

        setYoutubePosition(time * 1000);
        setYoutubeDuration(total * 1000);
      } catch {}
    }, 500);

    return () => clearInterval(timer);
  }, [isYoutube, current?.id]);

  if (!current) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: C.textMuted, textAlign: 'center' }}>
          Elige una canción en Buscar para empezar a escuchar.
        </Text>

        <View style={{ width: '100%', marginTop: 24 }}>
          <DonateButton />
        </View>
      </View>
    );
  }

  const downloaded = isDownloaded(current.id);

  const currentPosition = isYoutube ? youtubePosition : position;
  const currentDuration = isYoutube ? youtubeDuration : duration;
  const currentPlaying = isYoutube ? youtubePlaying : isPlaying;

  const handleToggle = async () => {
    if (isYoutube) {
      setYoutubePlaying(!youtubePlaying);
      return;
    }

    await toggle();
  };

  const handleSeek = async (value: number) => {
    if (isYoutube) {
      try {
        await youtubeRef.current?.seekTo(value / 1000, true);
        setYoutubePosition(value);
      } catch {}
      return;
    }

    await seekTo(value);
  };

  const handlePrevious = async () => {
    if (isYoutube && youtubePosition > 3000) {
      try {
        await youtubeRef.current?.seekTo(0, true);
        setYoutubePosition(0);
      } catch {}
      return;
    }

    await prev();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isYoutube && current.videoId ? (
        <View style={{ width: '100%', marginBottom: 8 }}>
          <YoutubePlayer
            ref={youtubeRef}
            height={220}
            play={youtubePlaying}
            videoId={current.videoId}
            onReady={async () => {
              try {
                const total = await youtubeRef.current?.getDuration();
                if (total) setYoutubeDuration(total * 1000);
                setYoutubePlaying(true);
              } catch {}
            }}
            onChangeState={(state: string) => {
              if (state === 'playing') setYoutubePlaying(true);
              if (state === 'paused') setYoutubePlaying(false);

              if (state === 'ended') {
                setYoutubePlaying(false);
                next();
              }
            }}
          />
        </View>
      ) : current.artwork ? (
        <Image source={{ uri: current.artwork }} style={styles.art} />
      ) : (
        <View style={[styles.art, styles.artPlaceholder]}>
          <Text style={{ fontSize: 64 }}>🎵</Text>
        </View>
      )}

      <Text style={styles.title} numberOfLines={2}>
        {current.title}
      </Text>

      <Text style={styles.artist}>{current.artist}</Text>

      {error && (
        <Text style={{ color: C.accent, marginTop: 8 }}>
          {error}
        </Text>
      )}

      <Slider
        style={{ width: '100%', height: 40, marginTop: 16 }}
        minimumValue={0}
        maximumValue={currentDuration || 1}
        value={Math.min(currentPosition, currentDuration || 1)}
        onSlidingComplete={handleSeek}
        minimumTrackTintColor={C.primary}
        maximumTrackTintColor="#3a3a52"
        thumbTintColor={C.primary}
        disabled={!currentDuration}
      />

      <View style={styles.times}>
        <Text style={styles.time}>{fmt(currentPosition)}</Text>
        <Text style={styles.time}>{fmt(currentDuration)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={handlePrevious}>
          <Text style={styles.ctl}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleToggle} style={styles.play}>
          <Text style={[styles.ctl, { color: '#fff' }]}>
            {loading ? '…' : currentPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={next}>
          <Text style={styles.ctl}>⏭</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => toggleFav(current)}>
          <Text
            style={[
              styles.action,
              isFav(current.id) && { color: C.accent },
            ]}
          >
            {isFav(current.id) ? '♥ Favorito' : '♡ Favorito'}
          </Text>
        </TouchableOpacity>

        {current.provider === 'audius' ? (
          <TouchableOpacity
            onPress={() =>
              downloaded
                ? removeDownload(current)
                : download(current)
            }
          >
            <Text
              style={[
                styles.action,
                downloaded && { color: C.primary },
              ]}
            >
              {downloaded ? '✓ Descargada' : '⬇ Descargar'}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.action}>
            {isYoutube ? 'YouTube' : 'Vista previa de Apple Music'}
          </Text>
        )}
      </View>

      <View style={{ width: '100%', marginTop: 16 }}>
        <DonateButton />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  art: {
    width: 280,
    height: 280,
    borderRadius: 16,
    backgroundColor: C.surface,
  },
  artPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: C.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  artist: {
    color: C.textMuted,
    fontSize: 16,
    marginTop: 4,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  time: {
    color: C.textMuted,
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 220,
    marginTop: 12,
  },
  ctl: {
    color: C.text,
    fontSize: 34,
  },
  play: {
    backgroundColor: C.primary,
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 24,
  },
  action: {
    color: C.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
});
