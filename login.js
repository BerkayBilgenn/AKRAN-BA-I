// login.js
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// EKLENDİ: Tüm kod bu bloğun içine alındı.
document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('login-form');

    if (!loginForm) {
        return console.error("Hata: 'login-form' ID'li form elementi bulunamadı!");
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            return alert("Lütfen tüm alanları doldurun.");
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // MANTIKSAL İYİLEŞTİRME: E-posta doğrulandı mı?
            if (user.emailVerified) {
                // E-posta doğrulanmışsa giriş başarılıdır.
                console.log('Giriş başarılı ve e-posta doğrulanmış:', user);
                alert(`Hoş geldin, ${user.email}!`);
                // TODO: Ana sayfaya yönlendirme burada yapılacak.
                window.location.href = 'dashboard.html'; 
            } else {
                // E-posta doğrulanmamışsa giriş engellenir.
                alert("Giriş yapmadan önce lütfen e-postanıza gönderilen doğrulama linkine tıklayarak hesabınızı aktif edin.");
                // İsteğe bağlı olarak kullanıcıyı tekrar sistemden atabiliriz:
                // auth.signOut();
            }
        } catch (error) {
            console.error("Giriş Hatası:", error.code);
            if (error.code === 'auth/invalid-credential') {
                alert("E-posta veya şifre hatalı. Lütfen tekrar deneyin.");
            } else {
                alert("Giriş sırasında bir hata oluştu.");
            }
        }
    });
});