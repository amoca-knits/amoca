const STORAGE_KEY = "amocaEntries_simple";

let entries = [];
let currentEditingIndex = null; // 編集中のインデックス（なければ null）
let currentYarnFilter = "ALL";
let currentItemFilter = "ALL";

// ページ読み込み時：保存済みデータを読み込んで表示
document.addEventListener("DOMContentLoaded", () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      entries = JSON.parse(saved);
    }
  } catch (e) {
    console.error("保存データの読み込みに失敗しました", e);
    entries = [];
  }

  setupFilterListeners();
  updateView();

  const btn = document.getElementById("saveButton");
  if (!btn) {
    alert("saveButton が見つからないよ…");
    return;
  }

  btn.addEventListener("click", handleSaveClick);
});

function setupFilterListeners() {
  const yarnSelect = document.getElementById("yarnFilter");
  const itemSelect = document.getElementById("itemFilter");

  if (yarnSelect) {
    yarnSelect.addEventListener("change", () => {
      currentYarnFilter = yarnSelect.value;
      renderList(); // 絞り込みだけ更新
    });
  }

  if (itemSelect) {
    itemSelect.addEventListener("change", () => {
      currentItemFilter = itemSelect.value;
      renderList();
    });
  }
}

// Save / Update ボタンが押されたとき
function handleSaveClick() {
  const yarnName = document.getElementById("yarnName").value;
  const colorNumber = document.getElementById("colorNumber").value;
  const itemType = document.getElementById("itemType").value;
  const ballsUsed = document.getElementById("ballsUsed").value;
  const needleSize = document.getElementById("needleSize").value;
  const purchasePlace = document.getElementById("purchasePlace").value;
  const workHours = document.getElementById("workHours").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const memo = document.getElementById("memo").value;
  const photoInput = document.getElementById("photo");

  const photoFile =
    photoInput && photoInput.files && photoInput.files.length > 0
      ? photoInput.files[0]
      : null;

  const isEditing = currentEditingIndex !== null;
  const editIndex = currentEditingIndex;

  const baseEntry = {
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
  };

  // 写真あり：リサイズしてから保存
  if (photoFile) {
    resizeImageToDataUrl(
      photoFile,
      400,
      (photoData) => {
        const entry = {
          ...baseEntry,
          photoData,
        };
        if (isEditing) {
          entries[editIndex] = entry;
        } else {
          entries.push(entry);
        }
        persistAndRefresh();
      },
      () => {
        // 画像変換に失敗したときは、編集なら前の写真を残す／新規なら写真なし
        const previousPhoto =
          isEditing && entries[editIndex] && entries[editIndex].photoData
            ? entries[editIndex].photoData
            : null;
        const entry = {
          ...baseEntry,
          photoData: previousPhoto,
        };
        if (isEditing) {
          entries[editIndex] = entry;
        } else {
          entries.push(entry);
        }
        persistAndRefresh();
      }
    );
  } else {
    // 写真なし：編集時は前の写真を引き継ぐ
    const previousPhoto =
      isEditing && entries[editIndex] && entries[editIndex].photoData
        ? entries[editIndex].photoData
        : null;

    const entry = {
      ...baseEntry,
      photoData: previousPhoto,
    };

    if (isEditing) {
      entries[editIndex] = entry;
    } else {
      entries.push(entry);
    }
    persistAndRefresh();
  }
}

// localStorage に保存して画面＆フィルタ更新
function persistAndRefresh() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error("localStorage保存中にエラー", e);
    alert("保存中にエラーが起きたよ: " + e.message);
  }
  currentEditingIndex = null;
  clearForm();
  updateView();
}

// フィルタと一覧の両方を更新
function updateView() {
  renderFilters();
  renderList();
}

// フィルタセレクトの中身を更新
function renderFilters() {
  const yarnSelect = document.getElementById("yarnFilter");
  const itemSelect = document.getElementById("itemFilter");
  if (!yarnSelect || !itemSelect) return;

  const uniqueYarns = Array.from(
    new Set(entries.map((e) => e.yarnName).filter((v) => v && v.trim() !== ""))
  ).sort((a, b) => a.localeCompare(b, "ja"));

  const uniqueItems = Array.from(
    new Set(entries.map((e) => e.itemType).filter((v) => v && v.trim() !== ""))
  ).sort((a, b) => a.localeCompare(b, "ja"));

  const prevYarn = currentYarnFilter;
  const prevItem = currentItemFilter;

  yarnSelect.innerHTML = `<option value="ALL">すべて</option>`;
  uniqueYarns.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    yarnSelect.appendChild(opt);
  });

  itemSelect.innerHTML = `<option value="ALL">すべて</option>`;
  uniqueItems.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    itemSelect.appendChild(opt);
  });

  // 以前選んでいた値がまだ存在すれば維持、なければALLに戻す
  if (prevYarn !== "ALL" && uniqueYarns.includes(prevYarn)) {
    currentYarnFilter = prevYarn;
  } else {
    currentYarnFilter = "ALL";
  }
  if (prevItem !== "ALL" && uniqueItems.includes(prevItem)) {
    currentItemFilter = prevItem;
  } else {
    currentItemFilter = "ALL";
  }

  yarnSelect.value = currentYarnFilter;
  itemSelect.value = currentItemFilter;
}

// 一覧の描画（フィルタ適用）
function renderList() {
  const listArea = document.getElementById("listArea");
  listArea.innerHTML = "";

  const filtered = entries.filter((entry) => {
    const yarnOk =
      currentYarnFilter === "ALL" ||
      entry.yarnName === currentYarnFilter;
    const itemOk =
      currentItemFilter === "ALL" ||
      entry.itemType === currentItemFilter;
    return yarnOk && itemOk;
  });

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    if (entries.length === 0) {
      empty.textContent =
        "まだ記録がありません。左のフォームから最初の作品を追加してみてね🧶";
    } else {
      empty.textContent =
        "この条件に合う記録はありません。フィルタを変えてみてね。";
    }
    listArea.appendChild(empty);
    updateSaveButtonLabel();
    return;
  }

  filtered.forEach((entry, indexInFiltered) => {
    // filtered 用だと index ずれるので、元の配列でのインデックスを取得
    const index = entries.indexOf(entry);

    const card = document.createElement("div");
    card.className = "entry-card";

    const title = document.createElement("div");
    title.innerHTML = `<strong>${entry.yarnName || "(no name)"}</strong>（color: ${
      entry.colorNumber || "-"
    }）`;
    card.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "entry-meta";
    meta.innerHTML = `
      購入先：${entry.purchasePlace || "-"} /
      作業時間：${entry.workHours ? entry.workHours + "時間" : "-"} /
      編み始め：${entry.startDate || "-"} /
      編み終え：${entry.endDate || "-"}
    `;
    card.appendChild(meta);

    const body = document.createElement("div");
    body.className = "entry-body";
    body.innerHTML = `
      <div><span class="label">編んだもの：</span>${entry.itemType || "-"}</div>
      <div><span class="label">玉数：</span>${entry.ballsUsed || "-"} / <span class="label">針：</span>${entry.needleSize || "-"}</div>
      <div><span class="label">メモ：</span>${entry.memo ? entry.memo.replace(/\n/g, "<br>") : "-"}</div>
    `;
    card.appendChild(body);

    if (entry.photoData) {
      const img = document.createElement("img");
      img.src = entry.photoData;
      img.className = "entry-photo";
      card.appendChild(img);
    }

    const actions = document.createElement("div");
    actions.className = "entry-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "btn btn-edit";
    editBtn.addEventListener("click", () => {
      startEdit(index);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "btn btn-delete";
    deleteBtn.addEventListener("click", () => {
      deleteEntry(index);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    listArea.appendChild(card);
  });

  updateSaveButtonLabel();
}

// Saveボタンのラベルを更新
function updateSaveButtonLabel() {
  const saveButton = document.getElementById("saveButton");
  if (!saveButton) return;
  saveButton.textContent = currentEditingIndex === null ? "Save" : "Update";
}

// 画像をリサイズして dataURL にする
function resizeImageToDataUrl(file, maxWidth, callback, onError) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      callback(dataUrl);
    };
    img.onerror = function (err) {
      console.error("画像の読み込みに失敗", err);
      if (onError) onError(err);
    };
    img.src = e.target.result;
  };
  reader.onerror = function (err) {
    console.error("FileReaderエラー", err);
    if (onError) onError(err);
  };
  reader.readAsDataURL(file);
}

// 編集モード開始（テキストも写真も対象）
function startEdit(index) {
  const entry = entries[index];
  currentEditingIndex = index;

  document.getElementById("yarnName").value = entry.yarnName || "";
  document.getElementById("colorNumber").value = entry.colorNumber || "";
  document.getElementById("itemType").value = entry.itemType || "";
  document.getElementById("ballsUsed").value = entry.ballsUsed || "";
  document.getElementById("needleSize").value = entry.needleSize || "";
  document.getElementById("purchasePlace").value = entry.purchasePlace || "";
  document.getElementById("workHours").value = entry.workHours || "";
  document.getElementById("startDate").value = entry.startDate || "";
  document.getElementById("endDate").value = entry.endDate || "";
  document.getElementById("memo").value = entry.memo || "";

  const photoInput = document.getElementById("photo");
  if (photoInput) {
    photoInput.value = "";
  }

  updateSaveButtonLabel();
  alert(
    "編集モードになったよ。テキストを直して、必要なら写真も選び直してから Update を押してね。"
  );
}

// 削除
function deleteEntry(index) {
  if (!confirm("この記録を削除してもいい？")) {
    return;
  }

  entries.splice(index, 1);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error("削除後の保存でエラー", e);
  }

  if (currentEditingIndex === index) {
    currentEditingIndex = null;
    clearForm();
  } else if (currentEditingIndex !== null && index < currentEditingIndex) {
    currentEditingIndex -= 1;
  }

  updateView();
}

// 入力欄をクリア
function clearForm() {
  document.getElementById("yarnName").value = "";
  document.getElementById("colorNumber").value = "";
  document.getElementById("itemType").value = "";
  document.getElementById("ballsUsed").value = "";
  document.getElementById("needleSize").value = "";
  document.getElementById("purchasePlace").value = "";
  document.getElementById("workHours").value = "";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  document.getElementById("memo").value = "";
  const photoInput = document.getElementById("photo");
  if (photoInput) {
    photoInput.value = "";
  }
  updateSaveButtonLabel();
}
