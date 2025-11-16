// ===============================
// 1. Firebase の読み込み & 初期化
// ===============================
import {
  initializeApp,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ▼▼ KAZUNEちゃんのプロジェクト設定 ▼▼
const firebaseConfig = {
  apiKey: "AIzaSyDWmywzWr1lCjuSi51IAA-TQY1abNUNwhw",
  authDomain: "amoca-61391.firebaseapp.com",
  projectId: "amoca-61391",
  storageBucket: "amoca-61391.firebasestorage.app",
  messagingSenderId: "87355773454",
  appId: "1:87355773454:web:562901265f8e970090225f",
  measurementId: "G-RKHT3L59GS",
};
// ▲▲ ここまで ▲▲

// Firebase 初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ===============================
// 2. 共通ユーティリティ
// ===============================
function showAlert(message) {
  alert(message);
}

function safeQuery(id) {
  return document.getElementById(id) || null;
}

// ===============================
// 3. DOM 準備ができてから処理を開始
// ===============================
window.addEventListener("DOMContentLoaded", () => {
  // ===== ログイン関連 =====
  const emailInput = safeQuery("emailInput");       // メールアドレス
  const passwordInput = safeQuery("passwordInput"); // パスワード

  const emailSignUpBtn = safeQuery("emailSignUpBtn");
  const emailSignInBtn = safeQuery("emailSignInBtn");
  const googleSignInBtn = safeQuery("googleSignInBtn");
  const logoutBtn = safeQuery("logoutBtn");

  const loginSection = safeQuery("loginSection");   // ログインフォームを包んでいる要素
  const appSection = safeQuery("appSection");       // 編み物ノート本体を包んでいる要素
  const loginStatusLabel = safeQuery("loginStatus"); // 「〇〇でログイン中」など表示したいところ

  // ===== 編み物ノート関連 =====
  const yarnNameInput = safeQuery("yarnName");
  const colorNumberInput = safeQuery("colorNumber");
  const itemTypeInput = safeQuery("itemType");
  const ballsUsedInput = safeQuery("ballsUsed");
  const needleSizeInput = safeQuery("needleSize");
  const purchasePlaceInput = safeQuery("purchasePlace");
  const workHoursInput = safeQuery("workHours");
  const startDateInput = safeQuery("startDate");
  const endDateInput = safeQuery("endDate");
  const photoInput = safeQuery("photo");
  const memoInput = safeQuery("memo");
  const saveButton = safeQuery("saveButton");

  const listArea = safeQuery("listArea");
  const yarnFilterSelect = safeQuery("yarnFilter");
  const itemFilterSelect = safeQuery("itemFilter");

  // ===============================
  // 4. ノート保存まわりの状態管理
  // ===============================
  const STORAGE_PREFIX = "amoca_records_";
  let currentUser = null;    // Firebase のユーザー
  let records = [];          // いま画面で扱っているレコード一覧
  let editingId = null;      // 編集中のレコード id
  let yarnFilterValue = "ALL";
  let itemFilterValue = "ALL";

  function storageKeyForUser(user) {
    if (!user) return STORAGE_PREFIX + "guest";
    return STORAGE_PREFIX + user.uid;
  }

  function loadRecords() {
    const key = storageKeyForUser(currentUser);
    const raw = localStorage.getItem(key);
    if (!raw) {
      records = [];
    } else {
      try {
        records = JSON.parse(raw);
      } catch (e) {
        console.error("ローカルデータの読み込みに失敗:", e);
        records = [];
      }
    }
    renderFilters();
    renderRecords();
  }

  function saveRecords() {
    const key = storageKeyForUser(currentUser);
    localStorage.setItem(key, JSON.stringify(records));
  }

  // ===============================
  // 5. 画面切り替え
  // ===============================
  function updateAuthUI(user) {
    currentUser = user || null;

    if (loginStatusLabel) {
      if (currentUser) {
        const name = currentUser.displayName || currentUser.email || "ログイン中のユーザー";
        loginStatusLabel.textContent = `${name} としてログイン中`;
      } else {
        loginStatusLabel.textContent = "ログインしていません";
      }
    }

    if (loginSection) {
      loginSection.style.display = currentUser ? "none" : "block";
    }
    if (appSection) {
      appSection.style.display = currentUser ? "block" : "none";
    }

    // ユーザーが切り替わったら、ノートもその人のものを読み込む
    loadRecords();
  }

  // ===============================
  // 6. レコード表示・フィルタ
  // ===============================
  function renderFilters() {
    if (!yarnFilterSelect || !itemFilterSelect) return;

    // いったんクリア
    yarnFilterSelect.innerHTML = '<option value="ALL">すべて</option>';
    itemFilterSelect.innerHTML = '<option value="ALL">すべて</option>';

    const yarnSet = new Set();
    const itemSet = new Set();

    records.forEach((r) => {
      if (r.yarnName) yarnSet.add(r.yarnName);
      if (r.itemType) itemSet.add(r.itemType);
    });

    Array.from(yarnSet).sort().forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      yarnFilterSelect.appendChild(opt);
    });

    Array.from(itemSet).sort().forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      itemFilterSelect.appendChild(opt);
    });

    // 現在の選択値を維持できるように
    yarnFilterSelect.value = yarnFilterValue || "ALL";
    itemFilterSelect.value = itemFilterValue || "ALL";
  }

  function renderRecords() {
    if (!listArea) return;

    listArea.innerHTML = "";

    let filtered = records.slice().sort((a, b) => {
      // 新しいものが上に来るよう createdAt で降順
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    if (yarnFilterValue && yarnFilterValue !== "ALL") {
      filtered = filtered.filter((r) => r.yarnName === yarnFilterValue);
    }

    if (itemFilterValue && itemFilterValue !== "ALL") {
      filtered = filtered.filter((r) => r.itemType === itemFilterValue);
    }

    if (filtered.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "empty-state";
      emptyDiv.textContent = "まだ記録がありません。左のフォームから最初の作品を追加してみてね🧶";
      listArea.appendChild(emptyDiv);
      return;
    }

    filtered.forEach((record) => {
      const card = document.createElement("div");
      card.className = "entry-card";

      const title = document.createElement("strong");
      title.textContent = record.itemType || "(作品名未入力)";
      card.appendChild(title);

      const meta = document.createElement("div");
      meta.className = "entry-meta";
      const yarnText = record.yarnName ? `毛糸：${record.yarnName}` : "";
      const colorText = record.colorNumber ? `（色：${record.colorNumber}）` : "";
      const dateText =
        record.startDate || record.endDate
          ? ` / ${record.startDate || "??"} 〜 ${record.endDate || "??"}`
          : "";
      meta.textContent = `${yarnText}${colorText}${dateText}`;
      card.appendChild(meta);

      const body = document.createElement("div");
      body.className = "entry-body";
      const infoLines = [];

      if (record.ballsUsed) infoLines.push(`玉数：${record.ballsUsed}`);
      if (record.needleSize) infoLines.push(`針サイズ：${record.needleSize}`);
      if (record.purchasePlace) infoLines.push(`購入先：${record.purchasePlace}`);
      if (record.workHours) infoLines.push(`作業時間：${record.workHours} 時間`);

      if (infoLines.length > 0) {
        const infoP = document.createElement("p");
        infoP.textContent = infoLines.join(" / ");
        body.appendChild(infoP);
      }

      if (record.memo) {
        const memoP = document.createElement("p");
        const labelSpan = document.createElement("span");
        labelSpan.className = "label";
        labelSpan.textContent = "メモ：";
        memoP.appendChild(labelSpan);
        memoP.appendChild(document.createTextNode(record.memo));
        body.appendChild(memoP);
      }

      card.appendChild(body);

      if (record.photoDataUrl) {
        const img = document.createElement("img");
        img.className = "entry-photo";
        img.src = record.photoDataUrl;
        img.alt = record.itemType || "作品写真";
        card.appendChild(img);
      }

      const actions = document.createElement("div");
      actions.className = "entry-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-edit";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => startEdit(record.id));
      actions.appendChild(editBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-delete";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteRecord(record.id));
      actions.appendChild(deleteBtn);

      card.appendChild(actions);

      listArea.appendChild(card);
    });
  }

  // ===============================
  // 7. 新規保存・編集
  // ===============================
  function clearForm() {
    if (yarnNameInput) yarnNameInput.value = "";
    if (colorNumberInput) colorNumberInput.value = "";
    if (itemTypeInput) itemTypeInput.value = "";
    if (ballsUsedInput) ballsUsedInput.value = "";
    if (needleSizeInput) needleSizeInput.value = "";
    if (purchasePlaceInput) purchasePlaceInput.value = "";
    if (workHoursInput) workHoursInput.value = "";
    if (startDateInput) startDateInput.value = "";
    if (endDateInput) endDateInput.value = "";
    if (photoInput) photoInput.value = "";
    if (memoInput) memoInput.value = "";
    editingId = null;
  }

  function startEdit(id) {
    const r = records.find((rec) => rec.id === id);
    if (!r) return;
    editingId = id;

    if (yarnNameInput) yarnNameInput.value = r.yarnName || "";
    if (colorNumberInput) colorNumberInput.value = r.colorNumber || "";
    if (itemTypeInput) itemTypeInput.value = r.itemType || "";
    if (ballsUsedInput) ballsUsedInput.value = r.ballsUsed || "";
    if (needleSizeInput) needleSizeInput.value = r.needleSize || "";
    if (purchasePlaceInput) purchasePlaceInput.value = r.purchasePlace || "";
    if (workHoursInput) workHoursInput.value = r.workHours || "";
    if (startDateInput) startDateInput.value = r.startDate || "";
    if (endDateInput) endDateInput.value = r.endDate || "";
    if (memoInput) memoInput.value = r.memo || "";

    showAlert("この記録を編集モードで開きました。内容を修正して「Save」を押してね🧶");
  }

  function deleteRecord(id) {
    if (!confirm("この記録を本当に削除しますか？")) return;
    records = records.filter((r) => r.id !== id);
    saveRecords();
    renderFilters();
    renderRecords();
  }

  function handleSaveRecord(photoDataUrl = null) {
    const yarnName = yarnNameInput ? yarnNameInput.value.trim() : "";
    const colorNumber = colorNumberInput ? colorNumberInput.value.trim() : "";
    const itemType = itemTypeInput ? itemTypeInput.value.trim() : "";
    const ballsUsed = ballsUsedInput ? ballsUsedInput.value.trim() : "";
    const needleSize = needleSizeInput ? needleSizeInput.value.trim() : "";
    const purchasePlace = purchasePlaceInput ? purchasePlaceInput.value.trim() : "";
    const workHours = workHoursInput ? workHoursInput.value.trim() : "";
    const startDate = startDateInput ? startDateInput.value : "";
    const endDate = endDateInput ? endDateInput.value : "";
    const memo = memoInput ? memoInput.value.trim() : "";

    if (!itemType && !yarnName) {
      showAlert("少なくとも「編んだもの」か「毛糸の名前」を入力してね🧶");
      return;
    }

    const now = Date.now();

    if (editingId) {
      // 既存レコードを編集
      const idx = records.findIndex((r) => r.id === editingId);
      if (idx !== -1) {
        const original = records[idx];
        records[idx] = {
          ...original,
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
          // 新しく写真を選んだときだけ上書き
          photoDataUrl: photoDataUrl !== null ? photoDataUrl : original.photoDataUrl,
        };
      }
    } else {
      // 新規レコード
      const newRecord = {
        id: `rec_${now}`,
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
        photoDataUrl,
        createdAt: now,
      };
      records.push(newRecord);
    }

    saveRecords();
    renderFilters();
    renderRecords();
    clearForm();
  }

  function onClickSave() {
    if (!saveButton) return;

    // 写真付き or 写真なし で分岐
    const file = photoInput && photoInput.files && photoInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        handleSaveRecord(dataUrl);
      };
      reader.onerror = () => {
        console.error("画像の読み込みに失敗しました");
        showAlert("写真の読み込みに失敗しました。もう一度試してみてね💦");
      };
      reader.readAsDataURL(file);
    } else {
      handleSaveRecord(null);
    }
  }

  // ===============================
  // 8. ログイン処理
  // ===============================
  async function handleEmailSignUp() {
    if (!emailInput || !passwordInput) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showAlert("メールアドレスとパスワードを入力してね🧵");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showAlert("新規登録が完了しました！そのままログイン済みの状態になります🤍");
    } catch (err) {
      console.error(err);
      let msg = "新規登録に失敗しました。入力内容を確認してね。";
      if (err.code === "auth/email-already-in-use") {
        msg = "このメールアドレスはすでに登録されています。ログインを試してみてね。";
      } else if (err.code === "auth/weak-password") {
        msg = "パスワードが弱すぎます。もう少し長く複雑なものにしてみてね。";
      }
      showAlert(msg);
    }
  }

  async function handleEmailSignIn() {
    if (!emailInput || !passwordInput) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showAlert("メールアドレスとパスワードを入力してね🧵");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showAlert("ログインしました🧶");
    } catch (err) {
      console.error(err);
      let msg = "ログインに失敗しました。メールアドレスとパスワードを確認してね。";
      if (err.code === "auth/wrong-password") {
        msg = "パスワードが違います。";
      } else if (err.code === "auth/user-not-found") {
        msg = "このメールアドレスのユーザーが見つかりません。";
      }
      showAlert(msg);
    }
  }

  async function handleGoogleSignIn() {
    try {
      await signInWithPopup(auth, googleProvider);
      showAlert("Googleでログインしました☕️");
    } catch (err) {
      console.error(err);
      showAlert("Googleログインに失敗しました。ポップアップブロックなどを確認してね。");
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);
      showAlert("ログアウトしました。またいつでも戻ってきてね🧶");
    } catch (err) {
      console.error(err);
      showAlert("ログアウトに失敗しました。少し時間をおいて再度お試しください。");
    }
  }

  // ===============================
  // 9. イベントリスナー登録
  // ===============================

  // ログインボタン
  if (emailSignUpBtn) {
    emailSignUpBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleEmailSignUp();
    });
  }

  if (emailSignInBtn) {
    emailSignInBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleEmailSignIn();
    });
  }

  if (googleSignInBtn) {
    googleSignInBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleGoogleSignIn();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogout();
    });
  }

  // ノート保存
  if (saveButton) {
    saveButton.addEventListener("click", (e) => {
      e.preventDefault();
      onClickSave();
    });
  }

  // フィルタ
  if (yarnFilterSelect) {
    yarnFilterSelect.addEventListener("change", () => {
      yarnFilterValue = yarnFilterSelect.value;
      renderRecords();
    });
  }

  if (itemFilterSelect) {
    itemFilterSelect.addEventListener("change", () => {
      itemFilterValue = itemFilterSelect.value;
      renderRecords();
    });
  }

  // ===============================
  // 10. Firebase Auth 状態監視スタート
  // ===============================
  onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user);
    updateAuthUI(user);
  });
});