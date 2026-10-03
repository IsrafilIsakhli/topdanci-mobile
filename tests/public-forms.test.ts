import { describe, expect, it } from 'vitest';
import {
  applicationErrors, applicationPayload, emptyApplication, emptySupport,
  loginErrors, passwordErrors, supportErrors, supportPayload,
} from '../src/features/account/public-forms';

const contact = { ...emptyApplication, contactName: '  Test Satıcı  ', contactPhone: '+994 50 123 45 67' };
const application = { ...contact, companyName: '  Test mağaza  ', city: '  Bakı  ' };
const support = { ...emptySupport, name: 'Test alıcı', email: 'test@example.com', message: 'Test müraciəti haqqında məlumat' };

describe('mobil giriş və müraciət formaları', () => {
  it('giriş üçün e-poçt və telefonu qəbul edir, yanlış məlumatları dayandırır', () => {
    expect(loginErrors(' test@example.com ', 'password1')).toEqual({});
    expect(loginErrors('+994 (50) 123-45-67', 'password1')).toEqual({});
    expect(loginErrors('səhv ünvan', 'short')).toHaveProperty('identifier');
    expect(loginErrors('test@example.com', 'short')).toHaveProperty('password');
    expect(loginErrors('a'.repeat(170) + '@example.com', 'password1')).toHaveProperty('identifier');
    expect(loginErrors('test@example.com', 'a'.repeat(129))).toHaveProperty('password');
  });

  it('birinci mərhələni mağaza məlumatlarından ayrı yoxlayır', () => {
    expect(applicationErrors(contact, true)).toEqual({});
    expect(applicationErrors(contact)).toMatchObject({ companyName: expect.any(String), city: expect.any(String) });
    expect(applicationErrors({ ...contact, contactPhone: '123' }, true)).toHaveProperty('contactPhone');
    expect(applicationErrors({ ...contact, contactEmail: 'yanlış' }, true)).toHaveProperty('contactEmail');
  });

  it('istəyə bağlı xanaları tələb etmir və uzun məlumatı dayandırır', () => {
    expect(applicationErrors(application)).toEqual({});
    expect(applicationErrors({ ...application, description: 'x'.repeat(1201) })).toHaveProperty('description');
    expect(applicationErrors({ ...application, city: 'x'.repeat(81) })).toHaveProperty('city');
    expect(applicationErrors({ ...application, taxNumber: 'x'.repeat(41) })).toHaveProperty('taxNumber');
  });

  it('boş əlavə xanaları göndərmir, kateqoriya identifikatorunu qoruyur', () => {
    expect(applicationPayload(application)).toEqual({ contactName: 'Test Satıcı', contactPhone: '+994 50 123 45 67', companyName: 'Test mağaza', city: 'Bakı' });
    expect(applicationPayload({ ...application, categoryId: 'category-id', contactEmail: ' test@example.com ', description: ' test təsviri ' }))
      .toMatchObject({ categoryId: 'category-id', contactEmail: 'test@example.com', description: 'test təsviri' });
  });

  it('dəstək formasında mesajın sərhədlərini və əlavə telefonun formatını yoxlayır', () => {
    expect(supportErrors(support)).toEqual({});
    expect(supportErrors({ ...support, message: '123456789' })).toHaveProperty('message');
    expect(supportErrors({ ...support, message: '1234567890' })).toEqual({});
    expect(supportErrors({ ...support, message: 'x'.repeat(1600) })).toEqual({});
    expect(supportErrors({ ...support, message: 'x'.repeat(1601) })).toHaveProperty('message');
    expect(supportErrors({ ...support, phone: 'səhv' })).toHaveProperty('phone');
  });

  it('dəstək məlumatında boşluqları təmizləyir və boş telefon göndərmir', () => {
    expect(supportPayload({ ...support, name: ' Test alıcı ', email: ' test@example.com ', phone: ' ', subject: ' ' }))
      .toEqual({ name: 'Test alıcı', email: 'test@example.com', message: support.message });
  });

  it('şifrə dəyişərkən cari şifrəni və təkrarın uyğunluğunu tələb edir', () => {
    expect(passwordErrors('password1', 'newPassword1', 'newPassword1')).toEqual({});
    expect(passwordErrors('', 'newPassword1', 'other')).toMatchObject({ currentPassword: expect.any(String), again: expect.any(String) });
    expect(passwordErrors('password1', 'short', 'short')).toHaveProperty('newPassword');
  });
});
