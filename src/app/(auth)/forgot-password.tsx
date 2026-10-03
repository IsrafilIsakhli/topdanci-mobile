import { useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { KeyRound } from 'lucide-react-native';
import { PublicPage, IntroCard } from '../../components/public-page';
import { FormButton, FormInput, FormNote, FormSection } from '../../components/form-ui';
import { api } from '../../api/client';
import { DEMO_CATALOG } from '../../api/config';
export default function ForgotPassword(){
 const router=useRouter(),lock=useRef(false);const [email,setEmail]=useState(''),[code,setCode]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[step,setStep]=useState(1),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[lastSent,setLastSent]=useState(0);
 async function submit(resend=false){
 if(lock.current)return;setError('');setMessage('');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setError('Düzgün e-poçt ünvanı yazın.');return;}
 if(DEMO_CATALOG){setError('Nümunə rejimində bərpa məktubu göndərilmir. Bu axın canlı server və e-poçt xidməti qoşulanda işləyəcək.');return;}
 if(step===2&&!resend&&(!/^\d{6}$/.test(code)||password.length<8||!/[a-z]/.test(password)||!/[A-Z]/.test(password)||!/[0-9]/.test(password)||password!==confirm)){setError('6 rəqəmli kod yazın. Şifrə ən az 8 simvol, böyük/kiçik hərf və rəqəm içərməli; təkrar şifrə eyni olmalıdır.');return;}
 if(resend&&Date.now()-lastSent<60000){setError('Yeni kod istəmək üçün 1 dəqiqə gözləyin.');return;}
 lock.current=true;setBusy(true);Keyboard.dismiss();
 try{
 const response=step===1||resend?await api.post<{message:string}>('/auth/forgot-password',{email:email.trim().toLowerCase()}):await api.post<{message:string}>('/auth/reset-password',{email:email.trim().toLowerCase(),code,password});
 setMessage(response.data.message);if(step===1||resend){setStep(2);setLastSent(Date.now());}else{setStep(3);setPassword('');setConfirm('');}
 }catch(e){setError(e instanceof Error?e.message:'Bərpa alınmadı.');}finally{lock.current=false;setBusy(false);}
 }
 return <PublicPage title="Şifrəni bərpa et" back><IntroCard eyebrow="HESABA QAYIDIŞ" title="Yeni şifrə ilə davam edin" text="Hesabınızın e-poçtuna gələn kodla şifrənizi yeniləyin." icon={<KeyRound color="#fff" size={23}/>}/>
 <FormSection title={step===1?'1. E-poçtunuzu yazın':step===2?'2. Kod və yeni şifrə':'Şifrə yeniləndi'}>
 {step<3&&<FormInput label="Hesabın e-poçtu" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" maxLength={180} editable={!busy&&step===1}/>}
 {step===2&&<><FormInput label="6 rəqəmli bərpa kodu" value={code} onChangeText={v=>setCode(v.replace(/\D/g,''))} keyboardType="number-pad" textContentType="oneTimeCode" maxLength={6} editable={!busy}/><FormInput label="Yeni şifrə" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" maxLength={128} editable={!busy}/><FormInput label="Yeni şifrəni təkrarla" value={confirm} onChangeText={setConfirm} secureTextEntry maxLength={128} editable={!busy}/><FormNote>Ən az 8 simvol, böyük və kiçik hərf və rəqəm. Kod 15 dəqiqə etibarlıdır.</FormNote></>}
 {!!error&&<FormNote error>{error}</FormNote>}{!!message&&<FormNote>{message}</FormNote>}
 {step<3?<FormButton title={step===1?'Bərpa kodu istə':'Şifrəni yenilə'} busy={busy} onPress={()=>void submit()}/>:<FormButton title="Daxil ol" onPress={()=>router.replace('/login')}/>}
 {step===2&&<><FormButton secondary title="Kodu yenidən istə" disabled={busy} onPress={()=>void submit(true)}/><FormButton secondary title="Başqa e-poçt istifadə et" disabled={busy} onPress={()=>{setStep(1);setCode('');setMessage('');setError('');}}/></>}
 <FormButton secondary title="Dəstək ilə əlaqə" disabled={busy} onPress={()=>router.push('/support')}/>
 </FormSection></PublicPage>;
}