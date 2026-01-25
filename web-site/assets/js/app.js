const dropdown = document.querySelector(".dropdown");
const dropdownBtn = document.querySelector("[data-dropdown-btn]");

if (dropdown && dropdownBtn) {
  dropdownBtn.addEventListener("click", (e) => {
    e.preventDefault();
    dropdown.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) dropdown.classList.remove("open");
  });
}

const current = window.location.pathname.replace(/\/+$/, "");
document.querySelectorAll(".nav a").forEach((a) => {
  const href = a.getAttribute("href");
  if (!href) return;

  const linkPath = new URL(href, window.location.origin).pathname.replace(/\/+$/, "");
  if (linkPath === current) a.classList.add("active");
});
