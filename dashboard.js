// dashboard.js (HEM MENTÖR LİSTESİ HEM KULLANICI ARAMA)
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// HTML Elementlerini seç
const userDisplayName = document.getElementById('user-display-name');
const logoutBtn = document.getElementById('logout-btn');
const mentorListContainer = document.getElementById('mentor-list-container');
const searchForm = document.getElementById('user-search-form');
const searchInput = document.getElementById('search-input');
const searchResultsContainer = document.getElementById('search-results-container');

// Mentörleri Firestore'dan çeker ve ekrana basar
async function fetchAndDisplayMentors() {
    if (!mentorListContainer) return;

    try {
        const q = query(collection(db, "mentors"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            mentorListContainer.innerHTML = "<p>Şu anda platformda kayıtlı mentör bulunmamaktadır.</p>";
            return;
        }

        let mentorsHTML = '';
        querySnapshot.forEach((doc) => {
            const mentorData = doc.data();
            const mentorId = doc.id;
            mentorsHTML += `
                <a href="mentor-detail.html?id=${mentorId}" class="mentor-card">
                    <img src="${mentorData.resimUrl}" alt="${mentorData.isim}">
                    <div class="mentor-card-body">
                        <h3>${mentorData.isim}</h3>
                        <p>${mentorData.bolum}</p>
                    </div>
                </a>
            `;
        });
        mentorListContainer.innerHTML = mentorsHTML;
    } catch (error) {
        console.error("Mentorleri çekerken hata oluştu:", error);
    }
}

// Kullanıcı arama formunu yönetir
function setupUserSearch() {
    if (!searchForm) return;

    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const searchTerm = searchInput.value.trim();

        if (searchTerm.length < 2) {
            searchResultsContainer.innerHTML = '<p class="no-results">Arama yapmak için en az 2 karakter girin.</p>';
            return;
        }

        searchResultsContainer.innerHTML = '<p class="no-results">Aranıyor...</p>';

        try {
            const q = query(
                collection(db, "users"),
                where("kullaniciAdi", ">=", searchTerm),
                where("kullaniciAdi", "<=", searchTerm + '\uf8ff'),
                limit(10)
            );
            
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                searchResultsContainer.innerHTML = '<p class="no-results">Kullanıcı bulunamadı.</p>';
            } else {
                let resultsHTML = '';
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    resultsHTML += `
                        <a href="profile.html?id=${doc.id}" class="search-result-item">
                            ${userData.kullaniciAdi}
                        </a>
                    `;
                });
                searchResultsContainer.innerHTML = resultsHTML;
            }
        } catch (error) {
            console.error("Kullanıcı aranırken hata:", error);
        }
    });
}

// OTURUM KONTROLÜ
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            userDisplayName.innerHTML = `<a href="profile.html?id=${user.uid}" class="nav-link">${docSnap.data().kullaniciAdi}</a>`;
        } else {
            userDisplayName.innerHTML = `<a href="profile.html?id=${user.uid}" class="nav-link">${user.email}</a>`;
        }

        // HEM MENTÖRLERİ GETİRİR HEM DE ARAMAYI AKTİF EDER
        fetchAndDisplayMentors();
        setupUserSearch();

    } else {
        window.location.href = 'index.html';
    }
});

// ÇIKIŞ YAPMA BUTONU
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    });
});