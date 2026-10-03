export type FormErrors = Record<string, string>;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isEmail(value: string) { return emailPattern.test(value.trim()); }
export function isPhone(value: string) {
  return value.trim().length <= 32 && /^[+\d\s()\-]+$/.test(value.trim()) && value.replace(/\D/g, '').length >= 7;
}
export function loginErrors(identifier: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (identifier.trim().length > 180 || (!isEmail(identifier) && !isPhone(identifier))) errors.identifier = 'Düzgün e-poçt və ya telefon nömrəsi yazın.';
  if (password.length < 8 || password.length > 128) errors.password = 'Şifrə 8–128 simvol olmalıdır.';
  return errors;
}
export type StoreApplicationForm = {
  contactName: string; contactPhone: string; contactEmail: string; companyName: string;
  taxNumber: string; categoryId: string; city: string; district: string; description: string;
};
export const emptyApplication: StoreApplicationForm = { contactName: '', contactPhone: '', contactEmail: '',
  companyName: '', taxNumber: '', categoryId: '', city: '', district: '', description: '' };
export function applicationErrors(form: StoreApplicationForm, contactOnly = false): FormErrors {
  const errors: FormErrors = {};
  if (form.contactName.trim().length < 2 || form.contactName.trim().length > 120) errors.contactName = 'Ad və soyad 2–120 simvol olmalıdır.';
  if (!isPhone(form.contactPhone)) errors.contactPhone = 'Düzgün telefon nömrəsi yazın.';
  if (form.contactEmail.trim() && (!isEmail(form.contactEmail) || form.contactEmail.trim().length > 180)) errors.contactEmail = 'Düzgün e-poçt ünvanı yazın.';
  if (contactOnly) return errors;
  if (form.companyName.trim().length < 2 || form.companyName.trim().length > 160) errors.companyName = 'Mağaza adı 2–160 simvol olmalıdır.';
  if (!form.city.trim() || form.city.trim().length > 80) errors.city = 'Mağazanın şəhərini yazın.';
  if (form.taxNumber.trim().length > 40) errors.taxNumber = 'VÖEN ən çox 40 simvol ola bilər.';
  if (form.district.trim().length > 80) errors.district = 'Rayon ən çox 80 simvol ola bilər.';
  if (form.description.trim().length > 1200) errors.description = 'Təsvir ən çox 1200 simvol ola bilər.';
  return errors;
}
export function applicationPayload(form: StoreApplicationForm) {
  return { contactName: form.contactName.trim(), contactPhone: form.contactPhone.trim(), companyName: form.companyName.trim(), city: form.city.trim(),
    ...(form.contactEmail.trim() ? { contactEmail: form.contactEmail.trim() } : {}),
    ...(form.taxNumber.trim() ? { taxNumber: form.taxNumber.trim() } : {}),
    ...(form.categoryId ? { categoryId: form.categoryId } : {}),
    ...(form.district.trim() ? { district: form.district.trim() } : {}),
    ...(form.description.trim() ? { description: form.description.trim() } : {}) };
}
export type SupportForm = { name: string; email: string; phone: string; subject: string; message: string };
export const emptySupport: SupportForm = { name: '', email: '', phone: '', subject: '', message: '' };
export function supportErrors(form: SupportForm): FormErrors {
  const errors: FormErrors = {};
  if (form.name.trim().length < 2 || form.name.trim().length > 120) errors.name = 'Ad və soyad 2–120 simvol olmalıdır.';
  if (!isEmail(form.email) || form.email.trim().length > 160) errors.email = 'Düzgün e-poçt ünvanı yazın.';
  if (form.phone.trim() && !isPhone(form.phone)) errors.phone = 'Düzgün telefon nömrəsi yazın və ya xananı boş saxlayın.';
  if (form.subject.trim().length > 160) errors.subject = 'Mövzu ən çox 160 simvol ola bilər.';
  if (form.message.trim().length < 10 || form.message.trim().length > 1600) errors.message = 'Mesaj 10–1600 simvol olmalıdır.';
  return errors;
}
export function supportPayload(form: SupportForm) {
  return { name: form.name.trim(), email: form.email.trim(), message: form.message.trim(),
    ...(form.phone.trim() ? { phone: form.phone.trim() } : {}), ...(form.subject.trim() ? { subject: form.subject.trim() } : {}) };
}
export function passwordErrors(currentPassword: string, newPassword: string, again: string): FormErrors {
  const errors: FormErrors = {};
  if (currentPassword.length < 8 || currentPassword.length > 128) errors.currentPassword = 'Cari şifrə 8–128 simvol olmalıdır.';
  if (newPassword.length < 8 || newPassword.length > 128) errors.newPassword = 'Yeni şifrə 8–128 simvol olmalıdır.';
  if (again !== newPassword) errors.again = 'Şifrələr uyğun deyil.';
  return errors;
}
