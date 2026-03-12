/**
 * ==========================================
 * AD Eraser - 확장 프로그램 핵심 로직 (popup.js)
 * ==========================================
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

let currentLang = 'ko';
let showAllHistory = false;

function applyLanguage(lang) {
    currentLang = lang;
    const data = i18nData[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (data[key]) el.textContent = data[key];
    });
    renderHistoryList();
}

// ==========================================
// 2. 뷰(View) 렌더링 및 슬라이딩 윈도우 로직
// ==========================================
async function renderHistoryList() {
    const res = await chrome.storage.local.get(['history']);
    const list = document.getElementById('historyList');
    const history = res.history || [];

    const toggleBtn = document.getElementById('toggleAllHistory');
    const restoreSelBtn = document.getElementById('restoreSelected');

    if (history.length === 0) {
        list.innerHTML = `<div style="padding:10px;color:#ccc;text-align:center;">${i18nData[currentLang].emptyHistory}</div>`;
        restoreSelBtn.style.display = 'none';
        toggleBtn.style.display = 'none';
        return;
    }

    restoreSelBtn.style.display = 'block';

    if (history.length > 30) {
        toggleBtn.style.display = 'block';
        toggleBtn.textContent = showAllHistory ? i18nData[currentLang].showRecent : i18nData[currentLang].showAll;
    } else {
        toggleBtn.style.display = 'none';
        showAllHistory = false;
    }

    const displayHistory = showAllHistory ? history : history.slice(-30);

    list.innerHTML = '';
    [...displayHistory].reverse().forEach((item) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
      <div style="display:flex; align-items:center;">
        <input type="checkbox" class="history-checkbox" data-id="${item.timestamp}" style="margin-right:8px;">
        <span style="font-size:11px;">${item.tag}${item.id ? '#' + item.id : ''}</span>
      </div>
      <button class="restore-btn" data-id="${item.timestamp}">${i18nData[currentLang].restore}</button>
    `;
        list.appendChild(div);
    });
}

// ==========================================
// 3. 이벤트 리스너 (팝업창 UI 컨트롤)
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    const res = await chrome.storage.local.get(['skipConfirm', 'multiSelect', 'history', 'userLang']);
    const lang = res.userLang || 'ko';
    document.getElementById('langSelect').value = lang;
    applyLanguage(lang);

    
    document.getElementById('skipConfirm').checked = res.skipConfirm || false;
    document.getElementById('multiSelect').checked = res.multiSelect !== undefined ? res.multiSelect : true;
});

// 체크박스를 클릭(변경)하는 즉시 스토리지에 바로 저장합니다
document.getElementById('skipConfirm').addEventListener('change', (e) => {
    chrome.storage.local.set({ skipConfirm: e.target.checked });
});

document.getElementById('multiSelect').addEventListener('change', (e) => {
    chrome.storage.local.set({ multiSelect: e.target.checked });
});

document.getElementById('langSelect').addEventListener('change', (e) => {
    const selectedLang = e.target.value;
    chrome.storage.local.set({ userLang: selectedLang });
    applyLanguage(selectedLang);
});

document.getElementById('toggleAllHistory').addEventListener('click', () => {
    showAllHistory = !showAllHistory;
    renderHistoryList();
});


// ==========================================
// 4. 복구(Restore) 관련 로직
// ==========================================

async function executeRestore(uids, isAll = false) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    const alertMsg = (uids.length > 1 || !isAll) ? i18nData[currentLang].alertRestore.replace('{count}', uids.length) : null;

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (ids, msg) => {
            ids.forEach(uid => {
                const el = document.querySelector(`[data-ad-eraser-id="${uid}"]`);
                if (el) {
                    const original = el.getAttribute('data-ad-eraser-original-display');
                    if (original !== null && original !== '') el.style.setProperty('display', original);
                    else el.style.removeProperty('display');
                    el.removeAttribute('data-ad-eraser-id');
                    el.removeAttribute('data-ad-eraser-original-display');
                }
            });
            if (msg) setTimeout(() => alert(msg), 10);
        },
        args: [uids, alertMsg]
    });

    const res = await chrome.storage.local.get(['history']);
    const newHistory = res.history.filter(h => !uids.includes(h.timestamp.toString()));
    await chrome.storage.local.set({ history: newHistory });
    renderHistoryList();
}

document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('restore-btn')) {
        const timestamp = e.target.dataset.id;
        await executeRestore([timestamp], true);
    }
});

document.getElementById('restoreSelected').addEventListener('click', async () => {
    const checkboxes = document.querySelectorAll('.history-checkbox:checked');
    const idsToRestore = Array.from(checkboxes).map(cb => cb.dataset.id);
    if (idsToRestore.length === 0) return;
    await executeRestore(idsToRestore);
});

document.getElementById('restorePopups').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.storage.local.set({ history: [] });
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

document.getElementById('startSelection').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 버튼을 누를 때 팝업에 체크된 현재 상태를 읽어와서 던져줍니다.
    const skip = document.getElementById('skipConfirm').checked;
    const multi = document.getElementById('multiSelect').checked;

    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: eraserLogic,
        args: [skip, multi, i18nData[currentLang].confirmDelete]
    });
    window.close();
});


// =====================================================================
// 아래 영역의 함수들은 실제 웹페이지(DOM) 내부에 주입되어 동작합니다.
// =====================================================================

function eraserLogic(skipConfirm, multiSelect, confirmMsg) {
    const styleId = 'ad-eraser-style';

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

    const over = (e) => { e.stopPropagation(); e.target.classList.add('ad-eraser-target'); };
    const out = (e) => { e.stopPropagation(); e.target.classList.remove('ad-eraser-target'); };
    const esc = (e) => { if (e.key === "Escape") cleanup(); };
    const blockTricks = (e) => { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); };

    const click = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (skipConfirm || confirm(confirmMsg)) {
            const timestamp = Date.now().toString();
            const targetInfo = { tag: e.target.tagName.toLowerCase(), id: e.target.id, timestamp: timestamp };

            e.target.setAttribute('data-ad-eraser-id', timestamp);
            e.target.setAttribute('data-ad-eraser-original-display', e.target.style.display || '');
            e.target.style.setProperty('display', 'none', 'important');

            chrome.storage.local.get(['history'], (res) => {
                let history = res.history || [];
                history.push(targetInfo);
                if (history.length > 500) history = history.slice(-500);
                chrome.storage.local.set({ history });
            });

            if (!multiSelect) cleanup();
        } else {
            if (!multiSelect) cleanup();
        }
    };

    const cleanup = () => {
        document.body.classList.remove('ad-eraser-mode');
        document.removeEventListener('mouseover', over, true);
        document.removeEventListener('mouseout', out, true);
        document.removeEventListener('click', click, true);
        document.removeEventListener('mousedown', blockTricks, true);
        document.removeEventListener('keydown', esc, true);
        document.getElementById(styleId)?.remove();
    };

    document.addEventListener('mouseover', over, true);
    document.addEventListener('mouseout', out, true);
    document.addEventListener('click', click, true);
    document.addEventListener('mousedown', blockTricks, true);
    document.addEventListener('keydown', esc, true);
}

function restorePopupsLogic(alertMsg) {
    let count = 0;
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