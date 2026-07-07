# 🔥 Firebase Firestore 보안 규칙 설정 가이드

Firebase로부터 수신하신 **"Cloud Firestore 데이터베이스에 대한 클라이언트 액세스가 만료되었습니다"** 메일에 대응하여, 안전하고 영구적으로 동기화 기능을 사용할 수 있도록 보안 규칙을 업데이트하는 방법입니다.

기존에 설정되어 있던 '테스트 모드' 규칙은 보안상의 이유로 30일이 지나면 모든 접근을 차단하도록 되어 있었습니다. 
이번에 새로 제공해 드리는 규칙은 **구글 로그인을 완료한 사용자만 자신의 스케줄 데이터에 접근할 수 있도록 보안을 강화**하여, 메일로 받은 만료 문제와 보안 문제를 동시에 해결합니다.

아래 가이드를 따라 Firebase 콘솔에 규칙을 적용해 주세요.

---

## 🛠️ Firebase 콘솔에서 보안 규칙 직접 적용하기 (추천)

웹 브라우저를 통해 Firebase 콘솔에서 규칙을 직접 붙여넣는 가장 간단한 방법입니다.

### 1단계: Firebase 콘솔 접속
1. [Firebase 콘솔(https://console.firebase.google.com/)](https://console.firebase.google.com/)에 접속하여 로그인합니다.
2. 프로젝트 목록에서 **`js-Scheduler`** (혹은 `js-scheduler-df66d`) 프로젝트를 선택합니다.

### 2단계: Firestore Database 메뉴로 이동
1. 왼쪽 사이드바 메뉴에서 **빌드(Build)** 또는 **Firestore Database**를 클릭합니다.
2. 상단 탭 메뉴 중 **규칙(Rules)** 탭을 클릭합니다.

### 3단계: 규칙 수정 및 게시
1. 화면에 보이는 에디터 창의 기존 내용을 모두 지우고, 프로젝트 루트에 생성된 [firestore.rules](file:///c:/Users/NZIN/Downloads/개인%20개발분/nai-com-s-schedule/firestore.rules) 파일의 내용(아래 코드 block)을 복사하여 붙여넣습니다.

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // 로그인한 사용자만 본인의 데이터(문서 ID가 본인의 UID와 일치하는 경우)를 읽고 쓸 수 있도록 허용
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

2. 에디터 우측 상단의 **게시(Publish)** 버튼을 클릭하여 변경 사항을 적용합니다.
   * *주의: 반영되는 데 최대 1~2분이 소요될 수 있습니다.*

---

## 💻 Firebase CLI를 사용하여 배포하기 (개발자용 참고)

만약 로컬 환경에서 Firebase CLI 도구가 설치되어 있고 로그인되어 있다면 아래 방법을 사용할 수 있습니다.

1. 프로젝트 루트 폴더에 `firebase.json` 파일이 존재하는지 확인합니다. 없다면 다음과 같이 생성할 수 있습니다.
   ```json
   {
     "firestore": {
       "rules": "firestore.rules"
     }
   }
   ```
2. 터미널을 열고 다음 명령어를 실행하여 보안 규칙을 배포합니다.
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## ✅ 완료 후 정상 작동 확인 방법

보안 규칙을 적용한 뒤, 다음 단계를 거쳐 스케줄러가 정상 작동하는지 확인합니다.

1. 개발 중이거나 배포된 **가벼운 메모장 스케줄러** 웹사이트에 접속합니다.
2. **구글 로그인**을 수행합니다. (이미 로그인되어 있다면 로그아웃 후 다시 로그인해보는 것을 추천합니다.)
3. 새로운 일정이나 메모를 등록하고, 웹 브라우저 콘솔(`F12` -> Console)에 `데이터 저장 실패` 같은 Firestore 에러 로그가 발생하지 않는지 확인합니다.
4. 새로고침을 했을 때 방금 수정한 데이터가 정상적으로 불러와진다면 동기화가 성공적으로 복구된 것입니다!
