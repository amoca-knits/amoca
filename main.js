// main.js テスト版（まずはパーサエラーが消えるかの確認用）

console.log("Amoca main.js loaded as module");

// 画面にある全ての button にクリックイベントをつけてみる
window.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll("button");
  console.log("found buttons:", buttons.length);

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      alert(`ボタンが反応しました：id=${btn.id || "(idなし)"}`);
    });
  });
});