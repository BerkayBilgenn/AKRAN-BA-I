// signup.js (TÜM ALERT'LER POP-UP OLDU)
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js"; 
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js"; 

document.addEventListener('DOMContentLoaded', () => {

    const signupForm = document.getElementById('signup-form');
    // Başarı Modalı Elementleri
    const successModal = document.getElementById('success-modal');
    const successModalMessage = document.getElementById('modal-message');
    const successModalCloseBtn = document.getElementById('modal-close');

    // Hata Modalı Elementleri
    const errorModal = document.getElementById('error-modal');
    const errorModalMessage = document.getElementById('error-modal-message');
    const errorModalCloseBtn = document.getElementById('error-modal-close');

    if (!signupForm) return;

    // Pop-up kapatma butonları
    successModalCloseBtn.addEventListener('click', () => successModal.classList.remove('active'));
    errorModalCloseBtn.addEventListener('click', () => errorModal.classList.remove('active'));

    // Form gönderildiğinde çalışacak ana fonksiyon
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Form doğrulama hataları için eski alert yerine hata pop-up'ını kullan
        if (!username || !email || !password) {
            showErrorModal("Lütfen tüm alanları doldurun.");
            return;
        }
        if (password !== confirmPassword) {
            showErrorModal("Girdiğiniz şifreler eşleşmiyor!");
            return;
        }

        try {
            // Firebase işlemleri...
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await sendEmailVerification(user);
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, {
                kullaniciAdi: username,
                email: user.email,
                olusturmaTarihi: serverTimestamp(),
                emailVerified: user.emailVerified,
                rol: "ogrenci"
            });

            // Başarılı olduğunda başarı pop-up'ını göster
            successModalMessage.textContent = `Hesabınız başarıyla oluşturuldu! Lütfen ${email} adresine gönderilen doğrulama bağlantısına tıklayarak hesabınızı aktif edin.`;
            successModal.classList.add('active');

        } catch (error) {
            console.error("Kayıt Hatası:", error);
            // Firebase'den hata geldiğinde hata pop-up'ını göster
            if (error.code === 'auth/email-already-in-use') {
                showErrorModal("Bu e-posta adresi zaten sistemde kayıtlı. Lütfen giriş yapmayı deneyin.");
            } else if (error.code === 'auth/weak-password') {
                showErrorModal("Şifre en az 6 karakter olmalıdır.");
            } else {
                showErrorModal("Kayıt sırasında beklenmedik bir hata oluştu.");
            }
        }
    });

    // Hata pop-up'ını gösteren yardımcı fonksiyon
    function showErrorModal(message) {
        if(errorModalMessage && errorModal) {
            errorModalMessage.textContent = message;
            errorModal.classList.add('active');
        }
    }
});