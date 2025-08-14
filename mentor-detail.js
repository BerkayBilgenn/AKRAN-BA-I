// mentor-detail.js (SON GÜNCEL VE HATASIZ VERSİYON)
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { 
    doc, getDoc, collection, query, where, getDocs, orderBy, 
    addDoc, deleteDoc, onSnapshot, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// HTML Elementlerini seç
const userDisplayName = document.getElementById('user-display-name');
const logoutBtn = document.getElementById('logout-btn');
const mentorProfileContainer = document.getElementById('mentor-profile-container');

// Mentor ID'sini sayfa yüklendiğinde URL'den bir kere alıp saklıyoruz
const mentorId = new URLSearchParams(window.location.search).get('id');
// O anki takip durumunu saklamak için bir değişken
let currentFollowDocId = null;

// ANA FONKSİYON: Mentör bilgilerini ve paylaşımlarını yükler
async function loadMentorData() {
    if (!mentorProfileContainer || !mentorId) return;

    try {
        const mentorDocRef = doc(db, "mentors", mentorId);
        const docSnap = await getDoc(mentorDocRef);

        if (docSnap.exists()) {
            const mentorData = docSnap.data();
            const postsSnapshot = await getDocs(query(collection(db, "posts"), where("yazarId", "==", mentorId), orderBy("olusturmaTarihi", "desc")));
            
            let postsHTML = '';
            if (postsSnapshot.empty) {
                postsHTML = "<p>Henüz bir gönderi oluşturulmadı.</p>";
            } else {
                postsSnapshot.forEach(postDoc => {
                    const postData = postDoc.data();
                    const postDate = postData.olusturmaTarihi ? postData.olusturmaTarihi.toDate().toLocaleDateString('tr-TR') : '';
                    postsHTML += `
                        <div class="mentor-post-card">
                            <p class="post-content">${postData.icerik}</p>
                            <p class="post-date">${postDate}</p>
                        </div>
                    `;
                });
            }

            mentorProfileContainer.innerHTML = `
                <div class="mentor-profile-card">
                    <div class="profile-header">
                        <div class="profile-avatar"><img src="${mentorData.resimUrl}" alt="${mentorData.isim}"></div>
                        <div class="profile-info">
                            <h1>${mentorData.isim}</h1>
                            <p>${mentorData.bolum} - ${mentorData.sinif || 'N/A'}. Sınıf</p>
                        </div>
                        <div class="profile-actions">
                            <button id="follow-button" class="follow-btn follow">Takip Et</button>
                        </div>
                    </div>
                    <div class="profile-stats">
                        <div class="stat-item"><strong>${mentorData.mentiSayisi || 0}</strong> Menti</div>
                        <div class="stat-item"><strong id="follower-count">0</strong> Takipçi</div>
                    </div>
                    <div class="profile-body">
                        <h2>Hakkında</h2>
                        <p class="bio">${mentorData.aciklama}</p>
                        <h2 style="margin-top: 2rem;">Paylaşımlar</h2>
                        <div id="mentor-posts-container">${postsHTML}</div>
                    </div>
                </div>
            `;
            
            document.getElementById('follow-button').addEventListener('click', handleFollowClick);
        } else {
             mentorProfileContainer.innerHTML = `<div class="profile-error">Bu ID'ye sahip bir mentör bulunamadı.</div>`;
        }
    } catch (error) { console.error("Mentör verileri yüklenirken hata oluştu:", error); }
}

// Takipçi sayısını anlık dinler
function listenToFollowerCount() {
    const q = query(collection(db, "followers"), where("followingId", "==", mentorId));
    onSnapshot(q, (snapshot) => {
        const followerCountElement = document.getElementById('follower-count');
        if (followerCountElement) {
            followerCountElement.textContent = snapshot.size;
        }
    });
}

// Takip et/bırak butonunun durumunu günceller
async function updateFollowButtonState(userId) {
    const followButton = document.getElementById('follow-button');
    if (!followButton) return;
    const q = query(collection(db, "followers"), where("followerId", "==", userId), where("followingId", "==", mentorId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        followButton.textContent = "Takip Et";
        followButton.className = "follow-btn follow";
        currentFollowDocId = null;
    } else {
        followButton.textContent = "Takipten Çık";
        followButton.className = "follow-btn unfollow";
        currentFollowDocId = querySnapshot.docs[0].id;
    }
}

// Takip et/bırak butonuna tıklandığında çalışır
async function handleFollowClick() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const followButton = document.getElementById('follow-button');
    followButton.disabled = true;
    try {
        if (currentFollowDocId) {
            await deleteDoc(doc(db, "followers", currentFollowDocId));
        } else {
            await addDoc(collection(db, "followers"), {
                followerId: currentUser.uid,
                followingId: mentorId,
                timestamp: serverTimestamp()
            });
        }
        await updateFollowButtonState(currentUser.uid);
    } catch (error) {
        console.error("Takip işlemi sırasında hata:", error);
    } finally {
        followButton.disabled = false;
    }
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
        
        if (mentorId) {
            await loadMentorData();
            listenToFollowerCount();
            updateFollowButtonState(user.uid);
        } else {
            mentorProfileContainer.innerHTML = `<div class="profile-error">Mentor ID'si belirtilmemiş.</div>`;
        }
    } else {
        window.location.href = 'login.html';
    }
});

// ÇIKIŞ YAPMA BUTONU
logoutBtn.addEventListener('click', () => signOut(auth).then(() => { window.location.href = 'login.html'; }));