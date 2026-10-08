# AD Eraser (korean)

웹서핑 중 거슬리는 배너 광고와 팝업을 선택하여 지울 수 있는 크롬 확장 프로그램입니다. 

단순한 요소 숨김을 넘어, 배너의 강제 이동 이벤트를 차단하고 슬라이딩 윈도우 기반의 복구 시스템을 제공합니다.

## 주요 기능 (Features)
* **타겟팅 삭제**: 거슬리는 광고 요소만 선택하여 투명화 (연속 선택 모드 지원).
* **이벤트 가로채기 방어 (Iframe Defense)**: 클릭 순간 강제로 광고 사이트로 이동하는 `iframe` 배너의 `mousedown`, `click` 이벤트를 캡처링 단계에서 차단합니다.
* **슬라이딩 윈도우 히스토리**: 삭제된 요소의 고유 ID를 부여하여 최대 500개까지 로컬 스토리지에 보관하며, UI 상에서는 최신 30개 단위로 스크롤링하여 보여줍니다.
* **DOM 상태 즉각 복구**: 실수로 지운 요소는 페이지 새로고침 없이 즉시 '선택 복구'하거나, 숨겨진 모든 요소를 찾아내는 '전체 복구'가 가능합니다.

## 기술 스택 (Tech Stack)
* **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Environment**: Chrome Extension API (Manifest V3)
* **Key Architecture**: 
  - DOM Manipulation & State Management
  - Event Bubbling/Capturing Control
  - Sliding Window Algorithm (History Management)

## 설치 방법 (Installation)
1. 이 저장소의 초록색 `<> Code` 버튼을 눌러 `Download ZIP`으로 다운로드 후 압축을 풉니다.
2. 크롬 브라우저 주소창에 `chrome://extensions/`를 입력하거나, 브라우저 우측 상단의 **점 3개(⋮) 메뉴**를 누르고 **[확장 프로그램] -> [확장 프로그램 관리]**를 눌러 설정 페이지로 이동합니다.
3. 우측 상단의 **[개발자 모드]** 토글을 켭니다.
4. 좌측 상단의 **[압축해제된 확장 프로그램 로드]** 버튼을 누르고, 압축을 푼 폴더를 선택합니다.
5. 브라우저 우측 상단 확장 프로그램(퍼즐 모양) 아이콘을 눌러 `AD Eraser`를 실행합니다

## 사용 설명 (Tutorial)
1. **광고 지우기**: 확장 프로그램 팝업에서 `광고 지우개 모드` 버튼을 누릅니다. 웹페이지에서 거슬리는 광고에 마우스를 올리면 빨간 테두리가 생깁니다. 이때 클릭하면 해당 광고가 사라집니다.
2. **연속으로 지우기**: 팝업에서 `여러 개 연속 선택` 옵션을 체크하고 지우개 모드를 켜보세요. 여러 개의 광고를 연속으로 팡팡 지울 수 있습니다. 다 지웠다면 키보드의 **`ESC`** 키를 눌러 모드를 종료하세요.
3. **더 빠르게 지우기**: `확인창 없이 즉시 삭제` 옵션을 켜두면, "이 광고를 지울까요?"라고 묻는 창 없이 클릭하는 순간 곧바로 삭제됩니다.
4. **실수로 지웠다면? (복구하기)**: 팝업창 하단의 `최근 삭제 내역`을 확인해 보세요. `복구` 버튼을 누르거나, 체크박스로 원하는 것만 골라 `선택 복구`를 누르면 새로고침 없이 지워졌던 광고나 내용이 즉시 제자리로 돌아옵니다.

----------------------------------------------

# AD Eraser (English)

A Chrome extension that allows you to select and remove annoying banner ads and popups while surfing the web. 

Beyond simply hiding elements, it intercepts forced redirect events from banners and provides a recovery system based on a sliding window algorithm.

## Features
* **Precision Targeted Removal**: Select and instantly make annoying ad elements transparent (Supports continuous multi-select mode).
* **Iframe Defense (Event Interception)**: Blocks `mousedown` and `click` events at the capturing phase to prevent `iframe` banners from force-redirecting you to ad sites upon clicking.
* **Sliding Window History**: Assigns unique IDs to deleted elements and stores up to 500 items in local storage. The UI displays the 30 most recent items, allowing you to scroll through them.
* **Instant DOM State Recovery**: Accidentally deleted elements can be instantly restored without a page refresh using 'Restore Selected', or all hidden elements can be found and restored using 'Restore All'.

## Tech Stack
* **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Environment**: Chrome Extension API (Manifest V3)
* **Key Architecture**: 
  - DOM Manipulation & State Management
  - Event Bubbling/Capturing Control
  - Sliding Window Algorithm (History Management)

## Installation
1. Click the green `<> Code` button in this repository, select `Download ZIP`, and extract the downloaded file.
2. Type `chrome://extensions/` into your Chrome browser's address bar, or click the **three-dot menu (⋮)** in the top right corner and navigate to **[Extensions] -> [Manage Extensions]** to open the settings page.
3. Toggle on **[Developer mode]** in the top right corner.
4. Click the **[Load unpacked]** button in the top left and select the extracted folder.
5. Click the extension (puzzle piece) icon in the top right of your browser and run `AD Eraser`.

## Tutorial
1. **Erase Ads**: Click the `AD Eraser Mode` button in the popup. Move your mouse over an annoying ad on the webpage, and a red outline will appear. Click to make the ad disappear.
2. **Continuous Erasing**: Check the `Multi-select` option in the popup and turn on the eraser mode. You can erase multiple ads continuously. Press the **`ESC`** key to exit the mode when you are done.
3. **Faster Erasing**: Enable the `Immediate delete` option to bypass the confirmation pop-up. The ad will be deleted instantly the moment you click.
4. **Made a mistake? (Restore)**: Check the `Recent History` at the bottom of the popup. Click the `Undo` button, or select specific items with checkboxes and click `Restore Selected`. The hidden elements will instantly reappear in their original places without needing a page refresh.
