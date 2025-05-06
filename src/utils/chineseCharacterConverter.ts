
/**
 * Simple utility to convert traditional Chinese characters to simplified Chinese
 * This implementation focuses on the most common characters used in location names
 * For a complete solution, a more comprehensive mapping would be needed
 */

// Mapping of common traditional Chinese characters to simplified Chinese
const traditionalToSimplifiedMap: Record<string, string> = {
  '臺': '台', // Taiwan
  '灣': '湾', // Bay
  '東': '东', // East
  '國': '国', // Country
  '華': '华', // China
  '樓': '楼', // Building
  '區': '区', // District
  '縣': '县', // County
  '學': '学', // Study
  '們': '们', // People
  '機': '机', // Machine
  '關': '关', // Relation
  '馬': '马', // Horse
  '時': '时', // Time
  '個': '个', // Measure word
  '長': '长', // Long
  '這': '这', // This
  '經': '经', // Through
  '還': '还', // Still
  '當': '当', // When
  '實': '实', // Real
  '點': '点', // Point
  '發': '发', // Send
  '廠': '厂', // Factory
  '說': '说', // Say
  '產': '产', // Produce
  '會': '会', // Meeting
  '對': '对', // To
  '業': '业', // Industry
  '鄉': '乡', // Township
  '後': '后', // After
  '錄': '录', // Record
  '電': '电', // Electric
  '現': '现', // Present
  '體': '体', // Body
  '門': '门', // Door
  '開': '开', // Open
  '歲': '岁', // Age
  '問': '问', // Ask
  '萬': '万', // Ten thousand
  '書': '书', // Book
  '聲': '声', // Sound
  '處': '处', // Place
  '親': '亲', // Relative
  '辦': '办', // Do
  '係': '系', // Connection
  '車': '车', // Car
  '見': '见', // See
  '過': '过', // Pass
  '聽': '听', // Hear
  '義': '义', // Justice
  '讓': '让', // Let
  '員': '员', // Member
  '團': '团', // Group
  '綠': '绿', // Green
  '閣': '阁', // Pavilion
  '層': '层', // Floor/layer
  '觀': '观', // View
  '飯': '饭', // Rice/meal
  '園': '园', // Garden
  '壓': '压', // Pressure
  '線': '线', // Line
  '廳': '厅', // Hall
  '導': '导', // Guide
  '風': '风', // Wind
  '齊': '齐', // Together
  '響': '响', // Echo
  '樂': '乐', // Music
  '紅': '红', // Red
  '紙': '纸', // Paper
  '師': '师', // Teacher
  '謝': '谢', // Thanks
  '鄰': '邻', // Neighbor
  '際': '际', // Border
  '職': '职', // Job
  '頭': '头', // Head
  '館': '馆', // Building
  '藝': '艺', // Art
  '價': '价', // Price
  '連': '连', // Connect
  '鐵': '铁', // Iron
  '藍': '蓝', // Blue
  '條': '条', // Strip
  '號': '号', // Number
  '單': '单', // Single
  '營': '营', // Operate
};

/**
 * Convert traditional Chinese text to simplified Chinese
 * @param text Text that may contain traditional Chinese characters
 * @returns The same text with traditional characters replaced by simplified ones
 */
export function convertToSimplifiedChinese(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let result = text;
  
  // Replace traditional characters with simplified ones based on our mapping
  Object.keys(traditionalToSimplifiedMap).forEach(tradChar => {
    result = result.replace(new RegExp(tradChar, 'g'), traditionalToSimplifiedMap[tradChar]);
  });
  
  return result;
}

/**
 * Check if a string is likely to contain Chinese characters
 * @param text Text to check
 * @returns Whether the text contains Chinese characters
 */
export function containsChineseCharacters(text: string): boolean {
  if (!text) return false;
  // Unicode ranges for Chinese characters
  return /[\u4E00-\u9FFF\u3400-\u4DBF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF]/.test(text);
}

