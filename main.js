// ===== IndexedDB の準備 =====
const DB_NAME = "amocaDB";
const STORE_NAME = "records";
let db = null;

// DB を開く（なければ作る）
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    req.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    req.onerror = () => reject(req.error);
  });
}

// 1件保存（新規 or 更新）
function saveRecordToDB(record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(record);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// 1件削除
function deleteRecordFromDB(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// 全件読み込み
function loadAllRecords() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// ===== ここから Amoca ロジック =====

let records = [];
let editingId = null;

// DOM取得
const yarnNameInput = document.getElementById("yarnName");
const colorNumberInput = document.getElementById("colorNumber");
const itemTypeInput = document.getElementById("itemType");
const ballsUsedInput = document.getElementById("ballsUsed");
const needleSizeInput = document.getElementById("needleSize");
const purchasePlaceInput = document.getElementById("purchasePlace");
const workHoursInput = document.getElementById("workHours");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const memoInput = document.getElementById("memo");
const photoInput = document.getElementById("photo");

const saveButton = document.getElementById("saveButton");
const listArea = document.getElementById("listArea");

const yarnFilter = document.getElementById("yarnFilter");
const itemFilter = document.getElementById("itemFilter");

// 初期化
document.addEventListener("DOMContentLoaded", async () => {
  await openDB();
  records = await loadAllRecords();
  renderFilters();
  renderList();

  saveButton.addEventListener("click", onSaveClick);
  yarnFilter.addEventListener("change", renderList);
  itemFilter.addEventListener("change", renderList);
});

// 画像圧縮
function compressImage(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;
          const canvas = document.createElement("canvas");
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 保存クリック
async function onSaveClick() {
  const baseData = {
    yarnName: yarnNameInput.value.trim(),
    colorNumber: colorNumberInput.value.trim(),
    itemType: itemTypeInput.value.trim(),
    ballsUsed: ballsUsedInput.value ? Number(ballsUsedInput.value) : null,
    needleSize: needleSizeInput.value.trim(),
    purchasePlace: purchasePlaceInput.value.trim(),
    workHours: workHoursInput.value ? Number(workHoursInput.value) : null,
    startDate: startDateInput.value,
    endDate: endDateInput.value,
    memo: memoInput.value.trim(),
  };

  if (!baseData.yarnName && !baseData.itemType) {
    alert("毛糸名か作品名のどちらかは入力してね🧶");
    return;
  }

  let photoData = null;

  const file = photoInput.files[0];

  if (file) {
    try {
      photoData = await compressImage(file, 700, 0.6); // 少し強めに圧縮
    } catch (e) {
      console.error(e);
      alert("写真の読み込みに失敗しました");
    }
  } else if (editingId != null) {
    const old = records.find((r) => r.id === editingId);
    if (old && old.photoData) photoData = old.photoData;
  }

  if (editingId != null) {
    // 編集
    const idx = records.findIndex((r) => r.id === editingId);
    if (idx >= 0) {
      records[idx] = { ...records[idx], ...baseData, photoData };
      await saveRecordToDB(records[idx]);
    }
    editingId = null;
  } else {
    // 新規
    const newRecord = {
      id: Date.now(),
      ...baseData,
      photoData,
      createdAt: new Date().toISOString(),
    };
    records.unshift(newRecord);
    await saveRecordToDB(newRecord);
  }

  clearForm();
  renderFilters();
  renderList();
}

// フォームクリア
function clearForm() {
  yarnNameInput.value = "";
  colorNumberInput.value = "";
  itemTypeInput.value = "";
  ballsUsedInput.value = "";
  needleSizeInput.value = "";
  purchasePlaceInput.value = "";
  workHoursInput.value = "";
  startDateInput.value = "";
  endDateInput.value = "";
  memoInput.value = "";
  photoInput.value = "";
  saveButton.textContent = "Save";
}

// リスト描画
function renderList() {
  listArea.innerHTML = "";

  let filtered = [...records];

  if (yarnFilter.value !== "ALL") {
    filtered = filtered.filter((r) => r.yarnName === yarnFilter.value);
  }
  if (itemFilter.value !== "ALL") {
    filtered = filtered.filter((r) => r.itemType === itemFilter.value);
  }

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "まだ記録がありません🧶";
    listArea.appendChild(empty);
    return;
  }

  filtered.forEach((r) => {
    const card = document.createElement("div");
    card.className = "entry-card";

    card.innerHTML = `
      <strong>${escapeHtml(r.itemType || "作品名")}</strong>
      <div class="entry-meta">
        ${escapeHtml(r.yarnName || "毛糸名未入力")} 
        ${r.colorNumber ? `（色：${escapeHtml(r.colorNumber)}）` : ""}
        ${formatDateRange(r.startDate, r.endDate)}
        ${r.workHours ? ` / ${r.workHours}時間` : ""}
      </div>
      <div class="entry-body">
        ${r.ballsUsed != null ? `<div><span class="label">玉数：</span>${r.ballsUsed}玉</div>` : ""}
        ${r.needleSize ? `<div><span class="label">針：</span>${escapeHtml(r.needleSize)}</div>` : ""}
        ${r.purchasePlace ? `<div><span class="label">購入先：</span>${escapeHtml(r.purchasePlace)}</div>` : ""}
        ${r.memo ? `<div><span class="label">メモ：</span>${escapeHtml(r.memo)}</div>` : ""}
      </div>
    `;

    if (r.photoData) {
      const img = document.createElement("img");
      img.src = r.photoData;
      img.className = "entry-photo";
      card.appendChild(img);
    }

    const actions = document.createElement("div");
    actions.className = "entry-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-edit";
    editBtn.textContent = "Edit";
    editBtn.onclick = () => startEdit(r.id);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteRecord(r.id);

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    listArea.appendChild(card);
  });
}

// 編集
function startEdit(id) {
  const r = records.find((x) => x.id === id);
  if (!r) return;

  editingId = id;
  yarnNameInput.value = r.yarnName || "";
  colorNumberInput.value = r.colorNumber || "";
  itemTypeInput.value = r.itemType || "";
  ballsUsedInput.value = r.ballsUsed || "";
  needleSizeInput.value = r.needleSize || "";
  purchasePlaceInput.value = r.purchasePlace || "";
  workHoursInput.value = r.workHours || "";
  startDateInput.value = r.startDate || "";
  endDateInput.value = r.endDate || "";
  memoInput.value = r.memo || "";

  saveButton.textContent = "Update";
  window.scrollTo(0, 0);
}

// 削除
async function deleteRecord(id) {
  if (!confirm("この記録を削除しますか？")) return;

  await deleteRecordFromDB(id);

  records = records.filter((r) => r.id !== id);
  renderFilters();
  renderList();
}

// フィルター更新
function renderFilters() {
  const yarnSet = new Set();
  const itemSet = new Set();

  records.forEach((r) => {
    if (r.yarnName) yarnSet.add(r.yarnName);
    if (r.itemType) itemSet.add(r.itemType);
  });

  // 毛糸フィルタ
  const currentYarn = yarnFilter.value;
  yarnFilter.innerHTML = '<option value="ALL">すべて</option>';
  [...yarnSet].forEach((y) => {
    yarnFilter.innerHTML += `<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`;
  });
  yarnFilter.value = currentYarn || "ALL";

  // 作品フィルタ
  const currentItem = itemFilter.value;
  itemFilter.innerHTML = '<option value="ALL">すべて</option>';
  [...itemSet].forEach((y) => {
    itemFilter.innerHTML += `<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`;
  });
  itemFilter.value = currentItem || "ALL";
}

// 日付範囲
function formatDateRange(start, end) {
  if (start && end) return ` / ${start}〜${end}`;
  if (start) return ` / ${start}〜`;
  if (end) return ` / 〜${end}`;
  return "";
}

// HTMLエスケープ
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
