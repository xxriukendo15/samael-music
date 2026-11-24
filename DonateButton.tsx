import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CONFIG } from './config';
import { openDonation } from './donate';

export default function DonateButton() {
  return (
    <TouchableOpacity style={styles.btn} onPress={openDonation} activeOpacity={0.8}>
      <Text style={styles.text}>🐾 {CONFIG.donation.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: CONFIG.colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginVertical: 12,
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 15, textAlign: 'center' },
});
