const COLLAPSE_THRESHOLD = 150;

let dueDate = new Date("2026-04-16T18:00:00Z");
let timerHandle = null;

const card = document.getElementById("todo-card");
const checkbox = document.getElementById("todo-complete");
const titleEl = document.getElementById("todo-title");
const descriptionEl = document.getElementById("todo-description");
const priorityBadge = document.getElementById("todo-priority-badge");
const priorityText = document.getElementById("todo-priority-text");
const priorityIndicator = document.getElementById("todo-priority-indicator");
const statusBadge = document.getElementById("todo-status-badge");
const statusText = document.getElementById("todo-status-text");
const statusControl = document.getElementById("todo-status-control");
const dueDateEl = document.getElementById("todo-due-date");
const timeRemainingEl = document.getElementById("todo-time-remaining");
const overdueIndicator = document.getElementById("todo-overdue-indicator");
const collapsibleSection = document.getElementById("todo-collapsible-section");
const expandToggle = document.getElementById("todo-expand-toggle");
const expandToggleText = expandToggle.querySelector(".expand-toggle-text");
const btnEdit = document.getElementById("btn-edit");
const btnDelete = document.getElementById("btn-delete");

const modal = document.getElementById("edit-modal");
const editTitle = document.getElementById("edit-title");
const editDescription = document.getElementById("edit-description");
const editPriority = document.getElementById("edit-priority");
const editDueDate = document.getElementById("edit-due-date");
const titleError = document.getElementById("edit-title-error");
const btnModalClose = document.getElementById("btn-modal-close");
const btnModalCancel = document.getElementById("btn-modal-cancel");
const btnModalSave = document.getElementById("btn-modal-save");

const PRIORITY_MAP = {
  high: { label: "High", cls: "badge-high", indicator: "priority-high" },
  medium: {
    label: "Medium",
    cls: "badge-medium",
    indicator: "priority-medium",
  },
  low: { label: "Low", cls: "badge-low", indicator: "priority-low" },
};

const STATUS_MAP = {
  pending: { label: "Pending", cls: "badge-pending" },
  inprogress: { label: "In Progress", cls: "badge-inprogress" },
  done: { label: "Done", cls: "badge-done" },
};

function getTimeRemaining(now) {
  const diff = dueDate - now;
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60_000);
  const hrs = Math.floor(abs / 3_600_000);
  const days = Math.floor(abs / 86_400_000);

  if (abs < 60_000) return { text: "Due now", cls: "tr-now", overdue: false };
  if (diff < 0) {
    if (mins < 60)
      return {
        text: `Overdue by ${mins} min${mins !== 1 ? "s" : ""}`,
        cls: "tr-overdue",
        overdue: true,
      };
    if (hrs < 24)
      return {
        text: `Overdue by ${hrs} hr${hrs !== 1 ? "s" : ""}`,
        cls: "tr-overdue",
        overdue: true,
      };
    return {
      text: `Overdue by ${days} day${days !== 1 ? "s" : ""}`,
      cls: "tr-overdue",
      overdue: true,
    };
  }
  if (mins < 60)
    return {
      text: `Due in ${mins} min${mins !== 1 ? "s" : ""}`,
      cls: "tr-soon",
      overdue: false,
    };
  if (hrs < 24)
    return {
      text: `Due in ${hrs} hr${hrs !== 1 ? "s" : ""}`,
      cls: "tr-soon",
      overdue: false,
    };
  if (days === 1)
    return { text: "Due tomorrow", cls: "tr-soon", overdue: false };
  if (days <= 6)
    return { text: `Due in ${days} days`, cls: "tr-soon", overdue: false };
  return { text: `Due in ${days} days`, cls: "tr-ok", overdue: false };
}

function updateTimeRemaining() {
  const currentStatus = statusControl.value;

  if (currentStatus === "done") {
    timeRemainingEl.textContent = "Completed";
    timeRemainingEl.className = "time-remaining tr-done";
    overdueIndicator.hidden = true;
    card.classList.remove("is-overdue");
    return;
  }

  const { text, cls, overdue } = getTimeRemaining(new Date());
  timeRemainingEl.textContent = text;
  timeRemainingEl.className = "time-remaining " + cls;

  overdueIndicator.hidden = !overdue;
  card.classList.toggle("is-overdue", overdue);
}

function startTimer() {
  if (timerHandle) return;
  timerHandle = setInterval(updateTimeRemaining, 45_000);
}

function stopTimer() {
  clearInterval(timerHandle);
  timerHandle = null;
}

function applyPriorityBadge(value) {
  const { label, cls, indicator } = PRIORITY_MAP[value];
  priorityBadge.className = `badge ${cls}`;
  priorityBadge.setAttribute("aria-label", `Priority: ${label}`);
  priorityText.textContent = label;
  priorityIndicator.className = `priority-indicator ${indicator}`;
}

function applyStatusBadge(value) {
  const { label, cls } = STATUS_MAP[value];
  statusBadge.className = `badge ${cls}`;
  statusBadge.setAttribute("aria-label", `Status: ${label}`);
  statusText.textContent = label;
}

function setStatus(value) {
  statusControl.value = value;

  applyStatusBadge(value);

  checkbox.checked = value === "done";

  titleEl.classList.toggle("done", value === "done");

  card.classList.toggle("is-done", value === "done");

  if (value === "done") {
    stopTimer();
  } else {
    startTimer();
  }

  updateTimeRemaining();
}

function initExpandCollapse() {
  const text = descriptionEl.textContent.trim();

  if (text.length <= COLLAPSE_THRESHOLD) {
    collapsibleSection.classList.remove("is-collapsed");
    expandToggle.hidden = true;
    return;
  }

  collapsibleSection.classList.add("is-collapsed");
  collapsibleSection.setAttribute("aria-expanded", "false");
  expandToggle.hidden = false;
  expandToggle.setAttribute("aria-expanded", "false");
  expandToggleText.textContent = "Show more";
}

function toggleExpand() {
  const isExpanded = expandToggle.getAttribute("aria-expanded") === "true";
  const next = !isExpanded;

  expandToggle.setAttribute("aria-expanded", String(next));
  collapsibleSection.setAttribute("aria-expanded", String(next));
  collapsibleSection.classList.toggle("is-collapsed", !next);
  expandToggleText.textContent = next ? "Show less" : "Show more";
}

function formatDisplayDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

let previouslyFocused = null;

function openModal() {
  editTitle.value = titleEl.textContent.trim();
  editDescription.value = descriptionEl.textContent.trim();
  editPriority.value = getCurrentPriorityValue();
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
  const newDateVal = editDueDate.value;

  if (!newTitle) {
    showTitleError();
    editTitle.focus();
    return;
  }
  clearTitleError();

  titleEl.textContent = newTitle;

  descriptionEl.textContent = newDesc;

  applyPriorityBadge(newPriority);

  if (newDateVal) {
    dueDate = new Date(newDateVal + "T18:00:00Z");
    dueDateEl.textContent = formatDisplayDate(dueDate);
    dueDateEl.setAttribute("datetime", dueDate.toISOString());
    updateTimeRemaining();
  }

  collapsibleSection.classList.remove("is-collapsed");
  expandToggle.hidden = true;
  initExpandCollapse();

  closeModal();
}

checkbox.addEventListener("change", function () {
  setStatus(this.checked ? "done" : "pending");
});

statusControl.addEventListener("change", function () {
  setStatus(this.value);
});

expandToggle.addEventListener("click", toggleExpand);

document
  .getElementById("todo-edit-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    saveEdits();
  });

btnEdit.addEventListener("click", openModal);

btnDelete.addEventListener("click", function () {
  if (confirm("Delete this task?")) {
    card.remove();
  }
});

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

applyPriorityBadge("high");
applyStatusBadge("inprogress");
priorityIndicator.className = "priority-indicator priority-high";
initExpandCollapse();
updateTimeRemaining();
startTimer();
