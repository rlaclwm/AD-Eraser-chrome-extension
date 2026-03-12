/**
 * ==========================================
 * AD Eraser - 확장 프로그램 핵심 로직 (popup.js)
 * ==========================================
 * 작성자: (본인 이름 기입)
 * 주요 기능:
 * 1. 완벽한 이벤트 차단 기반의 '광고 지우개 모드'
 * 2. 무한 슬라이딩 윈도우 기반의 히스토리 관리 (최대 500개 저장, 30개 단위 뷰)
 * 3. DOM 상태 조작(투명화)을 통한 즉각적인 개별/전체 복구 시스템
 */

// ==========================================
// 1. 다국어 지원 (i18n) 설정
// ==========================================
const i18nData = {
  ko: {
    appName: "AD Eraser",
    eraserMode: "광고 지우개 모드",
    restorePopups: "화면 전체 복구",
    selectedRestore: "선택 복구",
    showAll: "전체 보기",
    showRecent: "30개만 보기",
    skipConfirm: "확인창 없이 즉시 삭제",
    multiSelect: "여러 개 연속 선택 (ESC 종료)",
    historyTitle: "최근 삭제 내역",
    restore: "복구",
    emptyHistory: "내역 없음",
    confirmDelete: "이 광고를 지울까요?",
    alertRestore: "총 {count}개의 요소를 복구했습니다."
  },
  en: {
    appName: "AD Eraser",
    eraserMode: "AD Eraser Mode",
    restorePopups: "Restore All",
    selectedRestore: "Restore",
    showAll: "View All",
    showRecent: "View 30",
    skipConfirm: "Immediate delete",
    multiSelect: "Multi-select (ESC to exit)",
    historyTitle: "Recent History",
    restore: "Undo",
    emptyHistory: "No History",
    confirmDelete: "Do you want to erase this ad?",
    alertRestore: "Restored {count} elements."
  }
};

let currentLang = 'ko'; // 기본 언어
let showAllHistory = false; // '전체 보기' 토글 상태를 저장하는 전역 변수

/**
 * [UI] HTML 내 'data-i18n' 속성을 가진 요소들의 텍스트를 현재 언어에 맞게 변환합니다.
 */
function applyLanguage(lang) {
  currentLang = lang;
  const data = i18nData[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (data[key]) el.textContent = data[key];
  });
  renderHistoryList(); // 언어 변경 시 히스토리 내부의 버튼 텍스트도 새로고침
}

// ==========================================
// 2. 뷰(View) 렌더링 및 슬라이딩 윈도우 로직
// ==========================================
/**
 * [UI] 로컬 스토리지의 장부(히스토리)를 읽어와 팝업창에 그려주는 핵심 렌더링 함수입니다.
 */
async function renderHistoryList() {
  const res = await chrome.storage.local.get(['history']);
  const list = document.getElementById('historyList');
  const history = res.history || []; // 최대 500개가 담긴 전체 장부
  
  const toggleBtn = document.getElementById('toggleAllHistory');
  const restoreSelBtn = document.getElementById('restoreSelected');

  // 내역이 하나도 없을 때의 처리
  if (history.length === 0) {
    list.innerHTML = `<div style="padding:10px;color:#ccc;text-align:center;">${i18nData[currentLang].emptyHistory}</div>`;
    restoreSelBtn.style.display = 'none';
    toggleBtn.style.display = 'none';
    return;
  }
  
  // 내역이 있으면 '선택 복구' 버튼 활성화
  restoreSelBtn.style.display = 'block';

  // 슬라이딩 윈도우 로직: 히스토리가 30개를 초과할 때만 '전체 보기' 버튼 활성화
  if (history.length > 30) {
    toggleBtn.style.display = 'block';
    toggleBtn.textContent = showAllHistory ? i18nData[currentLang].showRecent : i18nData[currentLang].showAll;
  } else {
    toggleBtn.style.display = 'none';
    showAllHistory = false; // 30개 이하로 떨어지면 자동으로 토글 스위치 끄기
  }

  // 핵심: 전체 보기(true)면 500개를 통째로 넘기고, 아니면 배열의 끝에서 30개만 잘라냄(slice).
  // 사용자가 3개를 복구하면 497개가 되고, 거기서 최신 30개를 자르므로 과거 내역 3개가 자연스럽게 올라옴.
  const displayHistory = showAllHistory ? history : history.slice(-30);

  // 리스트를 싹 비우고 역순(최신순)으로 그려줌
  list.innerHTML = '';
  [...displayHistory].reverse().forEach((item) => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div style="display:flex; align-items:center;">
        <input type="checkbox" class="history-checkbox" data-id="${item.timestamp}" style="margin-right:8px;">
        <span style="font-size:11px;">${item.tag}${item.id ? '#'+item.id : ''}</span>
      </div>
      <button class="restore-btn" data-id="${item.timestamp}">${i18nData[currentLang].restore}</button>
    `;
    list.appendChild(div);
  });
}

// ==========================================
// 3. 이벤트 리스너 (팝업창 UI 컨트롤)
// ==========================================

// 초기 셋팅: 팝업이 로드될 때 스토리지에서 옵션값을 가져와 적용
document.addEventListener('DOMContentLoaded', async () => {
  const res = await chrome.storage.local.get(['skipConfirm', 'multiSelect', 'history', 'userLang']);
  const lang = res.userLang || 'ko';
  document.getElementById('langSelect').value = lang;
  applyLanguage(lang);
  document.getElementById('skipConfirm').checked = res.skipConfirm || false;
  document.getElementById('multiSelect').checked = res.multiSelect || false;
});

// 언어 선택 변경
document.getElementById('langSelect').addEventListener('change', (e) => {
  const selectedLang = e.target.value;
  chrome.storage.local.set({ userLang: selectedLang });
  applyLanguage(selectedLang);
});

// '전체 보기 / 30개 보기' 토글 버튼
document.getElementById('toggleAllHistory').addEventListener('click', () => {
  showAllHistory = !showAllHistory; // 상태 반전
  renderHistoryList(); // 화면 즉시 갱신
});


// ==========================================
// 4. 복구(Restore) 관련 로직
// ==========================================

/**
 * [기능] 여러 개의 ID를 받아 한 번에 복구하는 공통 엔진입니다.
 * 개별 복구, 선택 복구에서 모두 이 함수를 재사용합니다.
 */
async function executeRestore(uids, isAll = false) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  // 전체 복구가 아니거나 여러 개를 복구할 때만 메시지 노출 세팅
  const alertMsg = (uids.length > 1 || !isAll) ? i18nData[currentLang].alertRestore.replace('{count}', uids.length) : null;

  // 1. 실제 웹페이지에 스크립트 주입하여 복구(투명화 해제) 수행
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (ids, msg) => {
      ids.forEach(uid => {
        const el = document.querySelector(`[data-ad-eraser-id="${uid}"]`);
        if (el) {
          const original = el.getAttribute('data-ad-eraser-original-display');
          // 백업된 원래 display 속성이 있으면 복구, 없으면 인라인 스타일 깔끔하게 삭제
          if (original !== null && original !== '') el.style.setProperty('display', original);
          else el.style.removeProperty('display');
          
          // 사용이 끝난 임시 꼬리표 떼기
          el.removeAttribute('data-ad-eraser-id');
          el.removeAttribute('data-ad-eraser-original-display');
        }
      });
      // 웹페이지 상에 알림 띄우기 (타이밍 이슈 방지를 위해 setTimeout 사용)
      if (msg) setTimeout(() => alert(msg), 10);
    },
    args: [uids, alertMsg]
  });

  // 2. 복구 완료된 내역을 스토리지(장부)에서도 영구 삭제
  const res = await chrome.storage.local.get(['history']);
  const newHistory = res.history.filter(h => !uids.includes(h.timestamp.toString()));
  await chrome.storage.local.set({ history: newHistory });
  renderHistoryList(); // 팝업 UI 새로고침
}

// [이벤트] 리스트 우측의 '개별 복구' 버튼 클릭
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('restore-btn')) {
    const timestamp = e.target.dataset.id;
    await executeRestore([timestamp], true);
  }
});

// [이벤트] 리스트 상단의 '선택 복구(체크박스)' 버튼 클릭
document.getElementById('restoreSelected').addEventListener('click', async () => {
  const checkboxes = document.querySelectorAll('.history-checkbox:checked');
  const idsToRestore = Array.from(checkboxes).map(cb => cb.dataset.id);
  if (idsToRestore.length === 0) return;
  await executeRestore(idsToRestore); // 수집된 ID 배열을 통째로 넘김
});

// [이벤트] '화면 전체 복구' 버튼 클릭
document.getElementById('restorePopups').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.storage.local.set({ history: [] }); // 장부 완전히 초기화
  
  // 타겟 페이지 전체를 스캔하여 복구하는 전용 로직 주입
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: restorePopupsLogic,
    args: [i18nData[currentLang].alertRestore]
  });
  window.close();
});


// ==========================================
// 5. 모드 실행 (광고 지우개 모드)
// ==========================================

// [이벤트] 메인 버튼 클릭: 지우개 모드 발동
document.getElementById('startSelection').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const skip = document.getElementById('skipConfirm').checked;
  const multi = document.getElementById('multiSelect').checked;
  chrome.storage.local.set({ skipConfirm: skip, multiSelect: multi });
  
  // 지우개 핵심 로직(eraserLogic)을 대상 웹페이지에 주입
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: eraserLogic,
    args: [skip, multi, i18nData[currentLang].confirmDelete]
  });
  window.close(); // 팝업 닫기
});


// =====================================================================
// 아래 영역의 함수들은 확장 프로그램 팝업이 아니라
// 사용자가 보고 있는 **실제 웹페이지(DOM)** 내부에 주입되어 동작합니다.
// =====================================================================

/**
 * [주입 스크립트] 지우개 코어 로직
 * - 빨간 테두리 표시
 * - 악질 광고(iframe)의 클릭 가로채기 방어막
 * - 요소를 '삭제(remove)'하지 않고 '투명화(display:none)' 처리하여 Undo 지원
 */
function eraserLogic(skipConfirm, multiSelect, confirmMsg) {
  const styleId = 'ad-eraser-style';
  
  // 1. 시각 효과 및 철벽 방어막(pointer-events:none) 스타일 주입
  if (!document.getElementById(styleId)) {
    const s = document.createElement('style');
    s.id = styleId;
    s.innerHTML = `
      .ad-eraser-target { outline: 3px solid #e74c3c !important; outline-offset: -3px !important; background-color: rgba(231, 76, 60, 0.2) !important; cursor: crosshair !important; z-index: 2147483647 !important; transition: all 0.1s !important; }
      .ad-eraser-mode iframe, .ad-eraser-mode object, .ad-eraser-mode embed { pointer-events: none !important; }
    `;
    document.head.appendChild(s);
  }
  
  document.body.classList.add('ad-eraser-mode');
  
  // 마우스 액션 리스너
  const over = (e) => { e.stopPropagation(); e.target.classList.add('ad-eraser-target'); };
  const out = (e) => { e.stopPropagation(); e.target.classList.remove('ad-eraser-target'); };
  const esc = (e) => { if (e.key === "Escape") cleanup(); }; 
  
  // 배너의 mousedown 순간 페이지 강제 이동 차단
  const blockTricks = (e) => { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }; 
  
  // 목표 요소 클릭 시 투명화
  const click = async (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    e.stopImmediatePropagation(); // 부모로 이벤트가 전파되는 것을 완벽 차단
    
    if (skipConfirm || confirm(confirmMsg)) {
      const timestamp = Date.now().toString(); // 고유 식별자 생성
      const targetInfo = { tag: e.target.tagName.toLowerCase(), id: e.target.id, timestamp: timestamp };
      
      // 요소를 지우지 않고 원래 상태를 백업한 뒤 투명화시킴
      e.target.setAttribute('data-ad-eraser-id', timestamp);
      e.target.setAttribute('data-ad-eraser-original-display', e.target.style.display || '');
      e.target.style.setProperty('display', 'none', 'important');
      
      // 저장소 한도를 최대 500개 (슬라이딩 윈도우의 기반)
      chrome.storage.local.get(['history'], (res) => {
        let history = res.history || [];
        history.push(targetInfo);
        // 내역이 500개를 넘어가면 가장 오래된 것부터 쳐냄
        if (history.length > 500) history = history.slice(-500); 
        chrome.storage.local.set({ history });
      });
      
      if (!multiSelect) cleanup(); // 연속 선택 모드가 아니면 한 번 클릭 후 모드 종료
    } else {
      if (!multiSelect) cleanup();
    }
  };

  // 모드 해제 시 생성했던 리스너와 스타일 찌꺼기 깔끔하게 청소
  const cleanup = () => {
    document.body.classList.remove('ad-eraser-mode');
    document.removeEventListener('mouseover', over, true);
    document.removeEventListener('mouseout', out, true);
    document.removeEventListener('click', click, true);
    document.removeEventListener('mousedown', blockTricks, true); 
    document.removeEventListener('keydown', esc, true); 
    document.getElementById(styleId)?.remove();
  };

  // 이벤트 캡처링(true) 모드로 최상위에서 이벤트 우선 가로채기
  document.addEventListener('mouseover', over, true);
  document.addEventListener('mouseout', out, true);
  document.addEventListener('click', click, true);
  document.addEventListener('mousedown', blockTricks, true); 
  document.addEventListener('keydown', esc, true); 
}

/**
 * [주입 스크립트] 전체 복구 시 대상 웹페이지 내부에서 실행되는 함수
 * 히스토리(장부) 내역과 상관없이 꼬리표가 붙은 모든 숨겨진 요소를 강제 부활시킴
 */
function restorePopupsLogic(alertMsg) {
  let count = 0;
  // 우리가 투명화 마법을 걸어둔 모든 요소를 찾기
  document.querySelectorAll('[data-ad-eraser-id]').forEach(el => {
    const original = el.getAttribute('data-ad-eraser-original-display');
    if (original !== null && original !== '') el.style.setProperty('display', original);
    else el.style.removeProperty('display');
    
    el.removeAttribute('data-ad-eraser-id');
    el.removeAttribute('data-ad-eraser-original-display');
    count++;
  });
  setTimeout(() => alert(alertMsg.replace('{count}', count)), 10);
}