// main.js（Firebase版 Amoca 完全たたき台）
// ※ このファイルは <script type="module" src="./main.js"></script> で読み込まれます。

// ==============================
// 1. Firebase 初期化
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  limit,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ==============================
// 2. DOM 取得
// ==============================

// 共通
const headerUserArea = document.getElementById("headerUserArea");

// 認証ビュー
const authView = document.getElementById("authView");
const appView = document.getElementById("appView");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const emailSignInBtn = document.getElementById("emailSignInBtn");
const emailSignUpBtn = document.getElementById("emailSignUpBtn");
const googleSignInBtn = document.getElementById("googleSignInBtn");
const logoutBtn = document.getElementById("logoutBtn");

// ナビ & ビュー
const navTabs = document.querySelectorAll(".nav-tab");
const myPageView = document.getElementById("myPageView");
const searchView = document.getElementById("searchView");

// プロフィール
const profileAvatar = document.getElementById("profileAvatar");
const profileNameInput = document.getElementById("profileName");
const profileBioInput = document.getElementById("profileBio");
const link1LabelInput = document.getElementById("link1Label");
const link1UrlInput = document.getElementById("link1Url");
const link2LabelInput = document.getElementById("link2Label");
const link2UrlInput = document.getElementById("link2Url");
const link3LabelInput = document.getElementById("link3Label");
const link3UrlInput = document.getElementById("link3Url");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const profileLinksPreview = document.getElementById("profileLinksPreview");

// 作品フォーム & ギャラリー
const itemTypeInput = document.getElementById("itemTypeInput");
const yarnNameInput = document.getElementById("yarnNameInput");
const ballsUsedInput = document.getElementById("ballsUsedInput");
const needleSizeInput = document.getElementById("needleSizeInput");
const startDateInput = document.getElementById("startDateInput");
const endDateInput = document.getElementById("endDateInput");
const photoInput = document.getElementById("photoInput");
const memoInput = document.getElementById("memoInput");
const saveRecordBtn = document.getElementById("saveRecordBtn");

const itemFilterSelect = document.getElementById("itemFilterSelect");
const recordsGallery = document.getElementById("recordsGallery");
const recordsEmpty = document.getElementById("recordsEmpty");

// 毛糸一覧
const yarnNameFilterInput = document.getElementById("yarnNameFilter");
const colorCategoryFilterSelect = document.getElementById("colorCategoryFilter");
const yarnMasterNameInput = document.getElementById("yarnMasterNameInput");
const yarnColorCategoryInput = document.getElementById("yarnColorCategoryInput");
const yarnColorMemoInput = document.getElementById("yarnColorMemoInput");
const yarnStockInput = document.getElementById("yarnStockInput");
const addYarnBtn = document.getElementById("addYarnBtn");
const yarnTableBody = document.getElementById("yarnTableBody");
const yarnEmpty = document.getElementById("yarnEmpty");

// 毛糸ギャラリーモーダル
const yarnModal = document.getElementById("yarnModal");
const closeYarnModalBtn = document.getElementById("closeYarnModalBtn");
const yarnModalTitle = document.getElementById("yarnModalTitle");
const yarnModalColorBadge = document.getElementById("yarnModalColorBadge");
const yarnModalInfo = document.getElementById("yarnModalInfo");
const yarnMyGallery = document.getElementById("yarnMyGallery");
const yarnMyEmpty = document.getElementById("yarnMyEmpty");
const yarnOthersGallery = document.getElementById("yarnOthersGallery");
const yarnOthersEmpty = document.getElementById("yarnOthersEmpty");

// 検索関連
const searchQueryInput = document.getElementById("searchQueryInput");
const searchBtn = document.getElementById("searchBtn");
const searchResultGallery = document.getElementById("searchResultGallery");
// ▼▼ ここを自分の Firebase プロジェクトの設定で書き換えてね ▼▼
 const firebaseConfig = {
  apiKey: "AIzaSyDWmywzWr1lCjuSi51IAA-TQY1abNUNwhw",
  authDomain: "amoca-61391.firebaseapp.com",
  projectId: "amoca-61391",
  storageBucket: "amoca-61391.firebasestorage.app",
  messagingSenderId: "87355773454",
  appId: "1:87355773454:web:562901265f8e970090225f",
  measurementId: "G-RKHT3L59GS"
};
  // storageBucket や他のキーは必要なら追加で
};
// ▲▲ ここまで ▲▲
const searchResultCount = document.getElementById("searchResultCount");
const searchEmpty = document.getElementById("searchEmpty");

// ==============================
// 3. 状態管理用 変数
// ==============================

let currentUser = null;       // Firebase Auth のユーザー
let currentProfile = null;    // users コレクションのプロフィール
let userRecords = [];         // 自分の作品
let userYarns = [];           // 自分の毛糸

// ==============================
// 4. ユーティリティ関数
// ==============================

function setHidden(el, hidden) {
  if (!el) return;
  if (hidden) el.classList.add("hidden");
  else el.classList.remove("hidden");
}

function safeText(str) {
  return (str ?? "").toString();
}

function getInitialFromName(name) {
  const n = (name || "").trim();
  if (!n) return "A";
  return n[0].toUpperCase();
}

// File -> base64 DataURL
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
}

// createdAt の Date をミリ秒取得（null も考慮）
function getCreatedAtMs(data) {
  const ts = data.createdAt;
  if (!ts) return 0;
  try {
    return ts.toMillis();
  } catch {
    return 0;
  }
}

// ==============================
// 5. 認証関連
// ==============================

// ヘッダーのユーザー表示更新
function renderHeaderUser(user) {
  if (!user) {
    headerUserArea.innerHTML = `
      <span>ログインしていません</span>
    `;
    return;
  }
  const name = user.displayName || user.email || "User";
  const initial = getInitialFromName(name);
  headerUserArea.innerHTML = `
    <div class="avatar-circle">${initial}</div>
    <div>
      <div style="font-size:0.8rem;">${name}</div>
      <div style="font-size:0.7rem;color:#777;">ログイン中</div>
    </div>
  `;
}

// ログイン / ログアウトビュー切り替え
function updateAuthView(user) {
  if (user) {
    setHidden(authView, true);
    setHidden(appView, false);
  } else {
    setHidden(authView, false);
    setHidden(appView, true);
  }
}

// メールログイン
emailSignInBtn.addEventListener("click", async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value.trim();
  if (!email || !password) {
    alert("メールアドレスとパスワードを入力してください。");
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error(err);
    alert("ログインに失敗しました：" + (err.message || ""));
  }
});

// メール新規登録
emailSignUpBtn.addEventListener("click", async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value.trim();
  if (!email || !password) {
    alert("メールアドレスとパスワードを入力してください。");
    return;
  }
  if (password.length < 6) {
    alert("パスワードは6文字以上にしてください。");
    return;
  }
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("アカウントを作成しました。");
  } catch (err) {
    console.error(err);
    alert("新規登録に失敗しました：" + (err.message || ""));
  }
});

// Google ログイン
googleSignInBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error(err);
    alert("Googleログインに失敗しました：" + (err.message || ""));
  }
});

// ログアウト
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error(err);
    alert("ログアウトに失敗しました：" + (err.message || ""));
  }
});

// ==============================
// 6. Firestore: プロフィール
// ==============================

async function loadUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    currentProfile = snap.data();
  } else {
    currentProfile = {
      displayName: "",
      bio: "",
      links: [],
    };
  }
  applyProfileToForm();
}

function applyProfileToForm() {
  if (!currentProfile) return;
  profileNameInput.value = currentProfile.displayName || "";
  profileBioInput.value = currentProfile.bio || "";

  const links = currentProfile.links || [];
  const l1 = links[0] || {};
  const l2 = links[1] || {};
  const l3 = links[2] || {};

  link1LabelInput.value = l1.label || "";
  link1UrlInput.value = l1.url || "";
  link2LabelInput.value = l2.label || "";
  link2UrlInput.value = l2.url || "";
  link3LabelInput.value = l3.label || "";
  link3UrlInput.value = l3.url || "";

  const initial = getInitialFromName(currentProfile.displayName || (currentUser && currentUser.email));
  profileAvatar.textContent = initial;

  renderProfileLinksPreview();
}

function renderProfileLinksPreview() {
  profileLinksPreview.innerHTML = "";
  if (!currentProfile) return;

  const links = currentProfile.links || [];
  links.forEach(link => {
    if (!link.url) return;
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "link-pill";
    a.textContent = link.label || link.url;
    profileLinksPreview.appendChild(a);
  });
}

saveProfileBtn.addEventListener("click", async () => {
  if (!currentUser) {
    alert("ログインしてください。");
    return;
  }
  const displayName = profileNameInput.value.trim();
  const bio = profileBioInput.value.trim();

  const links = [];
  if (link1UrlInput.value.trim()) {
    links.push({ label: link1LabelInput.value.trim() || "Link 1", url: link1UrlInput.value.trim() });
  }
  if (link2UrlInput.value.trim()) {
    links.push({ label: link2LabelInput.value.trim() || "Link 2", url: link2UrlInput.value.trim() });
  }
  if (link3UrlInput.value.trim()) {
    links.push({ label: link3LabelInput.value.trim() || "Link 3", url: link3UrlInput.value.trim() });
  }

  const data = {
    displayName,
    bio,
    links,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, "users", currentUser.uid), data, { merge: true });
    currentProfile = { ...(currentProfile || {}), ...data };
    applyProfileToForm();
    alert("プロフィールを保存しました。");
  } catch (err) {
    console.error(err);
    alert("プロフィールの保存に失敗しました。");
  }
});

// ==============================
// 7. Firestore: 作品（records）
// ==============================

// 自分の作品を全部読み込み
async function loadUserRecords(uid) {
  userRecords = [];
  const q = query(collection(db, "records"), where("userId", "==", uid));
  const snap = await getDocs(q);
  snap.forEach(docSnap => {
    const data = docSnap.data();
    userRecords.push({
      id: docSnap.id,
      ...data,
    });
  });

  // createdAt で並び替え（新着順）
  userRecords.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
  refreshItemFilterOptions();
  renderRecordsGallery();
}

function refreshItemFilterOptions() {
  const set = new Set();
  userRecords.forEach(r => {
    if (r.itemType) set.add(r.itemType);
  });
  const currentVal = itemFilterSelect.value;
  itemFilterSelect.innerHTML = `<option value="ALL">すべて</option>`;
  [...set].sort().forEach(item => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    itemFilterSelect.appendChild(opt);
  });
  if ([...set, "ALL"].includes(currentVal)) {
    itemFilterSelect.value = currentVal;
  } else {
    itemFilterSelect.value = "ALL";
  }
}

function renderRecordsGallery() {
  recordsGallery.innerHTML = "";
  let filtered = userRecords.slice();

  const filterItem = itemFilterSelect.value;
  if (filterItem && filterItem !== "ALL") {
    filtered = filtered.filter(r => (r.itemType || "") === filterItem);
  }

  if (!filtered.length) {
    setHidden(recordsEmpty, false);
    return;
  } else {
    setHidden(recordsEmpty, true);
  }

  filtered.forEach(record => {
    const card = document.createElement("div");
    card.className = "thumb-card";

    if (record.photoData) {
      const img = document.createElement("img");
      img.src = record.photoData;
      img.className = "thumb-photo";
      card.appendChild(img);

      const label = document.createElement("div");
      label.className = "thumb-label";
      label.textContent = record.itemType || "(アイテム未記入)";
      card.appendChild(label);
    } else {
      const wrapper = document.createElement("div");
      wrapper.className = "thumb-text";

      const title = document.createElement("div");
      title.className = "thumb-text-title";
      title.textContent = record.itemType || "(アイテム未記入)";

      const body = document.createElement("div");
      body.className = "thumb-text-body";
      const yarnName = record.yarnName ? `毛糸：${record.yarnName}` : "";
      const memo = record.memo ? `メモ：${record.memo}` : "";
      body.textContent = [yarnName, memo].filter(Boolean).join(" / ");

      wrapper.appendChild(title);
      wrapper.appendChild(body);
      card.appendChild(wrapper);
    }

    // 将来的に詳細表示や編集に飛べるようにクリックイベントをここに追加してもOK
    recordsGallery.appendChild(card);
  });
}

itemFilterSelect.addEventListener("change", () => {
  renderRecordsGallery();
});

// 作品保存
saveRecordBtn.addEventListener("click", async () => {
  if (!currentUser) {
    alert("ログインしてください。");
    return;
  }

  const itemType = itemTypeInput.value.trim();
  const yarnName = yarnNameInput.value.trim();
  const ballsUsed = parseFloat(ballsUsedInput.value);
  const needleSize = needleSizeInput.value.trim();
  const startDate = startDateInput.value || null;
  const endDate = endDateInput.value || null;
  const memo = memoInput.value.trim();
  const photoFile = photoInput.files[0] || null;

  if (!itemType && !yarnName && !memo && !photoFile) {
    alert("少なくとも何か1つは入力してください（アイテム名・毛糸名・メモ・写真など）。");
    return;
  }

  saveRecordBtn.disabled = true;
  saveRecordBtn.textContent = "保存中...";

  try {
    const photoData = await readFileAsDataUrl(photoFile);

    const payload = {
      userId: currentUser.uid,
      itemType,
      yarnName,
      ballsUsed: isNaN(ballsUsed) ? null : ballsUsed,
      needleSize,
      startDate,
      endDate,
      memo,
      photoData: photoData || null,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "records"), payload);

    // フォームリセット
    itemTypeInput.value = "";
    yarnNameInput.value = "";
    ballsUsedInput.value = "";
    needleSizeInput.value = "";
    startDateInput.value = "";
    endDateInput.value = "";
    memoInput.value = "";
    photoInput.value = "";

    // 再読み込み
    await loadUserRecords(currentUser.uid);
    alert("作品を保存しました。");
  } catch (err) {
    console.error(err);
    alert("作品の保存に失敗しました。");
  } finally {
    saveRecordBtn.disabled = false;
    saveRecordBtn.textContent = "作品を保存";
  }
});

// ==============================
// 8. Firestore: 毛糸（yarns）
// ==============================

// 自分の毛糸を読み込み
async function loadUserYarns(uid) {
  userYarns = [];
  const q = query(collection(db, "yarns"), where("userId", "==", uid));
  const snap = await getDocs(q);
  snap.forEach(docSnap => {
    userYarns.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  // 名前順に並べる
  userYarns.sort((a, b) => safeText(a.yarnName).localeCompare(safeText(b.yarnName), "ja"));
  renderYarnTable();
}

function renderYarnTable() {
  yarnTableBody.innerHTML = "";
  let filtered = userYarns.slice();

  const nameFilter = yarnNameFilterInput.value.trim().toLowerCase();
  const colorFilter = colorCategoryFilterSelect.value;

  if (nameFilter) {
    filtered = filtered.filter(y =>
      safeText(y.yarnName).toLowerCase().includes(nameFilter)
    );
  }
  if (colorFilter && colorFilter !== "ALL") {
    filtered = filtered.filter(y => safeText(y.colorCategory) === colorFilter);
  }

  if (!filtered.length) {
    setHidden(yarnEmpty, false);
  } else {
    setHidden(yarnEmpty, true);
  }

  filtered.forEach(yarn => {
    const tr = document.createElement("tr");

    // 毛糸名（クリックでギャラリー）
    const tdName = document.createElement("td");
    const btn = document.createElement("button");
    btn.className = "yarn-link-btn";
    btn.textContent = yarn.yarnName || "(名称未設定)";
    btn.addEventListener("click", () => {
      openYarnModal(yarn);
    });
    tdName.appendChild(btn);

    // カラーカテゴリ
    const tdColorCate = document.createElement("td");
    tdColorCate.textContent = yarn.colorCategory || "";

    // カラーメモ
    const tdColorMemo = document.createElement("td");
    tdColorMemo.textContent = yarn.colorMemo || "";

    // 在庫
    const tdStock = document.createElement("td");
    tdStock.textContent = (yarn.stock ?? "") + (yarn.stock != null ? " 玉" : "");

    // 操作列は今のところなし
    const tdActions = document.createElement("td");

    tr.appendChild(tdName);
    tr.appendChild(tdColorCate);
    tr.appendChild(tdColorMemo);
    tr.appendChild(tdStock);
    tr.appendChild(tdActions);

    yarnTableBody.appendChild(tr);
  });
}

// 毛糸登録 / 更新
addYarnBtn.addEventListener("click", async () => {
  if (!currentUser) {
    alert("ログインしてください。");
    return;
  }

  const yarnName = yarnMasterNameInput.value.trim();
  const colorCategory = yarnColorCategoryInput.value || "";
  const colorMemo = yarnColorMemoInput.value.trim();
  const stockRaw = yarnStockInput.value;
  const stock = stockRaw === "" ? null : Number(stockRaw);

  if (!yarnName) {
    alert("毛糸名を入力してください。");
    return;
  }

  const docId = `${currentUser.uid}_${yarnName}`;

  const data = {
    userId: currentUser.uid,
    yarnName,
    colorCategory,
    colorMemo,
    stock,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, "yarns", docId), data, { merge: true });

    // 入力をそのまま残しておくか、クリアするかは好みだが、とりあえず毛糸名以外はクリア
    yarnColorCategoryInput.value = "";
    yarnColorMemoInput.value = "";
    yarnStockInput.value = "";

    await loadUserYarns(currentUser.uid);
    alert("毛糸を登録 / 更新しました。");
  } catch (err) {
    console.error(err);
    alert("毛糸の登録に失敗しました。");
  }
});

yarnNameFilterInput.addEventListener("input", () => {
  renderYarnTable();
});
colorCategoryFilterSelect.addEventListener("change", () => {
  renderYarnTable();
});

// ==============================
// 9. 毛糸ギャラリーモーダル
// ==============================

async function openYarnModal(yarn) {
  if (!currentUser) return;

  yarnModalTitle.textContent = yarn.yarnName || "(名称未設定)";
  yarnModalColorBadge.textContent = yarn.colorCategory || "";
  yarnModalInfo.textContent = yarn.colorMemo ? `メモ：${yarn.colorMemo}` : "";

  yarnMyGallery.innerHTML = "";
  yarnOthersGallery.innerHTML = "";
  setHidden(yarnMyEmpty, true);
  setHidden(yarnOthersEmpty, true);

  setHidden(yarnModal, false);

  try {
    // この毛糸名を使っている全レコードを取得
    const q = query(collection(db, "records"), where("yarnName", "==", yarn.yarnName));
    const snap = await getDocs(q);

    const myList = [];
    const othersList = [];

    snap.forEach(docSnap => {
      const data = {
        id: docSnap.id,
        ...docSnap.data(),
      };
      if (data.userId === currentUser.uid) {
        myList.push(data);
      } else {
        othersList.push(data);
      }
    });

    myList.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
    othersList.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));

    renderYarnModalList(yarnMyGallery, yarnMyEmpty, myList);
    renderYarnModalList(yarnOthersGallery, yarnOthersEmpty, othersList);
  } catch (err) {
    console.error(err);
    alert("毛糸ギャラリーの読み込みに失敗しました。");
  }
}

function renderYarnModalList(container, emptyEl, list) {
  container.innerHTML = "";
  if (!list.length) {
    setHidden(emptyEl, false);
    return;
  }
  setHidden(emptyEl, true);

  list.forEach(record => {
    const card = document.createElement("div");
    card.className = "thumb-card";

    if (record.photoData) {
      const img = document.createElement("img");
      img.src = record.photoData;
      img.className = "thumb-photo";
      card.appendChild(img);

      const label = document.createElement("div");
      label.className = "thumb-label";
      label.textContent = record.itemType || "(アイテム未記入)";
      card.appendChild(label);
    } else {
      const wrapper = document.createElement("div");
      wrapper.className = "thumb-text";
      const title = document.createElement("div");
      title.className = "thumb-text-title";
      title.textContent = record.itemType || "(アイテム未記入)";
      const body = document.createElement("div");
      body.className = "thumb-text-body";
      body.textContent = record.memo || "";
      wrapper.appendChild(title);
      wrapper.appendChild(body);
      card.appendChild(wrapper);
    }

    container.appendChild(card);
  });
}

closeYarnModalBtn.addEventListener("click", () => {
  setHidden(yarnModal, true);
});
yarnModal.addEventListener("click", (e) => {
  if (e.target === yarnModal) {
    setHidden(yarnModal, true);
  }
});

// ==============================
// 10. 検索（みんなの投稿）
// ==============================

async function searchRecords() {
  const queryText = searchQueryInput.value.trim().toLowerCase();
  if (!queryText) {
    alert("検索したいキーワードを入力してください。");
    return;
  }

  const searchType = document.querySelector('input[name="searchType"]:checked')?.value || "item";

  searchBtn.disabled = true;
  searchBtn.textContent = "検索中...";

  searchResultGallery.innerHTML = "";
  searchResultCount.textContent = "";
  setHidden(searchEmpty, true);

  try {
    // ※ 本格運用では条件付きクエリ＋インデックスが必要だけど、
    //   ここではサンプルとして「最新200件」を取得してローカルでフィルタする。
    const q = query(collection(db, "records"), limit(200));
    const snap = await getDocs(q);

    const matched = [];
    snap.forEach(docSnap => {
      const data = {
        id: docSnap.id,
        ...docSnap.data(),
      };

      // ※ 公開フラグ isPublic をつけたらここでチェックする想定
      const field = (searchType === "item" ? data.itemType : data.yarnName) || "";
      if (field.toLowerCase().includes(queryText)) {
        matched.push(data);
      }
    });

    matched.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));

    if (!matched.length) {
      setHidden(searchEmpty, false);
      searchResultCount.textContent = "0件";
      return;
    }

    searchResultCount.textContent = `${matched.length}件`;

    matched.forEach(record => {
      const card = document.createElement("div");
      card.className = "thumb-card";

      if (record.photoData) {
        const img = document.createElement("img");
        img.src = record.photoData;
        img.className = "thumb-photo";
        card.appendChild(img);

        const label = document.createElement("div");
        label.className = "thumb-label";
        const item = record.itemType || "(アイテム)";
        const yarn = record.yarnName || "";
        label.textContent = yarn ? `${item} / ${yarn}` : item;
        card.appendChild(label);
      } else {
        const wrapper = document.createElement("div");
        wrapper.className = "thumb-text";
        const title = document.createElement("div");
        title.className = "thumb-text-title";
        title.textContent = record.itemType || "(アイテム未記入)";
        const body = document.createElement("div");
        body.className = "thumb-text-body";
        body.textContent = record.memo || "";
        wrapper.appendChild(title);
        wrapper.appendChild(body);
        card.appendChild(wrapper);
      }

      searchResultGallery.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    alert("検索に失敗しました。");
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = "検索";
  }
}

searchBtn.addEventListener("click", () => {
  searchRecords();
});

// Enterキーでの検索
searchQueryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchRecords();
  }
});

// ==============================
// 11. ナビタブ切り替え
// ==============================

navTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    navTabs.forEach(t => t.classList.remove("nav-tab-active"));
    tab.classList.add("nav-tab-active");

    const view = tab.dataset.view;
    if (view === "mypage") {
      setHidden(myPageView, false);
      setHidden(searchView, true);
    } else if (view === "search") {
      setHidden(myPageView, true);
      setHidden(searchView, false);
    }
  });
});

// ==============================
// 12. onAuthStateChanged で初期ロード
// ==============================

onAuthStateChanged(auth, async (user) => {
  currentUser = user || null;
  renderHeaderUser(currentUser);
  updateAuthView(currentUser);

  if (!currentUser) {
    return;
  }

  try {
    // プロフィール・作品・毛糸 全部読む
    await loadUserProfile(currentUser.uid);
    await loadUserRecords(currentUser.uid);
    await loadUserYarns(currentUser.uid);
  } catch (err) {
    console.error(err);
    alert("データの読み込み中にエラーが発生しました。");
  }
});
