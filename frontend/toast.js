export function showToast(message, type) {
  document.getElementById("feedbackPopup")?.remove();

  const popup = document.createElement("div");
  popup.id = "feedbackPopup";
  popup.className = `feedback-popup ${type}`;
  popup.textContent = message;
  document.body.appendChild(popup);

  setTimeout(() => popup.remove(), 2000);
}
