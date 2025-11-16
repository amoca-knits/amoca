// =============================
// Amoca knit note main.js
// Firebase 認証 + 既存ノート機能（ローカル保存）
// =============================

// --- 1. Firebase SDK 読み込み --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// --- 2. Firebase 設定（KAZUNE さんのプロジェクト） ---
const firebaseConfig = {
  apiKey: "AIzaSyDWmywzWr1lCjuSi51IAA-TQY1abNUNwhw",
  authDomain: "amoca-61391.firebaseapp.com",
  projectId: "amoca-61391",
  storageBucket: "amoca-61391.firebasestorage.app",
  messagingSenderId: "87355773454",
  appId: "1:87355773454:web:562901265f8e970090225f",
  measurementId: "G-RKHT3L59GS"
};

// Firebase 初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// =============================
//  3. 画面の要素を取得
// =============================
// 画面ビュー
const authView = document.getElementById("authView"); // ログインフォーム側
const appView = document.getElementById("appView");   // ログイン後の画面

// ヘッダーのユーザー名表示・ログアウト
const userDisplayNameEl = document.getElementById("userDisplayName");
const signOutBtn = document.getElementById("signOutBtn");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

const emailSignInBtn = document.getElementById("emailSignInBtn");
const emailSignUpBtn = document.getElementById("emailSignUpBtn");
const googleSignInBtn = document.getElementById("googleSignInBtn");

// ログイン後に使う予定（今はとりあえず表示だけ）
const loginStatusEl = document.getElementById("loginStatus");

// 既存の編み物ノートのフォーム
const yarnNameInput = document.getElementById("yarnName");
const colorNumberInput = document.getElementById("colorNumber");
const itemTypeInput = document.getElementById("itemType");
const ballsUsedInput = document.getElementById("ballsUsed");
const needleSizeInput = document.getElementById("needleSize");
const purchasePlaceInput = document.getElementById("purchasePlace");
const workHoursInput = document.getElementById("workHours");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const photoInput = document.getElementById("photo");
const memoInput = document.getElementById("memo");
const saveButton = document.getElementById("saveButton");
const listArea = document.getElementById("listArea");

// フィルター
const yarnFilterSelect = document.getElementById("yarnFilter");
const itemFilterSelect = document.getElementById("itemFilter");

// =============================
//  4. ログイン状態の監視
// =============================

onAuthStateChanged(auth, (user) => {
  if (user) {
    // ログイン中
    const name = user.displayName || user.email || "ゲスト";
    console.log("ログイン中：", name);

    if (loginStatusEl) {
      loginStatusEl.textContent = `ログイン中：${name}`;
    }
    if (userDisplayNameEl) {
      userDisplayNameEl.textContent = name;
    }

    // 画面切り替え
    if (authView) authView.style.display = "none";
    if (appView) appView.style.display = "block";
    loadProfile(user.uid, user);

  } else {
    console.log("ログアウト状態です");
    if (loginStatusEl) {
      loginStatusEl.textContent = "ログインしていません";
    }
    if (ownerNameEl) ownerNameEl.textContent = "ゲスト";
  }
});
  

    if (authView) authView.style.display = "block";
    if (appView) appView.style.display = "none";

// =============================
//  5. 認証ボタンのイベント
// =============================

// Google でログイン
if (googleSignInBtn) {
  googleSignInBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      alert(`Google ログイン完了！\n${result.user.displayName || "ユーザー"}`);
    } catch (err) {
      console.error(err);
      alert("Google ログインに失敗しました：\n" + (err.message || err.code));
    }
  });
}
// ===============================
// Email / Password ログイン
// ===============================
if (emailSignInBtn) {
  emailSignInBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    // 入力値をまとめてチェック
    if (!emailInput || !passwordInput) {
      alert("内部エラー：入力欄が見つかりません💦");
      console.error("emailInput / passwordInput が null です");
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してね🧶");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      alert("ログイン成功！ユーザーID：" + user.uid);
    } catch (error) {
      console.error(error);
      alert("ログインエラー：" + error.message);
    }
  });
}

// ===============================
// Email 新規登録
// ===============================
if (emailSignUpBtn) {
  emailSignUpBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!emailInput || !passwordInput) {
      alert("内部エラー：入力欄が見つかりません💦");
      console.error("emailInput / passwordInput が null です");
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してね🧶");
      return;
    }
    if (password.length < 6) {
      alert("パスワードは 6 文字以上にしてね");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      alert("新規登録成功！ユーザーID：" + user.uid);
    } catch (error) {
      console.error(error);
      alert("新規登録エラー：" + error.message);
    }
  });
}

// （必要になったらボタンとつなげる用のログアウト関数）
async function handleSignOut() {
  try {
    await signOut(auth);
    alert("ログアウトしました");
  } catch (err) {
    console.error(err);
    alert("ログアウトに失敗しました：\n" + (err.message || err.code));
  }
}
// =============================
//  プロフィール（ローカル保存）
// =============================
function profileKey(uid) {
  return `amocaProfile_${uid}`;
}

function applyOwnerName(profile, user) {
  const fallback =
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "あなた");

  if (ownerNameEl) {
    ownerNameEl.textContent = profile?.name || fallback;
  }
}

function loadProfile(uid, user) {
  if (!uid) return;
  try {
    const raw = localStorage.getItem(profileKey(uid));
    const profile = raw ? JSON.parse(raw) : {};

    if (profileNameInput) profileNameInput.value = profile.name || "";
    if (profileBioInput) profileBioInput.value = profile.bio || "";

    if (link1TitleInput) link1TitleInput.value = profile.link1Title || "";
    if (link1UrlInput) link1UrlInput.value = profile.link1Url || "";
    if (link2TitleInput) link2TitleInput.value = profile.link2Title || "";
    if (link2UrlInput) link2UrlInput.value = profile.link2Url || "";
    if (link3TitleInput) link3TitleInput.value = profile.link3Title || "";
    if (link3UrlInput) link3UrlInput.value = profile.link3Url || "";

    applyOwnerName(profile, user);
  } catch (e) {
    console.error("loadProfile error", e);
    applyOwnerName(null, user);
  }
}
// =============================
//  プロフィール（ローカル保存）
// =============================
function profileKey(uid) {
  return `amocaProfile_${uid}`;
}

function applyOwnerName(profile, user) {
  const fallback =
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "あなた");

  if (ownerNameEl) {
    ownerNameEl.textContent = profile?.name || fallback;
  }
}

function loadProfile(uid, user) {
  if (!uid) return;
  try {
    const raw = localStorage.getItem(profileKey(uid));
    const profile = raw ? JSON.parse(raw) : {};

    if (profileNameInput) profileNameInput.value = profile.name || "";
    if (profileBioInput) profileBioInput.value = profile.bio || "";

    if (link1TitleInput) link1TitleInput.value = profile.link1Title || "";
    if (link1UrlInput) link1UrlInput.value = profile.link1Url || "";
    if (link2TitleInput) link2TitleInput.value = profile.link2Title || "";
    if (link2UrlInput) link2UrlInput.value = profile.link2Url || "";
    if (link3TitleInput) link3TitleInput.value = profile.link3Title || "";
    if (link3UrlInput) link3UrlInput.value = profile.link3Url || "";

    applyOwnerName(profile, user);
  } catch (e) {
    console.error("loadProfile error", e);
    applyOwnerName(null, user);
  }
}
// --- プロフィール関連 ---
const ownerNameEl = document.getElementById("ownerName");
const profileNameInput = document.getElementById("profileName");
const profileBioInput = document.getElementById("profileBio");
const link1TitleInput = document.getElementById("link1Title");
const link1UrlInput = document.getElementById("link1Url");
const link2TitleInput = document.getElementById("link2Title");
const link2UrlInput = document.getElementById("link2Url");
const link3TitleInput = document.getElementById("link3Title");
const link3UrlInput = document.getElementById("link3Url");
const profileSaveBtn = document.getEleme

function saveProfile(uid, user) {
  if (!uid) return;

  const profile = {
    name: profileNameInput?.value.trim() || "",
    bio: profileBioInput?.value.trim() || "",
    link1Title: link1TitleInput?.value.trim() || "",
    link1Url: link1UrlInput?.value.trim() || "",
    link2Title: link2TitleInput?.value.trim() || "",
    link2Url: link2UrlInput?.value.trim() || "",
    link3Title: link3TitleInput?.value.trim() || "",
    link3Url: link3UrlInput?.value.trim() || ""
  };

  try {
    localStorage.setItem(profileKey(uid), JSON.stringify(profile));
    applyOwnerName(profile, user);
    alert("プロフィールを保存しました🧶");
  } catch (e) {
    console.error("saveProfile error", e);
    alert("プロフィールの保存に失敗しちゃいました…");
  }

// =============================
//  6. 編み物ノート（ローカル保存）
// =============================

let records = [];
let editingRecordId = null; // いま編集中の記録の id（なければ null）
    // ---- ここから追加：編集・削除ボタン ----
    const actions = document.createElement("div");
    actions.className = "entry-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "編集";
    editBtn.className = "btn btn-sm";
    editBtn.addEventListener("click", () => {
      startEditRecord(rec.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "削除";
    deleteBtn.className = "btn btn-sm btn-outline";
    deleteBtn.addEventListener("click", () => {
      deleteRecord(rec.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);
    // ---- 追加ここまで ----

// ローカルストレージから読み込み
function loadRecords() {
  try {
    const raw = localStorage.getItem("amocaRecords");
    records = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadRecords error", e);
    records = [];
  }
}

// ローカルストレージへ保存
function saveRecords() {
  try {
    localStorage.setItem("amocaRecords", JSON.stringify(records));
  } catch (e) {
    console.error("saveRecords error", e);
  }
}

// 一覧を描画
function renderRecords() {
  if (!listArea) return;

  listArea.innerHTML = "";

  if (!records.length) {
    const div = document.createElement("div");
    div.className = "empty-state";
    div.textContent =
      "まだ記録がありません。左のフォームから最初の作品を追加してみてね🧶";
    listArea.appendChild(div);
    return;
  }

  const yarnFilter = yarnFilterSelect?.value || "ALL";
  const itemFilter = itemFilterSelect?.value || "ALL";

  const filtered = records.filter((r) => {
    if (yarnFilter !== "ALL" && r.yarnName !== yarnFilter) return false;
    if (itemFilter !== "ALL" && r.itemType !== itemFilter) return false;
    return true;
  });

  filtered.forEach((rec) => {
    const card = document.createElement("div");
    card.className = "entry-card";

    const title = document.createElement("div");
    title.innerHTML = `<strong>${rec.itemType || "作品"}</strong> / ${rec.yarnName || ""}`;
    card.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "entry-meta";
    meta.textContent =
      (rec.colorNumber ? `色番: ${rec.colorNumber}  ` : "") +
      (rec.workHours ? `作業時間: ${rec.workHours}h  ` : "") +
      (rec.ballsUsed ? `玉数: ${rec.ballsUsed}` : "");
    card.appendChild(meta);

    if (rec.photoDataUrl) {
      const img = document.createElement("img");
      img.src = rec.photoDataUrl;
      img.alt = "作品写真";
      img.className = "entry-photo";
      card.appendChild(img);
    }

    if (rec.memo) {
      const memo = document.createElement("div");
      memo.className = "entry-body";
      memo.innerHTML = `<span class="label">メモ：</span>${rec.memo}`;
      card.appendChild(memo);
    }

    listArea.appendChild(card);
  });

  updateFilterOptions();
}

// フィルターセレクトの選択肢更新
function updateFilterOptions() {
  if (!yarnFilterSelect || !itemFilterSelect) return;

  const yarnNames = Array.from(new Set(records.map((r) => r.yarnName).filter(Boolean)));
  const itemTypes = Array.from(new Set(records.map((r) => r.itemType).filter(Boolean)));

  yarnFilterSelect.innerHTML = '<option value="ALL">すべて</option>';
  itemFilterSelect.innerHTML = '<option value="ALL">すべて</option>';

  yarnNames.forEach((name) => {
    const op = document.createElement("option");
    op.value = name;
    op.textContent = name;
    yarnFilterSelect.appendChild(op);
  });

  itemTypes.forEach((name) => {
    const op = document.createElement("option");
    op.value = name;
    op.textContent = name;
    itemFilterSelect.appendChild(op);
  });
}

// 新しい記録を追加
function handleSaveRecord() {
    // 記録の編集を開始（フォームに値を入れる）
function startEditRecord(id) {
  const target = records.find((r) => r.id === id);
  if (!target) return;

  editingRecordId = id;

  if (yarnNameInput) yarnNameInput.value = target.yarnName || "";
  if (colorNumberInput) colorNumberInput.value = target.colorNumber || "";
  if (itemTypeInput) itemTypeInput.value = target.itemType || "";
  if (ballsUsedInput) ballsUsedInput.value = target.ballsUsed || "";
  if (needleSizeInput) needleSizeInput.value = target.needleSize || "";
  if (purchasePlaceInput) purchasePlaceInput.value = target.purchasePlace || "";
  if (workHoursInput) workHoursInput.value = target.workHours || "";
  if (startDateInput) startDateInput.value = target.startDate || "";
  if (endDateInput) endDateInput.value = target.endDate || "";
  if (memoInput) memoInput.value = target.memo || "";

  // 一番上のフォームまでスクロール（お好みで）
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 記録の削除
function deleteRecord(id) {
  if (!confirm("この記録を削除してもいい？")) return;

  records = records.filter((r) => r.id !== id);
  saveRecords();
  renderRecords();

  if (editingRecordId === id) {
    editingRecordId = null;
    resetForm();
  }
}
  if (!yarnNameInput || !itemTypeInput || !ballsUsedInput) return;

  const yarnName = yarnNameInput.value.trim();
  const colorNumber = colorNumberInput?.value.trim() || "";
  const itemType = itemTypeInput.value.trim();
  const ballsUsed = ballsUsedInput.value;
  const needleSize = needleSizeInput?.value.trim() || "";
  const purchasePlace = purchasePlaceInput?.value.trim() || "";
  const workHours = workHoursInput?.value || "";
  const startDate = startDateInput?.value || "";
  const endDate = endDateInput?.value || "";
  const memo = memoInput?.value.trim() || "";

  if (!yarnName || !itemType) {
    alert("毛糸の名前と編んだものは入力してね🧶");
    return;
  }

  const newRecord = {
    id: Date.now(),
    yarnName,
    colorNumber,
    itemType,
    ballsUsed,
    needleSize,
    purchasePlace,
    workHours,
    startDate,
    endDate,
    memo,
    photoDataUrl: null
  };

  const file = photoInput?.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      newRecord.photoDataUrl = reader.result;
      records.unshift(newRecord);
      saveRecords();
      renderRecords();
      resetForm();
    };
    reader.readAsDataURL(file);
  } else {
    records.unshift(newRecord);
    saveRecords();
    renderRecords();
    resetForm();
  }
}

// フォームのリセット
function resetForm() {
  if (yarnNameInput) yarnNameInput.value = "";
  if (colorNumberInput) colorNumberInput.value = "";
  if (itemTypeInput) itemTypeInput.value = "";
  if (ballsUsedInput) ballsUsedInput.value = "";
  if (needleSizeInput) needleSizeInput.value = "";
  if (purchasePlaceInput) purchasePlaceInput.value = "";
  if (workHoursInput) workHoursInput.value = "";
  if (startDateInput) startDateInput.value = "";
  if (endDateInput) endDateInput.value = "";
  if (memoInput) memoInput.value = "";
  if (photoInput) photoInput.value = "";
}

// =============================
//  7. 初期化
// =============================

function init() {
    if (profileSaveBtn) {
  profileSaveBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      alert("ログインしてからプロフィールを保存してね🧶");
      return;
    }
    saveProfile(user.uid, user);
  });
}
      // ログアウトボタン
  if (signOutBtn) {
    signOutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleSignOut();
    });
  }
  loadRecords();
  renderRecords();

  if (saveButton) {
    saveButton.addEventListener("click", (e) => {
      e.preventDefault();
      handleSaveRecord();
    });
  }

  if (yarnFilterSelect) {
    yarnFilterSelect.addEventListener("change", renderRecords);
  }
  if (itemFilterSelect) {
    itemFilterSelect.addEventListener("change", renderRecords);
  }
}

document.addEventListener("DOMContentLoaded", init);