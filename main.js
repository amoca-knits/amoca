// =============================
// Amoca knit note main.js
// Firebase 認証 + 既存ノート機能（ローカル保存）
// =============================

// --- 1. Firebase SDK 読み込み --------------------
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPopup,
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

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

const emailSignInBtn = document.getElementById("emailSignInBtn");
const emailSignUpBtn = document.getElementById("emailSignUpBtn");
const googleSignInBtn = document.getElementById("googleSignInBtn");

// ログイン後に使う予定（今はとりあえず表示だけ）
const loginStatusEl = document.getElementById("loginStatus");

// もし既存の編み物ノートのフォームが同じページにあるなら取得
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

// フィルター（存在すれば使う）
const yarnFilterSelect = document.getElementById("yarnFilter");
const itemFilterSelect = document.getElementById("itemFilter");

// =============================
//  4. ログイン状態の監視
// =============================

onAuthStateChanged(auth, (user) => {
  if (user) {
    const msg = `ログイン中：${user.email || "Google アカウント"}`;
    console.log(msg);
    if (loginStatusEl) {
      loginStatusEl.textContent = msg;
    }
  } else {
    console.log("ログアウト状態です");
    if (loginStatusEl) {
      loginStatusEl.textContent = "ログインしていません";
    }
  }
});

// =============================
//  5. ボタンのイベント設定
// =============================

// ユーティリティ：入力チェック用
function getEmailAndPassword() {
  const email = emailInput?.value.trim();
  const password = passwordInput?.value;

  if (!email || !password) {
    alert("メールアドレスとパスワードを入力してね🧶");
    return null;
  }
  if (password.length < 6) {
    alert("パスワードは 6 文字以上にしてね");
    return null;
  }
  return { email, password };
}



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
emailSignInBtn.addEventListener("click", async () => {
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

    // TODO: ここで画面遷移（後で作る）
  } catch (error) {
    alert("ログインエラー：" + error.message);
  }
});

// ===============================
// Email 新規登録
// ===============================
emailSignUpBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert("メールアドレスとパスワードを入力してね🧶");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    alert("新規登録成功！ユーザーID：" + user.uid);
    
  } catch (error) {
    alert("新規登録エラー：" + error.message);
  }
});
// （必要になったらログアウトボタンも繋げられるように関数だけ用意）
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
//  6. 編み物ノート（ローカル保存版）
//     ※ ここは、これまで PC で動いていた内容のシンプル版
// =============================

let records = [];

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
    div.textContent = "まだ記録がありません。左のフォームから最初の作品を追加してみてね🧶";
    listArea.appendChild(div);
    return;
  }

  // フィルター
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
    title.innerHTML = `<strong>${rec.itemType || "作品"}</strong>  /  ${rec.yarnName || ""}`;
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

  // フィルター用セレクトの中身更新
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
  yarnNameInput && (yarnNameInput.value = "");
  colorNumberInput && (colorNumberInput.value = "");
  itemTypeInput && (itemTypeInput.value = "");
  ballsUsedInput && (ballsUsedInput.value = "");
  needleSizeInput && (needleSizeInput.value = "");
  purchasePlaceInput && (purchasePlaceInput.value = "");
  workHoursInput && (workHoursInput.value = "");
  startDateInput && (startDateInput.value = "");
  endDateInput && (endDateInput.value = "");
  memoInput && (memoInput.value = "");
  if (photoInput) photoInput.value = "";
}

// =============================
//  7. 初期化
// =============================

function init() {
  // ローカルの記録を読み込んで表示
  loadRecords();
  renderRecords();

  // 保存ボタン
  if (saveButton) {
    saveButton.addEventListener("click", (e) => {
      e.preventDefault();
      handleSaveRecord();
    });
  }

  // フィルター
  if (yarnFilterSelect) {
    yarnFilterSelect.addEventListener("change", renderRecords);
  }
  if (itemFilterSelect) {
    itemFilterSelect.addEventListener("change", renderRecords);
  }
}

document.addEventListener("DOMContentLoaded", init);