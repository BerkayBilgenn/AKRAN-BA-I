// dashboard.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const userDisplayName = document.getElementById('user-display-name');
const logoutBtn = document.getElementById('logout-btn');

// 1. KULLANICI OTURUM KONTROLÜ
onAuthStateChanged(auth, async (user) => {
    // Bu fonksiyon, sayfa her yüklendiğinde çalışır ve oturum durumunu kontrol eder.
    if (user) {
        // Kullanıcı giriş yapmış ise...
        console.log("Giriş yapmış kullanıcı:", user.uid);

        // Kullanıcının e-postası doğrulanmış mı diye kontrol et (güvenlik için)
        if (!user.emailVerified) {
            alert("Bu sayfayı görmek için önce e-postanızı doğrulamanız gerekmektedir.");
            window.location.href = 'login.html';
            return;
        }

        // Firestore'dan kullanıcının ek bilgilerini (kullanıcı adını) çek
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
            // Firestore'da kullanıcı verisi bulunduysa, kullanıcı adını ekrana yaz.
            const userData = docSnap.data();
            userDisplayName.textContent = userData.kullaniciAdi;
        } else {
            // Firestore'da kullanıcı verisi bulunamadıysa, e-postasını yaz.
            console.log("Kullanıcı için Firestore'da ek bilgi bulunamadı.");
            userDisplayName.textContent = user.email;
        }

    } else {
        // Kullanıcı giriş yapmamış ise...
        console.log("Kullanıcı giriş yapmamış, login sayfasına yönlendiriliyor.");
        alert("Bu sayfayı görmek için giriş yapmalısınız.");
        window.location.href = 'login.html';
    }
});

// 2. ÇIKIŞ YAPMA BUTONU
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        // Başarıyla çıkış yapıldı.
        console.log("Kullanıcı çıkış yaptı.");
        window.location.href = 'login.html';
    }).catch((error) => {
        // Çıkış yaparken bir hata oluştu.
        console.error("Çıkış Hatası:", error);
        alert("Çıkış yapılırken bir hata oluştu.");
    });
});