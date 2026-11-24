import { Linking } from 'react-native';
import { CONFIG } from './config';

export function donateUrl(): string {
  const d = CONFIG.donation;
  const params = [
    `business=${encodeURIComponent(d.paypalEmail)}`,
    `amount=${d.amount}`,
    `currency_code=${d.currency}`,
    `item_name=${encodeURIComponent(d.itemName)}`,
    'no_recurring=1',
  ].join('&');
  return `https://www.paypal.com/donate/?${params}`;
}

export function openDonation() {
  return Linking.openURL(donateUrl());
}
