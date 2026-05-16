// 상태 변수
let currentDate = new Date(); // 현재 보고 있는 기준 날짜 (월간/주간 공통)
let currentView = 'monthly'; // 'monthly' 또는 'weekly'
let startDayOfWeek = 0; // 주간 뷰의 시작 요일 (0: 일요일, 1: 월요일)
let scheduleData = JSON.parse(localStorage.getItem('scheduler_data')) || {}; // 로컬스토리지에서 데이터 불러오기
let memoData = JSON.parse(localStorage.getItem('scheduler_memo_data')) || [];
let holidayData = JSON.parse(localStorage.getItem('scheduler_holiday_data')) || {}; // 공휴일 데이터 추가
let weeklyMemoData = JSON.parse(localStorage.getItem('scheduler_weekly_memo_data')) || {}; // 주간 메모 데이터 추가

// 대한민국 공휴일 데이터 (2024~2027)
const SYSTEM_HOLIDAYS = {
  // 2024
  "2024-01-01": "신정",
  "2024-02-09": "설날", "2024-02-10": "설날", "2024-02-11": "설날", "2024-02-12": "대체공휴일(설날)",
  "2024-03-01": "삼일절",
  "2024-04-10": "제22대 국회의원 선거",
  "2024-05-05": "어린이날", "2024-05-06": "대체공휴일(어린이날)",
  "2024-05-15": "부처님오신날",
  "2024-06-06": "현충일",
  "2024-08-15": "광복절",
  "2024-09-16": "추석", "2024-09-17": "추석", "2024-09-18": "추석",
  "2024-10-03": "개천절",
  "2024-10-09": "한글날",
  "2024-12-25": "성탄절",
  // 2025
  "2025-01-01": "신정",
  "2025-01-28": "설날", "2025-01-29": "설날", "2025-01-30": "설날",
  "2025-03-01": "삼일절", "2025-03-03": "대체공휴일(삼일절)",
  "2025-05-05": "어린이날/부처님오신날", "2025-05-06": "대체공휴일",
  "2025-06-06": "현충일",
  "2025-08-15": "광복절",
  "2025-10-03": "개천절",
  "2025-10-05": "추석", "2025-10-06": "추석", "2025-10-07": "추석", "2025-10-08": "대체공휴일(추석)",
  "2025-10-09": "한글날",
  "2025-12-25": "성탄절",
  // 2026
  "2026-01-01": "신정",
  "2026-02-16": "설날", "2026-02-17": "설날", "2026-02-18": "설날",
  "2026-03-01": "삼일절", "2026-03-02": "대체공휴일(삼일절)",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날", "2026-05-25": "대체공휴일(부처님오신날)",
  "2026-06-06": "현충일",
  "2026-07-17": "제헌절",
  "2026-08-15": "광복절", "2026-08-17": "대체공휴일(광복절)",
  "2026-10-03": "개천절", "2026-10-05": "대체공휴일(개천절)",
  "2026-09-24": "추석", "2026-09-25": "추석", "2026-09-26": "추석",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절",
  // 2027
  "2027-01-01": "신정",
  "2027-02-06": "설날", "2027-02-07": "설날", "2027-02-08": "설날", "2027-02-09": "대체공휴일(설날)",
  "2027-03-01": "삼일절",
  "2027-05-05": "어린이날",
  "2027-05-13": "부처님오신날",
  "2027-06-06": "현충일",
  "2027-07-17": "제헌절", "2027-07-19": "대체공휴일(제헌절)",
  "2027-08-15": "광복절", "2027-08-16": "대체공휴일(광복절)",
  "2027-10-03": "개천절", "2027-10-04": "대체공휴일(개천절)",
  "2027-09-14": "추석", "2027-09-15": "추석", "2027-09-16": "추석",
  "2027-10-09": "한글날",
  "2027-12-25": "성탄절"
};

function checkIsHoliday(dateKey) {
  if (holidayData[dateKey] !== undefined) {
    return holidayData[dateKey];
  }
  return !!SYSTEM_HOLIDAYS[dateKey];
}

// 데이터 마이그레이션 (버전 체크를 통해 한 번만 실행)
const APP_VERSION = '1.1';
const currentSavedVersion = localStorage.getItem('scheduler_app_version');

if (currentSavedVersion !== APP_VERSION) {
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
  
  localStorage.setItem('scheduler_app_version', APP_VERSION);
}

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
const closeMemoBtn = document.getElementById('close-memo-btn');
const memoList = document.getElementById('memo-list');

const bannerArea = document.getElementById('banner-area');
const bannerImg = document.getElementById('banner-img');
const bannerTitle = document.getElementById('banner-title');
const bannerTitleInput = document.getElementById('banner-title-input');
const bannerUrlInput = document.getElementById('banner-url-input');
const bannerFileInput = document.getElementById('banner-file-input');
const deleteBannerImgBtn = document.getElementById('delete-banner-img-btn');
const darkModeToggle = document.getElementById('dark-mode-toggle');

const searchBtn = document.getElementById('search-btn');
const searchPanel = document.getElementById('search-panel');
const closeSearchBtn = document.getElementById('close-search-btn');
const searchInput = document.getElementById('search-input');
const filterCompleted = document.getElementById('filter-completed');
const searchResults = document.getElementById('search-results');

// 모바일 액션 바 관련
const mobileActionBar = document.getElementById('mobile-action-bar');
const mobileCheckBtn = document.getElementById('mobile-check-btn');
const mobileDeleteBtn = document.getElementById('mobile-delete-btn');
const mobileColorDots = document.querySelectorAll('.color-dot');

let activeItemWrapper = null;
let activeItemDateKey = null;
let activeItemItemsDiv = null;
let hideActionBarTimeout = null;

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
  const upload = localStorage.getItem('scheduler_banner_upload') || '';
  
  // 입력 필드 값 동기화
  bannerTitleInput.value = title;
  bannerUrlInput.value = url;

  if (title || url || upload) {
    bannerArea.classList.remove('hidden');
    document.body.classList.add('has-banner');

    // 제목 표시 여부
    if (title) {
      bannerTitle.textContent = title;
      bannerTitle.classList.remove('hidden');
    } else {
      bannerTitle.classList.add('hidden');
    }

    // 이미지 표시 여부 (URL 또는 업로드 파일)
    if (url || upload) {
      const newSrc = url || upload;
      if (bannerImg.src !== newSrc) {
        bannerImg.src = newSrc;
      }
      bannerImg.classList.remove('hidden');
    } else {
      bannerImg.src = '';
      bannerImg.classList.add('hidden');
      bannerFileInput.value = ''; // 파일 필드도 함께 초기화
    }
  } else {
    bannerArea.classList.add('hidden');
    document.body.classList.remove('has-banner');
    bannerTitle.classList.add('hidden');
    bannerImg.classList.add('hidden');
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
    localStorage.removeItem('scheduler_banner_upload');
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
  const url = localStorage.getItem('scheduler_banner_url');
  const upload = localStorage.getItem('scheduler_banner_upload');
  if ((url || upload) && e.target.value !== '') {
    alert('이미 설정된 배너 이미지가 있습니다. 이미지 URL을 지우거나 배너 이미지를 삭제한 후 제목을 입력해 주세요.');
    e.target.value = '';
    return;
  }
  localStorage.setItem('scheduler_banner_title', e.target.value);
  renderBanner();
});

bannerUrlInput.addEventListener('input', (e) => {
  const title = localStorage.getItem('scheduler_banner_title');
  const upload = localStorage.getItem('scheduler_banner_upload');
  if ((title || upload) && e.target.value !== '') {
    alert('이미 설정된 배너 제목이나 업로드된 이미지가 있습니다. 해당 항목을 삭제한 후 URL을 입력해 주세요.');
    e.target.value = '';
    return;
  }
  localStorage.setItem('scheduler_banner_url', e.target.value);
  renderBanner();
});

bannerFileInput.addEventListener('change', (e) => {
  const title = localStorage.getItem('scheduler_banner_title');
  const url = localStorage.getItem('scheduler_banner_url');
  if (title || url) {
    alert('이미 설정된 배너 제목이나 URL이 있습니다. 해당 항목을 삭제한 후 이미지를 업로드해 주세요.');
    e.target.value = '';
    return;
  }
  const file = e.target.files[0];
  if (file) {
    // 파일 크기 체크 (2MB 제한)
    if (file.size > 2 * 1024 * 1024) {
      alert('이미지 파일이 너무 큽니다. 2MB 이하의 파일을 업로드하거나 이미지 URL 기능을 이용해 주세요.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const base64 = event.target.result;
        localStorage.setItem('scheduler_banner_upload', base64);
        renderBanner();
      } catch (err) {
        console.error('Storage error:', err);
        alert('이미지를 저장하는 공간이 부족합니다. 다른 설정을 지우거나 더 작은 이미지를 사용해 주세요.');
      }
    };
    reader.onerror = () => {
      alert('파일을 읽는 도중 오류가 발생했습니다.');
    };
    reader.readAsDataURL(file);
  }
});

deleteBannerImgBtn.addEventListener('click', () => {
  localStorage.removeItem('scheduler_banner_url');
  localStorage.removeItem('scheduler_banner_upload');
  bannerUrlInput.value = '';
  bannerFileInput.value = '';
  renderBanner();
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
      bannerUpload: localStorage.getItem('scheduler_banner_upload') || '',
      darkMode: localStorage.getItem('scheduler_dark_mode') === 'true'
    },
    weeklyMemoData
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
        if (data.settings.bannerUpload !== undefined) {
          localStorage.setItem('scheduler_banner_upload', data.settings.bannerUpload);
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
      if (data.weeklyMemoData) {
        weeklyMemoData = data.weeklyMemoData;
        localStorage.setItem('scheduler_weekly_memo_data', JSON.stringify(weeklyMemoData));
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

if (closeMemoBtn) {
  closeMemoBtn.addEventListener('click', () => {
    memoPanel.classList.add('hidden');
    memoBtn.classList.remove('active');
  });
}

// 검색 패널 토글
searchBtn.addEventListener('click', () => {
  const isHidden = searchPanel.classList.toggle('hidden');
  if (isHidden) {
    searchBtn.classList.remove('active');
  } else {
    searchBtn.classList.add('active');
    searchInput.focus();
    performSearch(); // 열릴 때 검색 수행
  }
});

closeSearchBtn.addEventListener('click', () => {
  searchPanel.classList.add('hidden');
  searchBtn.classList.remove('active');
});

// 검색 입력 및 필터 이벤트
searchInput.addEventListener('input', performSearch);
filterCompleted.addEventListener('change', performSearch);

function performSearch() {
  const query = searchInput.value.trim().toLowerCase();
  const hideCompleted = filterCompleted.checked;
  searchResults.innerHTML = '';
  
  if (query === '') {
    searchResults.innerHTML = '<p style="text-align:center; opacity:0.5;">검색어를 입력하세요.</p>';
    return;
  }
  
  let foundCount = 0;
  // 전체 날짜 순회
  const sortedDates = Object.keys(scheduleData).sort();
  
  sortedDates.forEach(dateKey => {
    const items = scheduleData[dateKey];
    items.forEach(item => {
      const matchText = item.text.toLowerCase().includes(query);
      const isCompleted = item.completed;
      
      if (matchText && (!hideCompleted || !isCompleted)) {
        foundCount++;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'search-result-item';
        
        const dateObj = new Date(dateKey);
        const dateStr = `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
        
        itemDiv.innerHTML = `
          <div class="search-result-date">${dateStr}</div>
          <div class="search-result-text ${isCompleted ? 'completed' : ''}">${item.text}</div>
        `;
        
        itemDiv.addEventListener('click', () => {
          setView('weekly', dateKey);
          if (window.innerWidth < 900) searchPanel.classList.add('hidden'); // 모바일 배려
        });
        
        searchResults.appendChild(itemDiv);
      }
    });
  });
  
  if (foundCount === 0) {
    searchResults.innerHTML = '<p style="text-align:center; opacity:0.5;">검색 결과가 없습니다.</p>';
  }
}

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
  // 모든 요소에서 drag-over 클래스 제거 (혹시 남을 경우 대비)
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  draggedItem = null;
}

// [모바일 터치 드래그 로직]
let touchTimer = null;
let touchClone = null;

function handleTouchStart(e) {
  if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;
  const touch = e.touches[0];
  const targetItem = this;
  
  touchTimer = setTimeout(() => {
    draggedItem = targetItem;
    targetItem.classList.add('dragging');
    
    touchClone = targetItem.cloneNode(true);
    touchClone.style.position = 'fixed';
    touchClone.style.zIndex = '9999';
    touchClone.style.opacity = '0.8';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.width = targetItem.offsetWidth + 'px';
    document.body.appendChild(touchClone);
    
    moveClone(touch);
    if (navigator.vibrate) navigator.vibrate(50);
  }, 400); // 400ms 길게 누르기
}

function moveClone(touch) {
  if (!touchClone) return;
  touchClone.style.left = (touch.clientX - touchClone.offsetWidth / 2) + 'px';
  touchClone.style.top = (touch.clientY - touchClone.offsetHeight / 2) + 'px';
}

function handleTouchMove(e) {
  if (!draggedItem) {
    clearTimeout(touchTimer);
    return;
  }
  
  e.preventDefault(); // 스크롤 방지
  const touch = e.touches[0];
  moveClone(touch);
  
  const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!elemBelow) return;
  
  const targetItem = elemBelow.closest('.item-wrapper, .memo-item');
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  
  if (targetItem && targetItem !== draggedItem && targetItem.parentNode === draggedItem.parentNode) {
    targetItem.classList.add('drag-over');
  }
}

function handleTouchEnd(e) {
  clearTimeout(touchTimer);
  if (!draggedItem) return;
  
  if (touchClone) {
    touchClone.remove();
    touchClone = null;
  }
  
  draggedItem.classList.remove('dragging');
  
  const targetItem = document.querySelector('.drag-over');
  if (targetItem) {
    targetItem.classList.remove('drag-over');
    
    const container = draggedItem.parentNode;
    const allItems = [...container.children];
    const draggedIdx = allItems.indexOf(draggedItem);
    const targetIdx = allItems.indexOf(targetItem);
    
    if (draggedIdx < targetIdx) {
      container.insertBefore(draggedItem, targetItem.nextSibling);
    } else {
      container.insertBefore(draggedItem, targetItem);
    }
    
    if (currentDragCallback) currentDragCallback();
  }
  
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

  // 모바일 터치 이벤트
  elem.addEventListener('touchstart', function(e) {
    currentDragCallback = updateCallback;
    handleTouchStart.call(this, e);
  }, { passive: false });
  elem.addEventListener('touchmove', handleTouchMove, { passive: false });
  elem.addEventListener('touchend', handleTouchEnd);
  elem.addEventListener('touchcancel', handleTouchEnd);
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
  
  // 형광펜 버튼들을 그룹화
  const colorGroup = document.createElement('div');
  colorGroup.className = 'color-group';
  
  const toggleBtn = document.createElement('div');
  toggleBtn.className = 'toolbar-btn hl-toggle-btn';
  toggleBtn.innerHTML = '🖍️';
  toggleBtn.title = '형광펜 펼치기/접기';
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = colorGroup.classList.toggle('expanded');
    toggleBtn.classList.toggle('active', isExpanded);
  });

  colors.forEach(c => {
    const cBtn = document.createElement('div');
    cBtn.className = `toolbar-btn color-btn c-${c}`;
    cBtn.title = c === 'none' ? '기본색' : '형광펜';
    cBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      container.classList.remove('hl-yellow', 'hl-pink', 'hl-green');
      if (c !== 'none') container.classList.add(`hl-${c}`);
      container.dataset.color = c;
      updateCallback();
      // 색상 선택 후 자동으로 접기 (선택 사항)
      colorGroup.classList.remove('expanded');
      toggleBtn.classList.remove('active');
    });
    colorGroup.appendChild(cBtn);
  });

  const deleteBtn = document.createElement('div');
  deleteBtn.className = 'toolbar-btn delete-btn';
  deleteBtn.innerHTML = '×';
  deleteBtn.title = '삭제';
  deleteBtn.addEventListener('click', () => {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
      container.remove();
      updateCallback();
    }
  });

  toolbar.appendChild(checkBtn);
  toolbar.appendChild(toggleBtn);
  toolbar.appendChild(colorGroup);
  toolbar.appendChild(deleteBtn);
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

// 초기 로딩 시 기본 상태를 history에 저장
history.replaceState({ view: currentView, date: currentDate.getTime() }, '');

function setView(view, targetDate = null, isBack = false) {
  const previousView = currentView;
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
  
  // 뷰가 변경될 때마다 히스토리 추가 (뒤로가기 대응)
  if (!isBack && previousView !== view) {
    history.pushState({ view: view, date: currentDate.getTime() }, '');
  }
  
  render();
}

// 브라우저 뒤로가기(마우스 뒤로가기 버튼 포함) 이벤트 처리
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.view) {
    setView(e.state.view, new Date(e.state.date), true);
  } else {
    setView('monthly', null, true);
  }
});

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
  if (!searchPanel.classList.contains('hidden')) performSearch();
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
    const isHoliday = checkIsHoliday(dateKey);
    
    let numClass = 'date-num';
    if (currDayOfWeek === 0 || isHoliday) {
      numClass += ' sunday';
      dayDiv.classList.add('is-sunday');
    } else if (currDayOfWeek === 6) {
      numClass += ' saturday';
      dayDiv.classList.add('is-saturday');
    }
    
    const holidayName = SYSTEM_HOLIDAYS[dateKey];
    dayDiv.innerHTML = `<div class="${numClass}">${i}${holidayName ? `<span class="holiday-name">${holidayName}</span>` : ''}</div>`;
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

function setupWeeklyMoreBtn(dateKey, itemsDiv) {
  // 기존 버튼 제거
  const existingBtn = itemsDiv.querySelector('.weekly-more-btn');
  if (existingBtn) existingBtn.remove();

  const wrappers = itemsDiv.querySelectorAll('.item-wrapper');
  if (wrappers.length <= 1) return;

  const moreBtn = document.createElement('div');
  moreBtn.className = 'weekly-more-btn';
  // 현재 상태가 펼쳐져 있는지 확인 (새로 추가할 때는 보통 펼침 상태를 원함)
  const isCurrentlyExpanded = wrappers[1].classList.contains('show');
  
  if (isCurrentlyExpanded) {
    moreBtn.classList.add('expanded');
    moreBtn.textContent = '접기';
  } else {
    moreBtn.textContent = `...외 ${wrappers.length - 1}개`;
  }

  moreBtn.addEventListener('click', () => {
    const isExpanded = moreBtn.classList.toggle('expanded');
    const hiddenItems = itemsDiv.querySelectorAll('.collapsed-item');
    hiddenItems.forEach(el => el.classList.toggle('show', isExpanded));
    moreBtn.textContent = isExpanded ? '접기' : `...외 ${wrappers.length - 1}개`;
  });
  itemsDiv.appendChild(moreBtn);
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
    const isHoliday = checkIsHoliday(dateKey);
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
    items.forEach((itemObj, idx) => {
      const inputWrapper = createScheduleInput(dateKey, itemObj, itemsDiv);
      if (idx > 0) inputWrapper.classList.add('collapsed-item');
      itemsDiv.appendChild(inputWrapper);
    });

    setupWeeklyMoreBtn(dateKey, itemsDiv);
    
    dayDiv.appendChild(headerDiv);
    dayDiv.appendChild(itemsDiv);
    weeklyList.appendChild(dayDiv);
    
    headerDiv.querySelector('.add-btn').addEventListener('click', () => {
      // 새로운 항목 추가 시 기존의 접힌 항목들도 모두 펼치기
      const hiddenItems = itemsDiv.querySelectorAll('.collapsed-item');
      hiddenItems.forEach(el => el.classList.add('show'));

      const allWrappers = itemsDiv.querySelectorAll('.item-wrapper');
      const newWrapper = createScheduleInput(dateKey, {text: '', completed: false, color: 'none'}, itemsDiv);
      
      if (allWrappers.length > 0) {
        newWrapper.classList.add('collapsed-item');
        newWrapper.classList.add('show'); // 추가된 본인도 표시
      }
      
      // 버튼보다 앞에 삽입
      const moreBtn = itemsDiv.querySelector('.weekly-more-btn');
      if (moreBtn) {
        itemsDiv.insertBefore(newWrapper, moreBtn);
      } else {
        itemsDiv.appendChild(newWrapper);
      }

      setupWeeklyMoreBtn(dateKey, itemsDiv);
      newWrapper.querySelector('.schedule-input').focus();
    });

    headerDiv.querySelector('.holiday-btn').addEventListener('click', () => {
      const currentIsHoliday = checkIsHoliday(dateKey);
      if (currentIsHoliday) {
        // 현재 공휴일이면 -> 해제 (명시적으로 false 저장)
        holidayData[dateKey] = false;
      } else {
        // 현재 공휴일이 아니면 -> 지정 (명시적으로 true 저장)
        holidayData[dateKey] = true;
      }
      
      // 최적화: 기본 시스템 공휴일 값과 동일해지면 굳이 저장할 필요 없으므로 삭제
      if (holidayData[dateKey] === !!SYSTEM_HOLIDAYS[dateKey]) {
        delete holidayData[dateKey];
      }
      
      localStorage.setItem('scheduler_holiday_data', JSON.stringify(holidayData));
      render();
    });
  }

  // 주간 메모 영역 추가 (renderWeeklyView 끝부분)
  const weekStartKey = formatDateKey(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
  const memoArea = document.createElement('div');
  memoArea.className = 'weekly-memo-area';
  
  const textarea = document.createElement('textarea');
  textarea.className = 'weekly-memo-textarea';
  textarea.placeholder = '이 주차의 메모를 입력하세요...';
  textarea.value = weeklyMemoData[weekStartKey] || '';
  
  textarea.addEventListener('input', (e) => {
    const val = e.target.value;
    if (val.trim() === '') {
      delete weeklyMemoData[weekStartKey];
    } else {
      weeklyMemoData[weekStartKey] = val;
    }
    localStorage.setItem('scheduler_weekly_memo_data', JSON.stringify(weeklyMemoData));
  });
  
  memoArea.appendChild(textarea);
  weeklyList.appendChild(memoArea);

  // 주간 메모는 모바일 액션 바 적용 제외 (필요 시 추가 가능)
}

function handleInputFocus(wrapper, dateKey, itemsDiv) {
  clearTimeout(hideActionBarTimeout);
  activeItemWrapper = wrapper;
  activeItemDateKey = dateKey;
  activeItemItemsDiv = itemsDiv;

  updateMobileActionBarState();
  mobileActionBar.classList.add('active');
}

function handleInputBlur() {
  // 버튼 클릭을 위해 약간의 지연 후 숨김
  hideActionBarTimeout = setTimeout(() => {
    mobileActionBar.classList.remove('active');
    activeItemWrapper = null;
  }, 200);
}

function updateMobileActionBarState() {
  if (!activeItemWrapper) return;

  const isCompleted = activeItemWrapper.classList.contains('completed');
  const currentColor = activeItemWrapper.dataset.color || 'none';

  mobileCheckBtn.classList.toggle('active', isCompleted);
  
  mobileColorDots.forEach(dot => {
    dot.classList.toggle('selected', dot.dataset.color === currentColor);
  });
}

// 액션 바 클릭 시 블러 방지 (여백 클릭 포함)
mobileActionBar.addEventListener('pointerdown', (e) => {
  // 바 내부 어디를 누르더라도 입력창의 포커스를 유지함 (키보드 닫힘 방지)
  e.preventDefault();
  clearTimeout(hideActionBarTimeout);
});

// 모바일 액션 바 버튼 이벤트 (pointerdown 사용으로 클릭 씹힘 및 화면 깜빡임 방지)
mobileCheckBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault(); // 이벤트 전파 및 포커스 유실 방지
  e.stopPropagation();
  if (!activeItemWrapper) return;
  
  activeItemWrapper.classList.toggle('completed');
  updateDataFromDOM(activeItemDateKey, activeItemItemsDiv);
  updateMobileActionBarState();
});

mobileColorDots.forEach(dot => {
  dot.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeItemWrapper) return;
    
    const color = dot.dataset.color;
    activeItemWrapper.classList.remove('hl-yellow', 'hl-pink', 'hl-green');
    if (color !== 'none') activeItemWrapper.classList.add(`hl-${color}`);
    activeItemWrapper.dataset.color = color;
    
    updateDataFromDOM(activeItemDateKey, activeItemItemsDiv);
    updateMobileActionBarState();
  });
});

mobileDeleteBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (!activeItemWrapper) return;
  
  if (confirm('이 항목을 삭제하시겠습니까?')) {
    activeItemWrapper.remove();
    updateDataFromDOM(activeItemDateKey, activeItemItemsDiv);
    mobileActionBar.classList.remove('active');
    activeItemWrapper = null;
  }
});

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
  
  const toolbar = createToolbar(wrapper, () => {
    updateDataFromDOM(dateKey, itemsDiv);
    setupWeeklyMoreBtn(dateKey, itemsDiv);
  });
  
  wrapper.appendChild(toolbar);
  wrapper.appendChild(input);
  
  input.addEventListener('input', () => updateDataFromDOM(dateKey, itemsDiv));
  
  // 모바일 포커스 이벤트 추가
  input.addEventListener('focus', () => handleInputFocus(wrapper, dateKey, itemsDiv));
  input.addEventListener('blur', handleInputBlur);

  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (!wrapper.contains(document.activeElement)) {
        if (input.value.trim() === '') {
          wrapper.remove();
          updateDataFromDOM(dateKey, itemsDiv);
          setupWeeklyMoreBtn(dateKey, itemsDiv);
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

// 모바일 키보드 대응 액션바 위치 조정
if (window.visualViewport) {
  const updateActionBarPosition = () => {
    // 가상 키보드가 올라왔을 때의 offset 계산 (layout viewport의 bottom과 visual viewport의 bottom 차이)
    const offset = Math.max(0, window.innerHeight - (window.visualViewport.height + window.visualViewport.offsetTop));
    
    // 키보드가 올라왔을 때만 적용, 아니면 원래대로(bottom: 0)
    if (offset > 0) {
      mobileActionBar.style.bottom = offset + 'px';
      mobileActionBar.style.transition = 'none'; // 키보드 이동 시 지연 없이 따라가도록 트랜지션 해제
    } else {
      mobileActionBar.style.bottom = '0px';
      mobileActionBar.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s';
    }
  };

  window.visualViewport.addEventListener('resize', updateActionBarPosition);
  window.visualViewport.addEventListener('scroll', updateActionBarPosition);
}

// 서비스 워커 등록 (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.log('Service Worker registration failed', err));
  });
}

