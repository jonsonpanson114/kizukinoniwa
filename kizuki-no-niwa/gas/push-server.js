/**
 * Web Push 配信管理サーバー (GAS)
 * 
 * 使い方:
 * 1. スプレッドシートを1つ作成。
 * 2. 拡張機能 > Apps Script を開く。
 * 3. このコードを貼り付ける。
 * 4. デプロイ > 新しいデプロイ > 種類: ウェブアプリ
 *    - 実行ユーザー: 自分
 *    - アクセスできるユーザー: 全員
 * 5. 発行された URL を Vercel の環境変数 EXPO_PUBLIC_GAS_URL に設定。
 */

const AUTH_TOKEN = "kizuki_no_niwa_super_secret_token_2026"; // VercelのGAS_AUTH_TOKENと一致させる
const VERCEL_SEND_PUSH_URL = "https://kizuki-no-niwa.vercel.app/api/send-push"; // お前のVercel URL

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  // 簡易認証
  if (data.auth_token !== AUTH_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // アクション分岐
  if (data.action === "subscribe") {
    return saveSubscription(data);
  }
  
  if (data.action === "save_story") {
    return saveStory(data);
  }
  
  if (data.action === "get_stories") {
    return getStories(data);
  }

  return ContentService.createTextOutput(JSON.stringify({ error: "Unknown action" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 物語の保存
 */
function saveStory(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("stories");
  if (!sheet) {
    sheet = ss.insertSheet("stories");
    sheet.appendRow(["id", "content", "character", "created_at", "metadata"]);
  }
  
  const story = data.story;
  const rowData = [
    story.id || Utilities.getUuid(),
    story.content,
    story.character || "sora",
    new Date(),
    JSON.stringify(story.metadata || {})
  ];
  
  sheet.appendRow(rowData);
  
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 物語の取得
 */
function getStories(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("stories");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ stories: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const rows = sheet.getDataRange().getValues();
  const stories = [];
  
  // ヘッダーを除いて後ろから（最新順）
  for (let i = rows.length - 1; i >= 1; i--) {
    stories.push({
      id: rows[i][0],
      content: rows[i][1],
      character: rows[i][2],
      created_at: rows[i][3],
      metadata: JSON.parse(rows[i][4] || "{}")
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({ stories: stories }))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveSubscription(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("subscriptions");
  if (!sheet) {
    sheet = ss.insertSheet("subscriptions");
    sheet.appendRow(["endpoint", "subscription", "character", "mH", "mM", "mE", "eH", "eM", "eE", "updated_at"]);
  }
  
  const subscription = data.subscription;
  const settings = data.settings || {};
  const character = data.character || "sora";
  
  // 重複チェック (endpointを一意のキーとする)
  const endpoint = JSON.parse(subscription).endpoint;
  const rows = sheet.getDataRange().getValues();
  let foundIndex = -1;
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === endpoint) {
      foundIndex = i + 1;
      break;
    }
  }

  const rowData = [
    endpoint,
    subscription,
    character,
    settings.morningHour || 8,
    settings.morningMinute || 0,
    settings.morningEnabled !== false,
    settings.eveningHour || 22,
    settings.eveningMinute || 0,
    settings.eveningEnabled !== false,
    new Date()
  ];

  if (foundIndex > 0) {
    sheet.getRange(foundIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * [重要] この関数を15分ごとのトリガーで実行するように設定してください
 */
function checkAndSend() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("subscriptions");
  if (!sheet) return;
  
  const rows = sheet.getDataRange().getValues();
  const subscriptionsToSend = [];

  for (let i = 1; i < rows.length; i++) {
    const [endpoint, subJson, char, mH, mM, mE, eH, eM, eE] = rows[i];
    
    // 朝・夜の判定 (15分間隔の実行を想定)
    const h = currentHour;
    const m = currentMinute;
    
    const isMorning = mE && h === mH && Math.abs(m - mM) < 8;
    const isEvening = eE && h === eH && Math.abs(m - eM) < 8;

    if (isMorning || isEvening) {
      subscriptionsToSend.push({
        sub: JSON.parse(subJson),
        char: char
      });
    }
  }

  if (subscriptionsToSend.length > 0) {
    sendPushRequest(subscriptionsToSend);
  }
}

function sendPushRequest(targets) {
  // キャラクタごとに通知内容を分ける
  const payloads = {
    sora: { title: "ソラ", body: "新しい物語の断片が見つかったみたい。読んでみる？" },
    haru: { title: "ハル", body: "……おい、また何か「気づき」が溜まってるぞ。整理しとけよ。" }
  };

  targets.forEach(target => {
    const payload = payloads[target.char] || payloads.sora;
    
    try {
      UrlFetchApp.fetch(VERCEL_SEND_PUSH_URL, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({
          auth_token: AUTH_TOKEN, // Vercel側で再認証
          subscriptions: [target.sub],
          title: payload.title,
          body: payload.body
        })
      });
    } catch (e) {
      Logger.log("Error sending to Vercel: " + e);
    }
  });
}
