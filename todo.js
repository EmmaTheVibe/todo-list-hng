let dueDate = new Date("2026-04-16T18:00:00Z");

const checkbox = document.getElementById("todo-complete");
const titleEl = document.getElementById("todo-title");
const descriptionEl = document.getElementById("todo-description");
const priorityBadge = document.getElementById("todo-priority-badge");
const priorityText = document.getElementById("todo-priority-text");
const statusBadge = document.getElementById("todo-status-badge");
const statusText = document.getElementById("todo-status-text");
const dueDateEl = document.getElementById("todo-due-date");
const timeRemainingEl = document.getElementById("todo-time-remaining");
const btnEdit = document.getElementById("btn-edit");
const btnDelete = document.getElementById("btn-delete");

const modal = document.getElementById("edit-modal");
const editTitle = document.getElementById("edit-title");
const editDescription = document.getElementById("edit-description");
const editPriority = document.getElementById("edit-priority");
const editStatus = document.getElementById("edit-status");
const editDueDate = document.getElementById("edit-due-date");
const titleError = document.getElementById("edit-title-error");
const btnModalClose = document.getElementById("btn-modal-close");
const btnModalCancel = document.getElementById("btn-modal-cancel");
const btnModalSave = document.getElementById("btn-modal-save");

function getTimeRemaining(now) {
  const diff = dueDate - now;
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60_000);
  const hrs = Math.floor(abs / 3_600_000);
  const days = Math.floor(abs / 86_400_000);

  if (abs < 60_000) return { text: "Due now!", cls: "tr-now" };
  if (diff < 0) {
    if (mins < 60)
      return {
        text: `Overdue by ${mins} min${mins !== 1 ? "s" : ""}`,
        cls: "tr-overdue",
      };
    if (hrs < 24)
      return {
        text: `Overdue by ${hrs} hr${hrs !== 1 ? "s" : ""}`,
        cls: "tr-overdue",
      };
    return {
      text: `Overdue by ${days} day${days !== 1 ? "s" : ""}`,
      cls: "tr-overdue",
    };
  }
  if (mins < 60)
    return {
      text: `Due in ${mins} min${mins !== 1 ? "s" : ""}`,
      cls: "tr-soon",
    };
  if (hrs < 24)
    return { text: `Due in ${hrs} hr${hrs !== 1 ? "s" : ""}`, cls: "tr-soon" };
  if (days === 1) return { text: "Due tomorrow", cls: "tr-soon" };
  if (days <= 6) return { text: `Due in ${days} days`, cls: "tr-soon" };
  return { text: `Due in ${days} days`, cls: "tr-ok" };
}

function updateTimeRemaining() {
  const { text, cls } = getTimeRemaining(new Date());
  timeRemainingEl.textContent = text;
  timeRemainingEl.className = "time-remaining " + cls;
}

updateTimeRemaining();
setInterval(updateTimeRemaining, 60_000);

const PRIORITY_MAP = {
  high: { label: "High", cls: "badge-high" },
  medium: { label: "Medium", cls: "badge-medium" },
  low: { label: "Low", cls: "badge-low" },
};

const STATUS_MAP = {
  pending: { label: "Pending", cls: "badge-pending" },
  inprogress: { label: "In Progress", cls: "badge-inprogress" },
  done: { label: "Done", cls: "badge-done" },
};

function applyPriorityBadge(value) {
  const { label, cls } = PRIORITY_MAP[value];
  priorityBadge.className = `badge ${cls}`;
  priorityBadge.setAttribute("aria-label", `Priority: ${label}`);
  priorityText.textContent = label;
}

function applyStatusBadge(value) {
  const { label, cls } = STATUS_MAP[value];
  statusBadge.className = `badge ${cls}`;
  statusBadge.setAttribute("aria-label", `Status: ${label}`);
  statusText.textContent = label;
}

function formatDisplayDate(date) {
  return (
    "Due " +
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  );
}

function toInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getCurrentPriorityValue() {
  const label = priorityText.textContent.trim().toLowerCase();
  return (
    Object.keys(PRIORITY_MAP).find(
      (k) => PRIORITY_MAP[k].label.toLowerCase() === label,
    ) || "high"
  );
}

function getCurrentStatusValue() {
  const label = statusText.textContent.trim().toLowerCase();
  return (
    Object.keys(STATUS_MAP).find(
      (k) => STATUS_MAP[k].label.toLowerCase() === label,
    ) || "inprogress"
  );
}

let previouslyFocused = null;

function openModal() {
  editTitle.value = titleEl.textContent.trim();
  editDescription.value = descriptionEl.textContent.trim();
  editPriority.value = getCurrentPriorityValue();
  editStatus.value = getCurrentStatusValue();
  editDueDate.value = toInputValue(dueDate);

  clearTitleError();

  previouslyFocused = document.activeElement;
  modal.hidden = false;
  document.body.style.overflow = "hidden";

  editTitle.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";

  if (previouslyFocused) previouslyFocused.focus();
}

function showTitleError() {
  editTitle.classList.add("is-invalid");
  editTitle.setAttribute("aria-invalid", "true");
  editTitle.setAttribute("aria-describedby", "edit-title-error");
  titleError.hidden = false;
}

function clearTitleError() {
  editTitle.classList.remove("is-invalid");
  editTitle.removeAttribute("aria-invalid");
  editTitle.removeAttribute("aria-describedby");
  titleError.hidden = true;
}

function saveEdits() {
  const newTitle = editTitle.value.trim();
  const newDesc = editDescription.value.trim();
  const newPriority = editPriority.value;
  const newStatus = editStatus.value;
  const newDateVal = editDueDate.value;

  if (!newTitle) {
    showTitleError();
    editTitle.focus();
    return;
  }
  clearTitleError();

  titleEl.textContent = newTitle;

  descriptionEl.textContent = newDesc || descriptionEl.textContent;

  applyPriorityBadge(newPriority);

  applyStatusBadge(newStatus);
  if (newStatus === "done") {
    titleEl.classList.add("done");
    checkbox.checked = true;
  } else {
    titleEl.classList.remove("done");
    checkbox.checked = false;
  }

  if (newDateVal) {
    dueDate = new Date(newDateVal + "T18:00:00Z");
    dueDateEl.textContent = formatDisplayDate(dueDate);
    dueDateEl.setAttribute("datetime", dueDate.toISOString());
    updateTimeRemaining();
  }

  closeModal();
}

checkbox.addEventListener("change", function () {
  if (this.checked) {
    titleEl.classList.add("done");
    applyStatusBadge("done");
  } else {
    titleEl.classList.remove("done");
    applyStatusBadge("inprogress");
  }
});

btnDelete.addEventListener("click", function () {
  if (confirm("Delete this task?")) {
    document.querySelector('[data-testid="test-todo-card"]').remove();
  }
});

btnEdit.addEventListener("click", openModal);
btnModalClose.addEventListener("click", closeModal);
btnModalCancel.addEventListener("click", closeModal);
btnModalSave.addEventListener("click", saveEdits);

modal.addEventListener("click", function (e) {
  if (e.target === modal) closeModal();
});

modal.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeModal();
    return;
  }

  if (
    e.key === "Enter" &&
    e.target.tagName !== "TEXTAREA" &&
    e.target.tagName !== "BUTTON" &&
    e.target.tagName !== "SELECT"
  ) {
    e.preventDefault();
    saveEdits();
  }
});

modal.addEventListener("keydown", function (e) {
  if (e.key !== "Tab" || modal.hidden) return;

  const focusable = Array.from(
    modal.querySelectorAll(
      'button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.disabled);

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
