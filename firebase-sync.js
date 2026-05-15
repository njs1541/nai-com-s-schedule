// 파이어베이스 설정 (사용자 제공)
const firebaseConfig = {
  apiKey: "AIzaSyB_i2053L58bog0BH6diQrnyrn8jvIfytQ",
  authDomain: "js-scheduler-df66d.firebaseapp.com",
  projectId: "js-scheduler-df66d",
  storageBucket: "js-scheduler-df66d.firebasestorage.app",
  messagingSenderId: "1047448576190",
  appId: "1:1047448576190:web:920566305b46d579a2feef"
};

// 파이어베이스 초기화
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// UI 엘리먼트
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

let currentUser = null;
let unsubscribe = null;
let isSyncingFromServer = false;

// 1. 구글 로그인 및 로그아웃 기능
loginBtn.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch((error) => {
    console.error("로그인 에러:", error);
    alert("로그인 중 오류가 발생했습니다.\n\n에러 내용: " + error.message);
  });
});

logoutBtn.addEventListener('click', () => {
  auth.signOut().then(() => {
    alert("로그아웃 되었습니다. 현재 브라우저의 데이터만 사용합니다.");
    // 로그아웃 시 기존 데이터 초기화 원할 경우 추가 (선택사항)
  });
});

// 2. 사용자 상태 변화 감지
auth.onAuthStateChanged((user) => {
  if (user) {
    // 로그인 상태
    currentUser = user;
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    
    // 이전에 듣고 있던 리스너 해제
    if (unsubscribe) unsubscribe();
    
    // 데이터 불러오기 및 실시간 동기화 (구독)
    subscribeToUserData(user.uid);
  } else {
    // 로그아웃 상태
    currentUser = null;
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }
});

// 깊은 비교(Deep Equal) 함수: JSON.stringify는 객체 키 순서가 다르면 다르다고 판단하는 버그 방지용
function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || typeof a != "object" || b == null || typeof b != "object") return false;
  
  let keysA = Object.keys(a), keysB = Object.keys(b);
  if (keysA.length != keysB.length) return false;
  
  for (let key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 3. 서버에서 데이터 불러오기 (실시간 반영)
function subscribeToUserData(uid) {
  unsubscribe = db.collection('users').doc(uid).onSnapshot((doc) => {
    if (doc.exists) {
      // 내가 방금 입력(저장)해서 발생한 이벤트인 경우, 화면을 다시 그리면 입력창 포커스가 날아가므로 무시함
      if (doc.metadata.hasPendingWrites) {
        return;
      }

      const data = doc.data();
      
      // 실제 데이터가 변경되었는지 확인 (서버 응답으로 인한 불필요한 새로고침 방지)
      const isDataChanged = 
        !deepEqual(scheduleData, data.scheduleData || {}) ||
        !deepEqual(memoData, data.memoData || []) ||
        !deepEqual(holidayData, data.holidayData || {}) ||
        !deepEqual(typeof weeklyMemoData !== 'undefined' ? weeklyMemoData : {}, data.weeklyMemoData || {});

      if (!isDataChanged) {
        return; // 바뀐 내용이 없으면 화면을 다시 그리지 않음
      }

      // 무한 루프 방지용 플래그
      isSyncingFromServer = true;

      // 파이어베이스의 데이터를 로컬 변수에 덮어쓰기
      if (data.scheduleData) {
        scheduleData = data.scheduleData;
        localStorage.setItem('scheduler_data', JSON.stringify(scheduleData));
      }
      if (data.memoData) {
        memoData = data.memoData;
        localStorage.setItem('scheduler_memo_data', JSON.stringify(memoData));
      }
      if (data.holidayData) {
        holidayData = data.holidayData;
        localStorage.setItem('scheduler_holiday_data', JSON.stringify(holidayData));
      }
      if (data.weeklyMemoData) {
        weeklyMemoData = data.weeklyMemoData;
        localStorage.setItem('scheduler_weekly_memo_data', JSON.stringify(weeklyMemoData));
      }

      isSyncingFromServer = false;

      // 화면 다시 그리기 (app.js의 함수 호출)
      if (typeof render === 'function') render();
      if (typeof renderMemos === 'function') renderMemos();
    } else {
      // 서버에 데이터가 없으면 현재 로컬 데이터를 서버로 1회 업로드
      syncToFirebase();
    }
  }, (error) => {
    console.error("데이터 동기화 에러:", error);
  });
}

// 4. 로컬 데이터가 바뀔 때 서버로 전송하기 (디바운싱 적용)
let syncTimeout = null;

function syncToFirebase() {
  if (!currentUser || isSyncingFromServer) return;
  
  // 타이핑할 때마다 서버로 전송하는 것을 막기 위해, 1초 동안 추가 입력이 없으면 전송
  if (syncTimeout) clearTimeout(syncTimeout);
  
  syncTimeout = setTimeout(() => {
    const data = {
      scheduleData: scheduleData,
      memoData: memoData,
      holidayData: holidayData,
      weeklyMemoData: typeof weeklyMemoData !== 'undefined' ? weeklyMemoData : {},
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('users').doc(currentUser.uid).set(data, { merge: true })
      .catch((error) => console.error("데이터 저장 실패:", error));
  }, 1000);
}

// app.js가 localStorage에 데이터를 저장할 때 자동으로 가로채서 서버로도 보내는 트릭
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  // 원래 저장 기능 그대로 수행
  originalSetItem.apply(this, arguments);
  
  // 우리가 관리하는 스케줄 데이터가 저장될 때만 파이어베이스 연동
  if (key === 'scheduler_data' || 
      key === 'scheduler_memo_data' || 
      key === 'scheduler_holiday_data' || 
      key === 'scheduler_weekly_memo_data') {
     syncToFirebase();
  }
};
