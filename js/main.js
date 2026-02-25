let state = {
  currentDate: new Date(),
  selectedDate: new Date().toISOString().split("T")[0],
  tasks: JSON.parse(localStorage.getItem("plannerTasks")) || {},
  completed: JSON.parse(localStorage.getItem("plannerCompleted")) || {},
  selectedTaskIndex: -1,
};

function saveToStorage() {
  localStorage.setItem("plannerTasks", JSON.stringify(state.tasks));
  localStorage.setItem("plannerCompleted", JSON.stringify(state.completed));
}

function renderCalendar() {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();

  document.getElementById("monthYear").textContent = new Date(year, month)
    .toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
    .toUpperCase();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDay = firstDay.getDay();
  if (startDay === 0) startDay = 7;

  const daysInMonth = lastDay.getDate();

  let calendarHtml = "";

  for (let i = 1; i < startDay; i++) {
    calendarHtml += '<div class="calendar-day empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const today = new Date();
    const isToday =
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year;
    const isSelected = dateStr === state.selectedDate;
    const hasTasks = state.tasks[dateStr] && state.tasks[dateStr].length > 0;

    let classes = "calendar-day";
    if (isToday) classes += " today";
    if (isSelected) classes += " selected";
    if (hasTasks) classes += " has-tasks";

    calendarHtml += `<div class="${classes}" onclick="selectDate('${dateStr}')">${day}</div>`;
  }

  document.getElementById("calendarGrid").innerHTML = calendarHtml;
}

function renderTasks() {
  const tasksList = document.getElementById("tasksList");
  const tasks = state.tasks[state.selectedDate] || [];
  const completed = state.completed[state.selectedDate] || [];

  const dateObj = new Date(state.selectedDate);
  const formatted = dateObj.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  document.getElementById("selectedDate").textContent = formatted;

  let completedInDay = tasks.filter((_, i) => completed.includes(i)).length;
  document.getElementById("tasksCount").textContent = `${completedInDay}/${tasks.length}`;
  document.getElementById("progressDisplay").textContent = tasks.length
    ? `${Math.round((completedInDay / tasks.length) * 100)}%`
    : "—";

  if (tasks.length === 0) {
    tasksList.innerHTML = '<li class="empty-message">Нет задач на этот день</li>';
    return;
  }

  let tasksHtml = "";
  tasks.forEach((task, index) => {
    const isCompleted = completed.includes(index);
    tasksHtml += `
      <li class="task-item ${isCompleted ? "completed" : ""} ${index === state.selectedTaskIndex ? "selected" : ""}"
          onclick="selectTask(${index})">
          <input type="checkbox" class="task-checkbox" 
              ${isCompleted ? "checked" : ""} 
              onclick="event.stopPropagation(); toggleTask(${index})">
          <span class="task-content">${task}</span>
          <div class="task-actions">
              <button class="icon-btn edit-btn" title="Редактировать" onclick="event.stopPropagation(); editTask(${index})">
                  <svg class="icon" viewBox="0 0 24 24">
                      <path d="M12 20H21M3 20H4L18 6L16 4L2 18V20H3Z" />
                      <path d="M16 4L20 8" />
                  </svg>
              </button>
              <button class="icon-btn delete-btn" title="Удалить" onclick="event.stopPropagation(); deleteTask(${index})">
                  <svg class="icon" viewBox="0 0 24 24">
                      <path d="M18 6L6 18" />
                      <path d="M6 6L18 18" />
                  </svg>
              </button>
          </div>
      </li>
    `;
  });

  tasksList.innerHTML = tasksHtml;
}

function updateStats() {
  let total = 0,
    completed = 0;
  Object.keys(state.tasks).forEach((date) => {
    total += state.tasks[date].length;
    completed += (state.completed[date] || []).length;
  });
  document.getElementById("totalTasksAll").textContent = total;
  document.getElementById("completedTasksAll").textContent = completed;
}

function selectDate(dateStr) {
  state.selectedDate = dateStr;
  state.selectedTaskIndex = -1;
  
  clearAndHighlightInput(); // Очищаем и подсвечиваем
  
  renderCalendar();
  renderTasks();
}

function selectTask(index) {
  state.selectedTaskIndex = state.selectedTaskIndex === index ? -1 : index;
  renderTasks();
}

function addTask() {
  const input = document.getElementById("taskInput");
  const text = input.value.trim();
  if (!text) return;

  if (!state.tasks[state.selectedDate]) state.tasks[state.selectedDate] = [];
  state.tasks[state.selectedDate].push(text);
  input.value = "";

  saveToStorage();
  renderTasks();
  renderCalendar();
  updateStats();
}

function toggleTask(index) {
  if (!state.completed[state.selectedDate])
    state.completed[state.selectedDate] = [];
  const pos = state.completed[state.selectedDate].indexOf(index);
  if (pos === -1) state.completed[state.selectedDate].push(index);
  else state.completed[state.selectedDate].splice(pos, 1);

  saveToStorage();
  renderTasks();
  updateStats();
}

function editTask(index) {
  const tasks = state.tasks[state.selectedDate];
  if (!tasks) return;
  const newText = prompt("Редактировать задачу:", tasks[index]);
  if (newText && newText.trim()) {
    tasks[index] = newText.trim();
    saveToStorage();
    renderTasks();
  }
}

function deleteTask(index) {
  // if (!confirm("Удалить задачу?")) return;

  state.tasks[state.selectedDate].splice(index, 1);
  if (state.completed[state.selectedDate]) {
    state.completed[state.selectedDate] = state.completed[state.selectedDate]
      .filter((i) => i !== index)
      .map((i) => (i > index ? i - 1 : i));
  }

  if (state.tasks[state.selectedDate].length === 0) {
    delete state.tasks[state.selectedDate];
    delete state.completed[state.selectedDate];
  }

  state.selectedTaskIndex = -1;
  saveToStorage();
  renderTasks();
  renderCalendar();
  updateStats();
}

function clearAllTasks() {
  if (!confirm("Удалить все задачи?")) return;
  state.tasks = {};
  state.completed = {};
  state.selectedTaskIndex = -1;
  saveToStorage();
  renderTasks();
  renderCalendar();
  updateStats();
}

function changeMonth(delta) {
  state.currentDate.setMonth(state.currentDate.getMonth() + delta);
  renderCalendar();
}

function goToToday() {
  state.currentDate = new Date();
  state.selectedDate = new Date().toISOString().split("T")[0];
  renderCalendar();
  renderTasks();
}

function toggleHelp() {
  const modal = document.getElementById("helpModal");
  modal.style.display = modal.style.display === "none" ? "flex" : "none";
}

window.onclick = (e) => {
  const modal = document.getElementById("helpModal");
  if (e.target === modal) modal.style.display = "none";
};

function clearAndHighlightInput() {
  const taskInput = document.getElementById("taskInput");
  const wrapper = taskInput?.parentElement;
  
  if (!wrapper) return;
  
  // Очищаем поле
  taskInput.value = "";
  
  // Добавляем подсветку
  wrapper.style.transition = "border-color 0.2s, box-shadow 0.2s";
  wrapper.style.borderColor = "#1d1d1f";
  wrapper.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)";
  
  // Убираем подсветку через небольшую задержку
  setTimeout(() => {
    wrapper.style.borderColor = "rgba(0, 0, 0, 0.06)";
    wrapper.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.02)";
  }, 300);
  
  // Опционально: вибрируем поле (шутка, но можно добавить)
  wrapper.style.transform = "scale(1.02)";
  setTimeout(() => {
    wrapper.style.transform = "scale(1)";
  }, 150);
}



function setupTaskInput() {
  const taskInput = document.getElementById("taskInput");
  
  // Обработчик для Enter
  taskInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTask();
    } else if (event.key === "Escape") {
      event.preventDefault();
      taskInput.value = ""; // Очистка поля
      taskInput.blur(); // Убираем фокус
    }
  });


  // Опционально: автофокус на поле ввода
  taskInput.focus();
}


// function checkScrollable() {
//   const list = document.querySelector(".tasks-list");
//   if (list) {
//     if (list.scrollHeight > list.clientHeight) {
//       list.classList.add("is-scrollable");
//     } else {
//       list.classList.remove("is-scrollable");
//     }
//   }
// }

// Вызов в DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  renderCalendar();
  renderTasks();
  updateStats();
  setupTaskInput();



  // document.addEventListener("DOMContentLoaded", checkScrollable);
});
