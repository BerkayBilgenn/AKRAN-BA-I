// forgot.js (Nihai Versiyon)
import { auth } from './firebase-config.js';
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {

    const forgotPasswordForm = document.getElementById('forgot-password-form');
    
    if (!forgotPasswordForm) {
        return console.error("Hata: 'forgot-password-form' ID'li form elementi bulunamadı!");
    }
    
    const submitButton = forgotPasswordForm.querySelector('.submit-btn');

    forgotPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;

        if (!email) {
            return alert("Lütfen e-posta adresinizi girin.");
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Gönderiliyor...';

        try {
            await sendPasswordResetEmail(auth, email);
            
            // Firebase hata göndermediği için, her zaman bu "güvenli" mesajı gösteriyoruz.
            alert("Eğer girdiğiniz e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.");
            window.location.href = 'login.html';

        } catch (error) {
            // Sadece geçersiz e-posta formatı gibi genel hatalar bu bloğa düşer.
            console.error("Beklenmedik Şifre Sıfırlama Hatası:", error);
            alert("İşlem sırasında bir hata oluştu. Lütfen girdiğiniz e-posta adresinin doğru olduğundan emin olun.");

        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Sıfırlama Bağlantısı Gönder';
        }
    });
});