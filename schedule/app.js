// 상태 변수
let currentDate = new Date(); // 현재 보고 있는 기준 날짜 (월간/주간 공통)
let currentView = 'monthly'; // 'monthly' 또는 'weekly'
let startDayOfWeek = 0; // 주간 뷰의 시작 요일 (0: 일요일, 1: 월요일)
let scheduleData = JSON.parse(localStorage.getItem('scheduler_data')) || {}; // 로컬스토리지에서 데이터 불러오기
let memoData = JSON.parse(localStorage.getItem('scheduler_memo_data')) || [];
let holidayData = JSON.parse(localStorage.getItem('scheduler_holiday_data')) || {}; // 공휴일 데이터 추가

// 데이터 마이그레이션 (기존 단순 문자열 -> 객체 구조)
Object.keys(scheduleData).forEach(key => {
  scheduleData[key] = scheduleData[key].map(item => {
    if (typeof item === 'string') {
      return { text: item, completed: false, color: 'none' };
    }
    return item;
  });
});
localStorage.setItem('scheduler_data', JSON.stringify(scheduleData));

memoData = memoData.map(item => {
  if (item.completed === undefined) {
    return { ...item, completed: false, color: 'none' };
  }
  return item;
});
localStorage.setItem('scheduler_memo_data', JSON.stringify(memoData));

// DOM 엘리먼트
const currentDateDisplay = document.getElementById('current-date-display');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const todayBtn = document.getElementById('today-btn');
const monthlyViewBtn = document.getElementById('monthly-view-btn');
const weeklyViewBtn = document.getElementById('weekly-view-btn');

const monthlyView = document.getElementById('monthly-view');
const calendarGrid = document.getElementById('calendar-grid');

const weeklyView = document.getElementById('weekly-view');
const startDaySelect = document.getElementById('start-day-select');
const weeklyList = document.getElementById('weekly-list');

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const bgColorPicker = document.getElementById('bg-color-picker');
const fontSelect = document.getElementById('font-select');
const resetSettingsBtn = document.getElementById('reset-settings-btn');

const backupBtn = document.getElementById('backup-btn');
const restoreBtn = document.getElementById('restore-btn');
const restoreFileInput = document.getElementById('restore-file-input');

const memoBtn = document.getElementById('memo-btn');
const memoPanel = document.getElementById('memo-panel');
const addMemoBtn = document.getElementById('add-memo-btn');
const memoList = document.getElementById('memo-list');

const bannerArea = document.getElementById('banner-area');
const bannerImg = document.getElementById('banner-img');
const bannerTitle = document.getElementById('banner-title');
const bannerTitleInput = document.getElementById('banner-title-input');
const bannerUrlInput = document.getElementById('banner-url-input');
const bannerFileInput = document.getElementById('banner-file-input');
const deleteBannerImgBtn = document.getElementById('delete-banner-img-btn');
const darkModeToggle = document.getElementById('dark-mode-toggle');

const daysOfWeekNames = ['일', '월', '화', '수', '목', '금', '토'];

// 초기 설정 로드
const savedStartDay = localStorage.getItem('scheduler_start_day');
if (savedStartDay !== null) {
  startDayOfWeek = parseInt(savedStartDay);
  startDaySelect.value = startDayOfWeek;
}

const savedBgColor = localStorage.getItem('scheduler_bg_color');
if (savedBgColor) {
  document.documentElement.style.setProperty('--bg-color', savedBgColor);
  bgColorPicker.value = savedBgColor;
}

const savedFont = localStorage.getItem('scheduler_font');
if (savedFont) {
  document.documentElement.style.setProperty('--schedule-font', savedFont);
  fontSelect.value = savedFont;
}

const savedDarkMode = localStorage.getItem('scheduler_dark_mode') === 'true';
if (savedDarkMode) {
  document.body.classList.add('dark-mode');
  darkModeToggle.checked = true;
}

function renderBanner() {
  const title = localStorage.getItem('scheduler_banner_title') || '';
  const url = localStorage.getItem('scheduler_banner_url') || '';
  
  if (title || url) {
    bannerArea.classList.remove('hidden');
    if (title) {
      // 제목이 있으면 제목만 출력
      bannerTitle.textContent = title;
      bannerTitle.classList.remove('hidden');
      bannerImg.classList.add('hidden');
      bannerTitleInput.value = title;
    } else {
      // 제목이 없고 배너 이미지만 있으면 배너 이미지만 출력
      bannerTitle.classList.add('hidden');
      bannerImg.src = url;
      bannerImg.classList.remove('hidden');
      bannerUrlInput.value = url.startsWith('data:') ? '' : url;
    }
  } else {
    bannerArea.classList.add('hidden');
  }
}
renderBanner();

// 이벤트 리스너 등록
prevBtn.addEventListener('click', () => navigate(-1));
nextBtn.addEventListener('click', () => navigate(1));
todayBtn.addEventListener('click', () => {
  currentDate = new Date();
  render();
});
monthlyViewBtn.addEventListener('click', () => setView('monthly'));
weeklyViewBtn.addEventListener('click', () => setView('weekly'));

startDaySelect.addEventListener('change', (e) => {
  startDayOfWeek = parseInt(e.target.value);
  localStorage.setItem('scheduler_start_day', startDayOfWeek);
  if (currentView === 'weekly') render();
});

// 설정 모달 및 배경/백업 로직
settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

// 드래그 시 의도치 않게 닫히는 현상 방지
settingsModal.addEventListener('mousedown', (e) => {
  if (e.target === settingsModal) {
    const handleMouseUp = (upEvent) => {
      if (upEvent.target === settingsModal) {
        settingsModal.classList.add('hidden');
      }
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mouseup', handleMouseUp);
  }
});

bgColorPicker.addEventListener('input', (e) => {
  const color = e.target.value;
  document.documentElement.style.setProperty('--bg-color', color);
  localStorage.setItem('scheduler_bg_color', color);
});

fontSelect.addEventListener('change', (e) => {
  const font = e.target.value;
  document.documentElement.style.setProperty('--schedule-font', font);
  localStorage.setItem('scheduler_font', font);
});

darkModeToggle.addEventListener('change', (e) => {
  const isDark = e.target.checked;
  if (isDark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  localStorage.setItem('scheduler_dark_mode', isDark);
});

resetSettingsBtn.addEventListener('click', () => {
  if(confirm('모든 옵션을 초기화하시겠습니까?')) {
    startDayOfWeek = 0;
    startDaySelect.value = 0;
    localStorage.removeItem('scheduler_start_day');
    
    const defaultBg = '#f5f5f0';
    document.documentElement.style.setProperty('--bg-color', defaultBg);
    bgColorPicker.value = defaultBg;
    localStorage.removeItem('scheduler_bg_color');
    
    const defaultFont = "'Nanum Pen Script', cursive";
    document.documentElement.style.setProperty('--schedule-font', defaultFont);
    fontSelect.value = defaultFont;
    localStorage.removeItem('scheduler_font');
    
    // 배너 정보 초기화 추가
    localStorage.removeItem('scheduler_banner_title');
    localStorage.removeItem('scheduler_banner_url');
    bannerTitleInput.value = '';
    bannerUrlInput.value = '';
    bannerFileInput.value = '';
    renderBanner();

    document.body.classList.remove('dark-mode');
    darkModeToggle.checked = false;
    localStorage.removeItem('scheduler_dark_mode');
    
    if (currentView === 'weekly') render();
    alert('옵션값이 모두 초기화되었습니다.');
  }
});

bannerTitleInput.addEventListener('input', (e) => {
  localStorage.setItem('scheduler_banner_title', e.target.value);
  renderBanner();
});

bannerUrlInput.addEventListener('input', (e) => {
  localStorage.setItem('scheduler_banner_url', e.target.value);
  renderBanner();
});

bannerFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      localStorage.setItem('scheduler_banner_url', base64);
      renderBanner();
    };
    reader.readAsDataURL(file);
  }
});

deleteBannerImgBtn.addEventListener('click', () => {
  if (confirm('설정된 배너 이미지를 삭제하시겠습니까?')) {
    localStorage.removeItem('scheduler_banner_url');
    bannerUrlInput.value = '';
    bannerFileInput.value = '';
    renderBanner();
  }
});

// 백업 기능
backupBtn.addEventListener('click', () => {
  const data = {
    scheduleData,
    memoData,
    holidayData,
    settings: {
      startDayOfWeek,
      bgColor: document.documentElement.style.getPropertyValue('--bg-color') || '#f5f5f0',
      font: document.documentElement.style.getPropertyValue('--schedule-font') || "'Nanum Pen Script', cursive",
      bannerTitle: localStorage.getItem('scheduler_banner_title') || '',
      bannerUrl: localStorage.getItem('scheduler_banner_url') || '',
      darkMode: localStorage.getItem('scheduler_dark_mode') === 'true'
    }
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  a.download = `scheduler_backup_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// 복구 기능
restoreBtn.addEventListener('click', () => restoreFileInput.click());
restoreFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (data.scheduleData) {
        scheduleData = data.scheduleData;
        localStorage.setItem('scheduler_data', JSON.stringify(scheduleData));
      }
      if (data.memoData) {
        memoData = data.memoData;
        localStorage.setItem('scheduler_memo_data', JSON.stringify(memoData));
      }
      if (data.settings) {
        startDayOfWeek = data.settings.startDayOfWeek || 0;
        localStorage.setItem('scheduler_start_day', startDayOfWeek);
        startDaySelect.value = startDayOfWeek;
        if (data.settings.bgColor) {
          document.documentElement.style.setProperty('--bg-color', data.settings.bgColor);
          localStorage.setItem('scheduler_bg_color', data.settings.bgColor);
          bgColorPicker.value = data.settings.bgColor;
        }
        if (data.settings.font) {
          document.documentElement.style.setProperty('--schedule-font', data.settings.font);
          localStorage.setItem('scheduler_font', data.settings.font);
          fontSelect.value = data.settings.font;
        }
        if (data.settings.bannerTitle !== undefined) {
          localStorage.setItem('scheduler_banner_title', data.settings.bannerTitle);
        }
        if (data.settings.bannerUrl !== undefined) {
          localStorage.setItem('scheduler_banner_url', data.settings.bannerUrl);
        }
        if (data.settings.darkMode !== undefined) {
          localStorage.setItem('scheduler_dark_mode', data.settings.darkMode);
          if (data.settings.darkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
          } else {
            document.body.classList.remove('dark-mode');
            darkModeToggle.checked = false;
          }
        }
      }
      if (data.holidayData) {
        holidayData = data.holidayData;
        localStorage.setItem('scheduler_holiday_data', JSON.stringify(holidayData));
      }
      alert('데이터 복구가 완료되었습니다.');
      render();
      renderMemos();
    } catch (err) {
      alert('파일을 읽는 데 실패했습니다. 올바른 백업 파일인지 확인해주세요.');
    }
    restoreFileInput.value = ''; // 초기화
  };
  reader.readAsText(file);
});

// 메모 패널 토글
memoBtn.addEventListener('click', () => {
  const isHidden = memoPanel.classList.toggle('hidden');
  if (isHidden) {
    memoBtn.classList.remove('active');
  } else {
    memoBtn.classList.add('active');
  }
});

// 드래그 앤 드롭 공통 로직
let draggedItem = null;
let currentDragCallback = null;

function handleDragStart(e) {
  draggedItem = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
  setTimeout(() => this.classList.add('dragging'), 0);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  this.classList.add('drag-over');
  return false;
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  
  if (draggedItem !== this) {
    const container = this.parentNode;
    const allItems = [...container.children];
    const draggedIdx = allItems.indexOf(draggedItem);
    const targetIdx = allItems.indexOf(this);
    
    if (draggedIdx < targetIdx) {
      container.insertBefore(draggedItem, this.nextSibling);
    } else {
      container.insertBefore(draggedItem, this);
    }
    
    if (currentDragCallback) currentDragCallback();
  }
  return false;
}

function handleDragEnd() {
  this.classList.remove('dragging');
  draggedItem = null;
}

function addDragEvents(elem, updateCallback) {
  elem.setAttribute('draggable', 'true');
  elem.addEventListener('dragstart', function(e) {
    currentDragCallback = updateCallback;
    handleDragStart.call(this, e);
  });
  elem.addEventListener('dragover', handleDragOver);
  elem.addEventListener('dragleave', handleDragLeave);
  elem.addEventListener('drop', handleDrop);
  elem.addEventListener('dragend', handleDragEnd);
}

// 메모 관련 로직
addMemoBtn.addEventListener('click', () => {
  memoData.push({ title: '', content: '', completed: false, color: 'none' });
  saveMemoData();
  renderMemos();
  const inputs = memoList.querySelectorAll('.memo-title-input');
  if (inputs.length > 0) inputs[inputs.length - 1].focus();
});

function saveMemoData() {
  localStorage.setItem('scheduler_memo_data', JSON.stringify(memoData));
}

function updateMemoDataFromDOM() {
  const items = memoList.querySelectorAll('.memo-item');
  const newData = [];
  items.forEach(memoDiv => {
    const title = memoDiv.querySelector('.memo-title-input').value;
    const content = memoDiv.querySelector('.memo-content-textarea').value;
    if (title.trim() !== '' || content.trim() !== '') {
      newData.push({
        title: title,
        content: content,
        completed: memoDiv.classList.contains('completed'),
        color: memoDiv.dataset.color || 'none'
      });
    }
  });
  memoData = newData;
  saveMemoData();
}

function createToolbar(container, updateCallback) {
  const toolbar = document.createElement('div');
  toolbar.className = 'item-toolbar';
  
  const checkBtn = document.createElement('div');
  checkBtn.className = 'toolbar-btn check-btn';
  checkBtn.innerHTML = '✔';
  checkBtn.title = '완료';
  checkBtn.addEventListener('click', () => {
    container.classList.toggle('completed');
    updateCallback();
  });
  
  const colors = ['none', 'yellow', 'pink', 'green'];
  colors.forEach(c => {
    const cBtn = document.createElement('div');
    cBtn.className = `toolbar-btn color-btn c-${c}`;
    cBtn.title = c === 'none' ? '기본색' : '형광펜';
    cBtn.addEventListener('click', () => {
      container.classList.remove('hl-yellow', 'hl-pink', 'hl-green');
      if (c !== 'none') container.classList.add(`hl-${c}`);
      container.dataset.color = c;
      updateCallback();
    });
    toolbar.appendChild(cBtn);
  });
  toolbar.appendChild(checkBtn);
  return toolbar;
}

function renderMemos() {
  memoList.innerHTML = '';
  memoData.forEach((memo) => {
    const memoDiv = document.createElement('div');
    memoDiv.className = 'memo-item';
    if (memo.completed) memoDiv.classList.add('completed');
    if (memo.color && memo.color !== 'none') memoDiv.classList.add(`hl-${memo.color}`);
    memoDiv.dataset.color = memo.color || 'none';
    
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'memo-title-input';
    titleInput.placeholder = '제목';
    titleInput.value = memo.title || '';
    
    const contentTextarea = document.createElement('textarea');
    contentTextarea.className = 'memo-content-textarea';
    contentTextarea.placeholder = '메모 내용...';
    contentTextarea.value = memo.content || '';

    titleInput.addEventListener('input', updateMemoDataFromDOM);
    contentTextarea.addEventListener('input', updateMemoDataFromDOM);
    
    memoDiv.addEventListener('focusout', () => {
      setTimeout(() => {
        if (!memoDiv.contains(document.activeElement)) {
          if (titleInput.value.trim() === '' && contentTextarea.value.trim() === '') {
            memoDiv.remove();
            updateMemoDataFromDOM();
          }
        }
      }, 0);
    });

    const toolbar = createToolbar(memoDiv, updateMemoDataFromDOM);
    addDragEvents(memoDiv, updateMemoDataFromDOM);

    memoDiv.appendChild(toolbar);
    memoDiv.appendChild(titleInput);
    memoDiv.appendChild(contentTextarea);
    memoList.appendChild(memoDiv);
  });
}

// 네비게이션 및 뷰 로직
function navigate(direction) {
  if (currentView === 'monthly') {
    currentDate.setMonth(currentDate.getMonth() + direction);
  } else {
    currentDate.setDate(currentDate.getDate() + (direction * 7));
  }
  render();
}

function setView(view, targetDate = null) {
  currentView = view;
  if (targetDate) currentDate = new Date(targetDate);
  
  if (view === 'monthly') {
    monthlyViewBtn.classList.add('active');
    weeklyViewBtn.classList.remove('active');
    monthlyView.classList.remove('hidden');
    weeklyView.classList.add('hidden');
  } else {
    monthlyViewBtn.classList.remove('active');
    weeklyViewBtn.classList.add('active');
    monthlyView.classList.add('hidden');
    weeklyView.classList.remove('hidden');
  }
  render();
}

function render() {
  if (currentView === 'monthly') {
    currentDateDisplay.textContent = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;
    renderMonthlyView();
  } else {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day < startDayOfWeek ? -7 : 0) + startDayOfWeek;
    const weekStart = new Date(d.setDate(diff));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    currentDateDisplay.textContent = `${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 - ${weekEnd.getMonth() + 1}월 ${weekEnd.getDate()}일`;
    renderWeeklyView(weekStart);
  }
}

function formatDateKey(year, month, date) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
}

function updateDataFromDOM(dateKey, itemsDiv) {
  const wrappers = itemsDiv.querySelectorAll('.item-wrapper');
  const newItems = [];
  
  wrappers.forEach(wrapper => {
    const input = wrapper.querySelector('.schedule-input');
    const text = input.value;
    if (text.trim() !== '') {
      newItems.push({
        text: text,
        completed: wrapper.classList.contains('completed'),
        color: wrapper.dataset.color || 'none'
      });
    }
  });
  
  if (newItems.length > 0) {
    scheduleData[dateKey] = newItems;
  } else {
    delete scheduleData[dateKey];
  }
  localStorage.setItem('scheduler_data', JSON.stringify(scheduleData));
}

// 월간 뷰
function renderMonthlyView() {
  calendarGrid.innerHTML = '';
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let i = 0; i < firstDay; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'calendar-day empty';
    calendarGrid.appendChild(emptyDiv);
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    
    const today = new Date();
    if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
      dayDiv.classList.add('today');
    }
    
    const currDayOfWeek = new Date(year, month, i).getDay();
    const dateKey = formatDateKey(year, month, i);
    const isHoliday = holidayData[dateKey];
    
    let numClass = 'date-num';
    if (currDayOfWeek === 0 || isHoliday) {
      numClass += ' sunday';
      dayDiv.classList.add('is-sunday');
    } else if (currDayOfWeek === 6) {
      numClass += ' saturday';
      dayDiv.classList.add('is-saturday');
    }
    
    dayDiv.innerHTML = `<div class="${numClass}">${i}</div>`;
    const items = scheduleData[dateKey] || [];
    
    if (items.length > 0) {
      const previewDiv = document.createElement('div');
      previewDiv.className = 'month-schedule-preview';
      
      for(let j=0; j<Math.min(2, items.length); j++) {
        const line = document.createElement('div');
        line.className = 'month-schedule-item';
        if (items[j].completed) line.style.textDecoration = 'line-through';
        line.textContent = items[j].text;
        previewDiv.appendChild(line);
      }
      if (items.length > 2) {
        const line3 = document.createElement('div');
        line3.className = 'month-schedule-more';
        line3.textContent = '...';
        previewDiv.appendChild(line3);
      }
      dayDiv.appendChild(previewDiv);
    }
    
    dayDiv.addEventListener('click', () => setView('weekly', new Date(year, month, i)));
    calendarGrid.appendChild(dayDiv);
  }
}

// 주간 뷰
function renderWeeklyView(weekStart) {
  weeklyList.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const currDay = new Date(weekStart);
    currDay.setDate(weekStart.getDate() + i);
    const dateKey = formatDateKey(currDay.getFullYear(), currDay.getMonth(), currDay.getDate());
    const dayName = daysOfWeekNames[currDay.getDay()];
    
    const dayDiv = document.createElement('div');
    dayDiv.className = 'weekly-day';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'weekly-day-header';
    let dayClass = '';
    const isHoliday = holidayData[dateKey];
    if (currDay.getDay() === 0 || isHoliday) dayClass = 'sunday';
    else if (currDay.getDay() === 6) dayClass = 'saturday';
    
    headerDiv.innerHTML = `
      <span class="${dayClass}">${currDay.getMonth() + 1}/${currDay.getDate()} (${dayName})</span>
      <div class="header-btns">
        <button class="holiday-btn ${isHoliday ? 'active' : ''}" title="공휴일 지정">🚩</button>
        <button class="add-btn" title="일정 추가">+</button>
      </div>
    `;
    
    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'schedule-items';
    
    const items = scheduleData[dateKey] || [];
    items.forEach((itemObj) => {
      const inputWrapper = createScheduleInput(dateKey, itemObj, itemsDiv);
      itemsDiv.appendChild(inputWrapper);
    });
    
    dayDiv.appendChild(headerDiv);
    dayDiv.appendChild(itemsDiv);
    weeklyList.appendChild(dayDiv);
    
    headerDiv.querySelector('.add-btn').addEventListener('click', () => {
      const newWrapper = createScheduleInput(dateKey, {text: '', completed: false, color: 'none'}, itemsDiv);
      itemsDiv.appendChild(newWrapper);
      newWrapper.querySelector('.schedule-input').focus();
    });

    headerDiv.querySelector('.holiday-btn').addEventListener('click', () => {
      if (holidayData[dateKey]) {
        delete holidayData[dateKey];
      } else {
        holidayData[dateKey] = true;
      }
      localStorage.setItem('scheduler_holiday_data', JSON.stringify(holidayData));
      render();
    });
  }
}

function createScheduleInput(dateKey, itemObj, itemsDiv) {
  const wrapper = document.createElement('div');
  wrapper.className = 'item-wrapper';
  if (itemObj.completed) wrapper.classList.add('completed');
  if (itemObj.color && itemObj.color !== 'none') wrapper.classList.add(`hl-${itemObj.color}`);
  wrapper.dataset.color = itemObj.color || 'none';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'schedule-input';
  input.value = itemObj.text || '';
  input.placeholder = '일정을 입력하세요...';
  
  const toolbar = createToolbar(wrapper, () => updateDataFromDOM(dateKey, itemsDiv));
  
  wrapper.appendChild(toolbar);
  wrapper.appendChild(input);
  
  input.addEventListener('input', () => updateDataFromDOM(dateKey, itemsDiv));
  
  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (!wrapper.contains(document.activeElement)) {
        if (input.value.trim() === '') {
          wrapper.remove();
          updateDataFromDOM(dateKey, itemsDiv);
        }
      }
    }, 0);
  });
  
  addDragEvents(wrapper, () => updateDataFromDOM(dateKey, itemsDiv));
  
  return wrapper;
}

// 초기 렌더링
render();
renderMemos();
