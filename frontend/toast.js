// Optional action adds a button (e.g. { label: "Undo", onClick }) and keeps the toast up longer.
export function showToast(message, type, action) {
  document.getElementById("feedbackPopup")?.remove();

  const popup = document.createElement("div");
  popup.id = "feedbackPopup";
  popup.className = `toast ${type}`;
  popup.setAttribute("role", "status");
  popup.textContent = message;

  if (action) {
    const button = document.createElement("button");
    button.className = "toast-action";
    button.textContent = action.label;
    button.addEventListener("click", () => {
      popup.remove();
      action.onClick();
    });
    popup.append(button);
  }

  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), action ? 5000 : 2500);
}
