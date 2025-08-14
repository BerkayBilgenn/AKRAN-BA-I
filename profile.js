// profile.js (YORUM SİSTEMİ EKLENMİŞ NİHAİ VERSİYON)
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { 
    doc, getDoc, collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, deleteDoc, onSnapshot 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- GLOBAL DEĞİŞKENLER ---
const userDisplayName = document.getElementById('user-display-name');
const logoutBtn = document.getElementById('logout-btn');
const userProfileContainer = document.getElementById('user-profile-container');
const profileUserId = new URLSearchParams(window.location.search).get('id');
let currentFollowDocId = null;
let loggedInUserData = null; // Giriş yapmış kullanıcının verilerini saklamak için

// --- ANA GİRİŞ NOKTASI ---
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Navigasyon çubuğunu ve global kullanıcı verisini güncelle
    const loggedInUserDocRef = doc(db, "users", user.uid);
    const loggedInUserSnap = await getDoc(loggedInUserDocRef);
    if (loggedInUserSnap.exists()) {
        loggedInUserData = loggedInUserSnap.data(); // Kullanıcı verisini global değişkene ata
        userDisplayName.innerHTML = `<a href="profile.html?id=${user.uid}" class="nav-link">${loggedInUserData.kullaniciAdi}</a>`;
    } else {
        userDisplayName.innerHTML = `<a href="profile.html?id=${user.uid}" class="nav-link">${user.email}</a>`;
    }

    if (profileUserId) {
        await loadUserProfile(profileUserId, user.uid);
        listenToFollowerCount(profileUserId);
    } else {
        userProfileContainer.innerHTML = `<div class="profile-error">Kullanıcı ID'si belirtilmemiş.</div>`;
    }
});

// --- PROFİL YÜKLEME ---
async function loadUserProfile(userId, currentUserId) {
    try {
        const profileUserDocRef = doc(db, "users", userId);
        const profileUserSnap = await getDoc(profileUserDocRef);

        if (!profileUserSnap.exists()) {
            userProfileContainer.innerHTML = `<div class="profile-error">Bu ID'ye sahip bir kullanıcı bulunamadı.</div>`;
            return;
        }
        
        const profileUserData = profileUserSnap.data();
        const imageUrl = profileUserData.resimUrl || `https://placehold.co/150x150/7E8EF1/FFFFFF/png?text=${profileUserData.kullaniciAdi.charAt(0).toUpperCase()}`;
        
        let followButtonHTML = '';
        if (currentUserId !== userId) {
            followButtonHTML = `<button id="follow-button" class="follow-btn follow">Takip Et</button>`;
        }

        let postFormHTML = '';
        if (currentUserId === userId) {
            postFormHTML = `
                <div class="post-creation-section">
                    <h2>Yeni Bir Gönderi Paylaş</h2>
                    <form id="post-form">
                        <textarea id="post-content" placeholder="Bir gelişme veya duyuru paylaşın..."></textarea>
                        <button type="submit" class="submit-btn">Paylaş</button>
                    </form>
                </div>
            `;
        }

        userProfileContainer.innerHTML = `
            <div class="mentor-profile-card">
                <div class="profile-header">
                    <div class="profile-avatar"><img src="${imageUrl}" alt="${profileUserData.kullaniciAdi}"></div>
                    <div class="profile-info"><h1>${profileUserData.kullaniciAdi}</h1><p>${profileUserData.rol}</p></div>
                    <div class="profile-actions">${followButtonHTML}</div>
                </div>
                <div class="profile-stats">
                    <div class="stat-item"><strong>0</strong> Takip Edilen</div>
                    <div class="stat-item"><strong id="follower-count">0</strong> Takipçi</div>
                </div>
                <div class="profile-body">
                    <h2>Hakkında</h2>
                    <p class="bio">Bu kullanıcının hakkında bölümü henüz doldurulmamış.</p>
                    ${postFormHTML}
                    <h2 style="margin-top: 2rem;">Paylaşımlar</h2>
                    <div id="user-posts-container"></div>
                </div>
            </div>
        `;

        await loadUserPosts(userId, currentUserId);

        if (currentUserId === userId) {
            document.getElementById('post-form').addEventListener('submit', handlePostSubmit);
        }
        if (currentUserId !== userId) {
            document.getElementById('follow-button').addEventListener('click', handleFollowClick);
            updateFollowButtonState(currentUserId, userId);
        }
        userProfileContainer.addEventListener('click', handleProfileActions);
        userProfileContainer.addEventListener('submit', handleCommentSubmit);


    } catch (error) { console.error("Profil yüklenirken ana hata:", error); }
}

// --- GÖNDERİ İŞLEMLERİ ---
async function loadUserPosts(userId, currentUserId) {
    const postsContainer = document.getElementById('user-posts-container');
    if (!postsContainer) return;
    const q = query(collection(db, "posts"), where("yazarId", "==", userId), orderBy("olusturmaTarihi", "desc"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        postsContainer.innerHTML = "<p>Henüz bir gönderi oluşturulmadı.</p>";
    } else {
        let postsHTML = '';
        snapshot.forEach(doc => {
            const post = doc.data();
            const postDate = post.olusturmaTarihi ? post.olusturmaTarihi.toDate().toLocaleString('tr-TR', { day:'2-digit', month: '2-digit', year: 'numeric', hour:'2-digit', minute:'2-digit'}) : '';
            const deleteBtn = currentUserId === post.yazarId ? `<button class="delete-post-btn" data-post-id="${doc.id}">&times;</button>` : '';
            postsHTML += `
                <div class="mentor-post-card">
                    ${deleteBtn}
                    <p class="post-content">${post.icerik}</p>
                    <div class="post-footer">
                        <p class="post-date">${postDate}</p>
                        <div class="post-actions">
                            <button class="action-btn like-btn" data-post-id="${doc.id}">
                                <i class="icon fa-regular fa-heart"></i> 
                                <span class="like-count" data-post-id="${doc.id}">0</span>
                            </button>
                            <button class="action-btn comment-toggle-btn" data-post-id="${doc.id}">
                                <i class="icon fa-regular fa-comment"></i>
                                <span class="comment-count" data-post-id="${doc.id}">0</span>
                            </button>
                        </div>
                    </div>
                    <div class="comments-section" id="comments-for-${doc.id}" style="display: none;">
                        <div class="comments-list"></div>
                        <form class="comment-form" data-post-id="${doc.id}">
                            <input type="text" class="comment-input" placeholder="Yorum ekle..." required>
                        </form>
                    </div>
                </div>`;
        });
        postsContainer.innerHTML = postsHTML;
        snapshot.forEach(doc => {
            listenToPostLikes(doc.id, currentUserId);
            listenToPostComments(doc.id); // YENİ EKLENDİ
        });
    }
}

async function handlePostSubmit(event) {
    event.preventDefault();
    const contentInput = document.getElementById('post-content');
    const content = contentInput.value.trim();
    const currentUser = auth.currentUser;
    if (!content || !currentUser) return;
    try {
        await addDoc(collection(db, "posts"), { icerik: content, yazarId: currentUser.uid, olusturmaTarihi: serverTimestamp() });
        contentInput.value = '';
        await loadUserPosts(currentUser.uid, currentUser.uid);
    } catch (err) { console.error("Gönderi kaydedilirken hata:", err); }
}

async function handleProfileActions(event) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Gönderi silme butonu
    if (event.target.classList.contains('delete-post-btn')) {
        const postId = event.target.dataset.postId;
        const confirmed = await showConfirmationModal("Bu gönderiyi kalıcı olarak silmek istediğinizden emin misiniz?");
        if (confirmed) {
            try {
                await deleteDoc(doc(db, "posts", postId));
                await loadUserPosts(profileUserId, currentUser.uid);
            } catch (error) { console.error("Gönderi silinirken hata oluştu:", error); }
        }
    }

    // Beğeni butonu
    const likeButton = event.target.closest('.like-btn');
    if (likeButton) {
        const postId = likeButton.dataset.postId;
        handleLikeClick(postId, currentUser.uid);
    }
    
    // YORUM BÖLÜMÜNÜ AÇMA/KAPATMA
    const commentToggleButton = event.target.closest('.comment-toggle-btn');
    if (commentToggleButton) {
        const postId = commentToggleButton.dataset.postId;
        const commentsSection = document.getElementById(`comments-for-${postId}`);
        if (commentsSection) {
            const isVisible = commentsSection.style.display === 'block';
            commentsSection.style.display = isVisible ? 'none' : 'block';
        }
    }
}

// --- YORUM İŞLEMLERİ (YENİ EKLENDİ) ---

function listenToPostComments(postId) {
    const commentCountSpan = document.querySelector(`.comment-count[data-post-id="${postId}"]`);
    const commentsListDiv = document.querySelector(`#comments-for-${postId} .comments-list`);

    if (!commentCountSpan || !commentsListDiv) return;

    const q = query(collection(db, "comments"), where("postId", "==", postId), orderBy("timestamp", "asc"));

    onSnapshot(q, (snapshot) => {
        // Yorum sayısını güncelle
        commentCountSpan.textContent = snapshot.size;
        
        // Yorum listesini güncelle
        let commentsHTML = '';
        snapshot.forEach(doc => {
            const comment = doc.data();
            commentsHTML += `
                <div class="comment">
                    <p><strong class="comment-author">${comment.kullaniciAdi}</strong> ${comment.icerik}</p>
                </div>
            `;
        });
        commentsListDiv.innerHTML = commentsHTML;
    });
}

async function handleCommentSubmit(event) {
    if (!event.target.classList.contains('comment-form')) return;
    
    event.preventDefault();
    const form = event.target;
    const postId = form.dataset.postId;
    const input = form.querySelector('.comment-input');
    const content = input.value.trim();
    
    if (!content || !loggedInUserData) {
        console.error("Yorum içeriği boş veya kullanıcı bilgisi bulunamadı.");
        return;
    }

    try {
        await addDoc(collection(db, "comments"), {
            postId: postId,
            yazarId: auth.currentUser.uid,
            kullaniciAdi: loggedInUserData.kullaniciAdi,
            icerik: content,
            timestamp: serverTimestamp()
        });
        input.value = ''; // Formu temizle
    } catch (error) {
        console.error("Yorum eklenirken hata oluştu:", error);
    }
}

// --- BEĞENİ İŞLEMLERİ ---
function listenToPostLikes(postId, currentUserId) {
    const likeButton = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
    const likeCountSpan = document.querySelector(`.like-count[data-post-id="${postId}"]`);
    if (!likeButton || !likeCountSpan) return;

    onSnapshot(query(collection(db, "likes"), where("postId", "==", postId)), (snapshot) => {
        likeCountSpan.textContent = snapshot.size;
    });

    if (currentUserId) {
        onSnapshot(query(collection(db, "likes"), where("postId", "==", postId), where("userId", "==", currentUserId)), (snapshot) => {
            if (snapshot.empty) {
                likeButton.classList.remove('liked');
                likeButton.querySelector('.icon').className = 'icon fa-regular fa-heart';
            } else {
                likeButton.classList.add('liked');
                likeButton.querySelector('.icon').className = 'icon fa-solid fa-heart';
            }
        });
    }
}

async function handleLikeClick(postId, currentUserId) {
    const likeQuery = query(collection(db, "likes"), where("postId", "==", postId), where("userId", "==", currentUserId));
    const querySnapshot = await getDocs(likeQuery);
    if (querySnapshot.empty) {
        await addDoc(collection(db, "likes"), { postId: postId, userId: currentUserId, timestamp: serverTimestamp() });
    } else {
        await deleteDoc(querySnapshot.docs[0].ref);
    }
}

// --- TAKİP İŞLEMLERİ ---
function listenToFollowerCount(userId) {
    const q = query(collection(db, "followers"), where("followingId", "==", userId));
    onSnapshot(q, (snapshot) => {
        const followerCountElement = document.getElementById('follower-count');
        if (followerCountElement) {
            followerCountElement.textContent = snapshot.size;
        }
    });
}

async function updateFollowButtonState(currentUserId, targetUserId) {
    const followButton = document.getElementById('follow-button');
    if (!followButton) return;
    const q = query(collection(db, "followers"), where("followerId", "==", currentUserId), where("followingId", "==", targetUserId));
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

async function handleFollowClick() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const followButton = document.getElementById('follow-button');
    followButton.disabled = true;
    try {
        if (currentFollowDocId) {
            await deleteDoc(doc(db, "followers", currentFollowDocId));
        } else {
            await addDoc(collection(db, "followers"), { followerId: currentUser.uid, followingId: profileUserId, timestamp: serverTimestamp() });
        }
        await updateFollowButtonState(currentUser.uid, profileUserId);
    } catch (error) {
        console.error("Takip işlemi sırasında hata:", error);
    } finally {
        followButton.disabled = false;
    }
}

// --- MODAL VE ÇIKIŞ ---
function showConfirmationModal(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const messageEl = document.getElementById('confirm-modal-message');
        const confirmBtn = document.getElementById('confirm-delete-btn');
        const cancelBtn = document.getElementById('cancel-delete-btn');
        if(!modal) { resolve(confirm(message)); return; }
        messageEl.textContent = message;
        modal.classList.add('active');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        const close = (value) => { modal.classList.remove('active'); resolve(value); };
        newConfirmBtn.onclick = () => close(true);
        newCancelBtn.onclick = () => close(false);
    });
}

logoutBtn.addEventListener('click', () => signOut(auth).then(() => { window.location.href = 'index.html'; }));