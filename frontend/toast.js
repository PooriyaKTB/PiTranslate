export function showToast(message, type) {
  document.getElementById("feedbackPopup")?.remove();

  const popup = document.createElement("div");
  popup.id = "feedbackPopup";
  popup.className = `toast ${type}`;
  popup.setAttribute("role", "status");
  popup.textContent = message;
  document.body.appendChild(popup);

  setTimeout(() => popup.remove(), 2500);
}
