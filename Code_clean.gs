// Google Apps Script - Code.gs
// 스프레드시트 ID를 여기에 입력하세요
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'login') {
    return handleLogin(e.parameter.memberId, e.parameter.password);
  }
  
  return ContentService.createTextOutput(
    JSON.stringify({ success: false, message: 'Invalid action' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function handleLogin(memberId, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const membersSheet = ss.getSheetByName('Members');
    const historySheet = ss.getSheetByName('UsageHistory');
    
    const membersData = membersSheet.getDataRange().getValues();
    const headers = membersData[0];
    
    const colIndex = {
      id: headers.indexOf('회원번호'),
      password: headers.indexOf('비밀번호'),
      name: headers.indexOf('이름'),
      phone: headers.indexOf('연락처'),
      type: headers.indexOf('회원권종류'),
      regDate: headers.indexOf('등록일'),
      stayTotal: headers.indexOf('숙박권_총'),
      stayRemain: headers.indexOf('숙박권_잔여'),
      optionTotal: headers.indexOf('옵션권_총'),
      optionRemain: headers.indexOf('옵션권_잔여'),
      fireTotal: headers.indexOf('불멍권_총'),
      fireRemain: headers.indexOf('불멍권_잔여'),
      cafeTotal: headers.indexOf('카페할인권_총'),
      cafeRemain: headers.indexOf('카페할인권_잔여'),
      status: headers.indexOf('상태')
    };
    
    let memberRow = null;
    for (let i = 1; i < membersData.length; i++) {
      if (membersData[i][colIndex.id] === memberId && 
          membersData[i][colIndex.password] === password) {
        memberRow = membersData[i];
        break;
      }
    }
    
    if (!memberRow) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, message: '회원번호 또는 비밀번호가 일치하지 않습니다.' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (memberRow[colIndex.status] !== '활성') {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, message: '만료되거나 정지된 회원권입니다.' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    const member = {
      id: memberRow[colIndex.id],
      name: memberRow[colIndex.name],
      phone: memberRow[colIndex.phone],
      type: memberRow[colIndex.type],
      regDate: formatDate(memberRow[colIndex.regDate]),
      tickets: {
        stay: {
          total: memberRow[colIndex.stayTotal] || 0,
          remain: memberRow[colIndex.stayRemain] || 0
        },
        option: {
          total: memberRow[colIndex.optionTotal] || 0,
          remain: memberRow[colIndex.optionRemain] || 0
        },
        fire: {
          total: memberRow[colIndex.fireTotal] || 0,
          remain: memberRow[colIndex.fireRemain] || 0
        },
        cafe: {
          total: memberRow[colIndex.cafeTotal] || 0,
          remain: memberRow[colIndex.cafeRemain] || 0
        }
      }
    };
    
    const historyData = historySheet.getDataRange().getValues();
    const historyHeaders = historyData[0];
    
    const historyColIndex = {
      date: historyHeaders.indexOf('날짜'),
      memberId: historyHeaders.indexOf('회원번호'),
      type: historyHeaders.indexOf('이용종류'),
      count: historyHeaders.indexOf('차감횟수'),
      memo: historyHeaders.indexOf('메모')
    };
    
    const history = [];
    for (let i = 1; i < historyData.length; i++) {
      if (historyData[i][historyColIndex.memberId] === memberId) {
        history.push({
          date: formatDate(historyData[i][historyColIndex.date]),
          type: historyData[i][historyColIndex.type],
          count: historyData[i][historyColIndex.count] || 1,
          memo: historyData[i][historyColIndex.memo] || ''
        });
      }
    }
    
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentHistory = history.slice(0, 10);
    
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        member: member,
        history: recentHistory
      })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: '서버 오류가 발생했습니다: ' + error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function formatDate(date) {
  if (!date) return '';
  
  if (typeof date === 'string') return date;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return year + '-' + month + '-' + day;
}

function testLogin() {
  const result = handleLogin('M001', '1234');
  Logger.log(result.getContent());
}
