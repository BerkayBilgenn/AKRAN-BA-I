// signup.js
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js"; 
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js"; 

document.addEventListener('DOMContentLoaded', () => {

    const signupForm = document.getElementById('signup-form');
    // Modal elementlerini seçiyoruz
    const modal = document.getElementById('success-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalCloseBtn = document.getElementById('modal-close');

    if (!signupForm) {
        console.error("Hata: 'signup-form' ID'li form elementi bulunamadı!");
        return;
    }

    // Modal kapatma butonu için olay dinleyici
    modalCloseBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!username || !email || !password) {
            return alert("Lütfen tüm alanları doldurun.");
        }
        if (password !== confirmPassword) {
            return alert("Girdiğiniz şifreler eşleşmiyor!");
        }

        try {
            // 1. Hesap oluşturuluyor
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // 2. Doğrulama e-postası gönderiliyor
            await sendEmailVerification(user);

            // 3. Firestore'a veri yazılıyor
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, {
                kullaniciAdi: username,
                email: user.email,
                olusturmaTarihi: serverTimestamp(),
                emailVerified: user.emailVerified,
                rol: "ogrenci"
            });

            // 4. Yönlendirme yerine pop-up gösteriliyor
            modalMessage.textContent = `Hesabınız başarıyla oluşturuldu! Lütfen ${email} adresine gönderilen doğrulama bağlantısına tıklayarak hesabınızı aktif edin.`;
            modal.classList.add('active');
            
            // ESKİ KODLAR SİLİNDİ (alert ve window.location.href)

        } catch (error) {
            console.error("Kayıt Hatası:", error);
            if (error.code === 'auth/email-already-in-use') {
                alert("Bu e-posta adresi zaten kullanılıyor.");
            } else if (error.code === 'auth/weak-password') {
                alert("Şifre en az 6 karakter olmalıdır.");
            } else {
                alert("Kayıt sırasında bir hata oluştu.");
            }
        }
    });
});