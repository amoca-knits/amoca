// Amoca knit note main.js

const STORAGE_KEY = "amocaRecords";

let records = [];
let editingId = null;

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

const yarnFilter = document.getElementById("yarnFilter");
const itemFilter = document.getElementById("itemFilter");

document.addEventListener("DOMContentLoaded", () => {
  loadRecords();
  saveButton.addEventListener("click", onSaveClick);
  yarnFilter.addEventListener("change", renderList);
  itemFilter.addEventListener("change", renderList);
});

function loadRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    records = [];
    renderFilters();
    renderList();
    return;
  }
  try {
    records = JSON.parse(raw) || [];
  } catch (e) {
    console.error("failed to parse storage", e);
    records = [];
  }
  renderFilters();
  renderList();
}

function persistRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error(e);
    alert(
      "保存容量の上限を超えました。\n古い写真付きの記録をいくつか削除するか、もう少し小さいサイズの写真で試してみてください。"
    );
  }
}

function onSaveClick() {
  const baseData = {
    yarnName: yarnNameInput.value.trim(),
    colorNumber: colorNumberInput.value.trim(),
    itemType: itemTypeInput.value.trim(),
    ballsUsed: ballsUsedInput.value ? Number(ballsUsedInput.value) : null,
    needleSize: needleSizeInput.value.trim(),
    purchasePlace: purchasePlaceInput.value.trim(),
    workHours: workHoursInput.value ? Number(workHoursInput.value) : null,
    startDate: startDateInput.value || "",
    endDate: endDateInput.value || "",
    memo: memoInput.value.trim()
  };

  if (!baseData.yarnName && !baseData.itemType) {
    alert("少なくとも「毛糸の名前」か「編んだもの」を入力してね🧶");
    return;
  }

  const existingPhoto =
    editingId != null
      ? (records.find((r) => r.id === editingId) || {}).photoData || null
      : null;

  const file = photoInput.files[0];

  if (file) {
    // 新しい写真が選ばれている → 圧縮してから保存
    compressImage(file, 900, 0.7, (compressedDataUrl) => {
      finishSave(baseData, compressedDataUrl);
    }, () => {
      // 圧縮に失敗した場合は写真なしで保存
      finishSave(baseData, existingPhoto);
    });
  } else {
    // 写真変更なし（編集時は既存を引き継ぐ）
    finishSave(baseData, existingPhoto);
  }
}

function finishSave(baseData, photoDataUrl) {
  if (editingId != null) {
    // 編集モード
    const idx = records.findIndex((r) => r.id === editingId);
    if (idx >= 0) {
      records[idx] = {
        ...records[idx],
        ...baseData,
        photoData: photoDataUrl || null
      };
    }
    editingId = null;
  } else {
    // 新規追加
    const newRecord = {
      id: Date.now(),
      ...baseData,
      photoData: photoDataUrl || null,
      createdAt: new Date().toISOString()
    };
    records.unshift(newRecord);
  }

  persistRecords();
  clearForm();
  renderFilters();
  renderList();
}

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
  editingId = null;
  saveButton.textContent = "Save";
}

// 画像圧縮用ヘルパー
function compressImage(file, maxWidth, quality, onSuccess, onError) {
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
        onSuccess(dataUrl);
      } catch (err) {
        console.error(err);
        alert("画像の読み込み・圧縮に失敗しました。別の写真で試してみてください。");
        if (onError) onError();
      }
    };
    img.onerror = () => {
      alert("画像の読み込みに失敗しました。別の写真で試してみてください。");
      if (onError) onError();
    };
    img.src = e.target.result;
  };
  reader.onerror = () => {
    alert("画像の読み込みに失敗しました。別の写真で試してみてください。");
    if (onError) onError();
  };
  reader.readAsDataURL(file);
}

// 絞り込み用のセレクトを更新
function renderFilters() {
  const yarnSet = new Set();
  const itemSet = new Set();

  records.forEach((r) => {
    if (r.yarnName) yarnSet.add(r.yarnName);
    if (r.itemType) itemSet.add(r.itemType);
  });

  // 毛糸フィルタ
  const yarnCurrent = yarnFilter.value || "ALL";
  yarnFilter.innerHTML = "";
  const optAllY = document.createElement("option");
  optAllY.value = "ALL";
  optAllY.textContent = "すべて";
  yarnFilter.appendChild(optAllY);
  Array.from(yarnSet).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    yarnFilter.appendChild(opt);
  });
  yarnFilter.value = yarnCurrent;

  // 作品フィルタ
  const itemCurrent = itemFilter.value || "ALL";
  itemFilter.innerHTML = "";
  const optAllI = document.createElement("option");
  optAllI.value = "ALL";
  optAllI.textContent = "すべて";
  itemFilter.appendChild(optAllI);
  Array.from(itemSet).forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    itemFilter.appendChild(opt);
  });
  itemFilter.value = itemCurrent;
}

function renderList() {
  listArea.innerHTML = "";

  let filtered = [...records];

  const yarnValue = yarnFilter.value;
  const itemValue = itemFilter.value;

  if (yarnValue && yarnValue !== "ALL") {
    filtered = filtered.filter((r) => r.yarnName === yarnValue);
  }
  if (itemValue && itemValue !== "ALL") {
    filtered = filtered.filter((r) => r.itemType === itemValue);
  }

  if (filtered.length === 0) {
    const div = document.createElement("div");
    div.className = "empty-state";
    div.textContent =
      "まだ記録がありません。左のフォームから最初の作品を追加してみてね🧶";
    listArea.appendChild(div);
    return;
  }

  filtered.forEach((r) => {
    const card = document.createElement("div");
    card.className = "entry-card";

    const title = document.createElement("div");
    title.innerHTML = `<strong>${escapeHtml(
      r.itemType || "作品名未入力"
    )}</strong>`;

    const meta = document.createElement("div");
    meta.className = "entry-meta";

    const yarnText = r.yarnName ? r.yarnName : "毛糸名未入力";
    const colorText = r.colorNumber ? `（色：${r.colorNumber}）` : "";
    const dateText =
      r.startDate || r.endDate
        ? ` / ${formatDateRange(r.startDate, r.endDate)}`
        : "";

    let workText = "";
    if (r.workHours != null && !isNaN(r.workHours)) {
      workText = ` / 作業時間：約${r.workHours}時間`;
    }

    meta.textContent = `${yarnText}${colorText}${dateText}${workText}`;

    const body = document.createElement("div");
    body.className = "entry-body";

    if (r.ballsUsed != null && !isNaN(r.ballsUsed)) {
      const spanBalls = document.createElement("div");
      spanBalls.innerHTML = `<span class="label">使った玉数：</span>${r.ballsUsed}玉`;
      body.appendChild(spanBalls);
    }

    if (r.needleSize) {
      const spanNeedle = document.createElement("div");
      spanNeedle.innerHTML = `<span class="label">針サイズ：</span>${escapeHtml(
        r.needleSize
      )}`;
      body.appendChild(spanNeedle);
    }

    if (r.purchasePlace) {
      const spanPlace = document.createElement("div");
      spanPlace.innerHTML = `<span class="label">購入先：</span>${escapeHtml(
        r.purchasePlace
      )}`;
      body.appendChild(spanPlace);
    }

    if (r.memo) {
      const spanMemo = document.createElement("div");
      spanMemo.innerHTML = `<span class="label">メモ：</span>${escapeHtml(
        r.memo
      )}`;
      body.appendChild(spanMemo);
    }

    if (r.photoData) {
      const img = document.createElement("img");
      img.src = r.photoData;
      img.alt = "作品写真";
      img.className = "entry-photo";
      card.appendChild(img);
    }

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(body);

    const actions = document.createElement("div");
    actions.className = "entry-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-edit";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => startEdit(r.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteRecord(r.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(actions);
    listArea.appendChild(card);
  });
}

function startEdit(id) {
  const r = records.find((x) => x.id === id);
  if (!r) return;
  editingId = id;

  yarnNameInput.value = r.yarnName || "";
  colorNumberInput.value = r.colorNumber || "";
  itemTypeInput.value = r.itemType || "";
  ballsUsedInput.value = r.ballsUsed != null ? r.ballsUsed : "";
  needleSizeInput.value = r.needleSize || "";
  purchasePlaceInput.value = r.purchasePlace || "";
  workHoursInput.value = r.workHours != null ? r.workHours : "";
  startDateInput.value = r.startDate || "";
  endDateInput.value = r.endDate || "";
  memoInput.value = r.memo || "";
  photoInput.value = ""; // 既存写真はそのまま

  saveButton.textContent = "Update";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteRecord(id) {
  if (!window.confirm("この記録を削除しますか？")) return;
  records = records.filter((r) => r.id !== id);
  persistRecords();
  renderFilters();
  renderList();
}

// 日付レンジの表示
function formatDateRange(start, end) {
  if (start && end) {
    return `${start} 〜 ${end}`;
  }
  if (start) return `${start} 〜`;
  if (end) return `〜 ${end}`;
  return "";
}

// XSS対策の簡易エスケープ
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
