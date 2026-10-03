import { describe, expect, it } from 'vitest';
import { contactUrl } from '../src/lib/contact-links';
describe('seller contact links', () => {
  it('normalizes local Azerbaijani WhatsApp and international phone numbers', () => {
    expect(contactUrl('whatsapp', '050 123 45 67')).toBe('https://wa.me/994501234567');
    expect(contactUrl('whatsapp', '+994 (50) 123-45-67')).toBe('https://wa.me/994501234567');
    expect(contactUrl('phone', '00994 50 123 45 67')).toBe('tel:+994501234567');
    expect(contactUrl('phone', '050 123 45 67')).toBe('tel:0501234567');
  });
  it('encodes product context and email as data', () => {
    const message = 'Salam, gödəkçə & ölçü?';
    expect(contactUrl('whatsapp', '+994501234567', message)).toBe('https://wa.me/994501234567?text=' + encodeURIComponent(message));
    expect(contactUrl('email', 'seller+shop@test.az')).toBe('mailto:seller%2Bshop%40test.az');
    expect(contactUrl('phone', '+994501234567', message)).toBe('tel:+994501234567');
  });
  it('rejects empty contacts, malformed recipients and arbitrary deep links', () => {
    for (const value of [undefined, null, '', '123', 'javascript:alert(1)', '+994501234567?text=other', '1234567890123456'])
      expect(contactUrl('whatsapp', value)).toBeNull();
    expect(contactUrl('email', 'seller@test')).toBeNull();
    expect(contactUrl('email', 'seller @test.az')).toBeNull();
  });
});
