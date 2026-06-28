// ----------------------------------------------------
// 個人向け日記アプリ バックエンド用 GASコード
// ----------------------------------------------------

const SHEET_NAME = 'Diary';
const FOLDER_NAME = 'DiaryPhotos';
const APP_URL = 'https://ここにアプリのURLを入力'; // （任意）カレンダーからのリンク先用
const API_TOKEN = 'diary_secret_token_xyz'; // フロントエンドの VITE_GAS_API_TOKEN と一致させます

// --- CORS用のヘッダー ---
const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * 初期設定（シートやフォルダがない場合は作成）
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['id', 'date', 'content', 'mood', 'weather', 'photoUrl']);
    sheet.getRange("A1:F1").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  // フォルダがなければ作成
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  let hasValidFolder = false;
  while (folders.hasNext()) {
    let folder = folders.next();
    if (!folder.isTrashed()) {
      hasValidFolder = true;
      break;
    }
  }
  if (!hasValidFolder) {
    DriveApp.createFolder(FOLDER_NAME);
  }
}

/**
 * GETリクエストの処理（日記データとカレンダー予定の取得）
 */
function doGet(e) {
  try {
    // トークンの検証
    if (e.parameter.token !== API_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unauthorized access' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    // シートがない場合は初期セットアップ
    if (!sheet) setup();

    // 日記データの取得
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    const entries = [];
    
    for (let i = 1; i < values.length; i++) {
      let row = values[i];
      let entry = {};
      for (let j = 0; j < headers.length; j++) {
        entry[headers[j]] = row[j];
      }
      entries.push(entry);
    }

    // Googleカレンダーから当月と来月の予定を取得
    const calendarEvents = [];
    const cal = CalendarApp.getDefaultCalendar();
    const now = new Date();
    const startTime = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endTime = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const events = cal.getEvents(startTime, endTime);
    
    events.forEach(ev => {
      let d = ev.getStartTime();
      let dateStr = Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
      calendarEvents.push({
        id: ev.getId(),
        date: dateStr,
        title: ev.getTitle()
      });
    });

    const result = {
      status: 'success',
      entries: entries,
      events: calendarEvents
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POSTリクエストの処理（日記の保存とカレンダーへの書き込み）
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // トークンの検証
    if (data.token !== API_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unauthorized access' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 元のphotoUrl（画像変更がない場合はこれを使う）も受け取る
    const { id, date, content, mood, weather, photoUrl: existingPhotoUrl, photoBase64, photoExt } = data;
    
    let finalPhotoUrl = existingPhotoUrl || "";

    // 画像の新規アップロードがある場合
    if (photoBase64) {
      const folders = DriveApp.getFoldersByName(FOLDER_NAME);
      let targetFolder = null;
      while (folders.hasNext()) {
        let f = folders.next();
        if (!f.isTrashed()) {
          targetFolder = f;
          break;
        }
      }
      if (!targetFolder) {
        targetFolder = DriveApp.createFolder(FOLDER_NAME);
      }
      
      const contentType = photoExt === 'png' ? 'image/png' : 'image/jpeg';
      const base64Data = photoBase64.includes(',') ? photoBase64.split(',')[1] : photoBase64;
      const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, `diary_${date}_${id}.${photoExt}`);
      
      const file = targetFolder.createFile(blob);
      // imgタグで表示できるように権限を付与し、直接表示用のURLを生成
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      finalPhotoUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();
    }

    // スプレッドシートへの追記
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      setup();
      sheet = ss.getSheetByName(SHEET_NAME);
    }
    
    // 更新か新規追加か判定
    const values = sheet.getDataRange().getValues();
    let updated = false;
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] == id) { // idは文字列または数値の可能性があるため==
        sheet.getRange(i + 1, 3).setValue(content);
        sheet.getRange(i + 1, 4).setValue(mood);
        sheet.getRange(i + 1, 5).setValue(weather || "");
        sheet.getRange(i + 1, 6).setValue(finalPhotoUrl);
        updated = true;
        break;
      }
    }

    if (!updated) {
      // 新規追加
      sheet.appendRow([id, date, content, mood, weather || "", finalPhotoUrl]);
      
      // カレンダーへの終日イベント追加
      const cal = CalendarApp.getDefaultCalendar();
      const eventDate = new Date(date);
      const moodEmoji = getMoodEmoji(mood);
      const eventTitle = `[日記] ${moodEmoji}`;
      
      cal.createAllDayEvent(eventTitle, eventDate, {
        description: `今日はこんな日でした：\n${content}\n\nアプリを開く：${APP_URL}`
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', id: id, photoUrl: finalPhotoUrl }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * OPTIONSリクエストの処理（CORS対応）
 */
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

function getMoodEmoji(mood) {
  const map = {
    'happy': '😊',
    'normal': '😐',
    'sad': '😢',
    'angry': '😤'
  };
  return map[mood] || '📝';
}
