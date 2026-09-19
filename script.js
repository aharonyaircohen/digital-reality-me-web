const lists = document.querySelectorAll("[data-collapsible]");

for (const list of lists) {
  const button = document.querySelector(`[aria-controls="${list.id}"]`);

  if (!button || list.children.length <= 6) {
    continue;
  }

  list.classList.add("is-collapsed");
  button.hidden = false;

  button.addEventListener("click", () => {
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    list.classList.toggle("is-collapsed", isExpanded);
    button.setAttribute("aria-expanded", String(!isExpanded));
    button.textContent = isExpanded ? "הצג מאמרים נוספים" : "הצג פחות";
  });
}
