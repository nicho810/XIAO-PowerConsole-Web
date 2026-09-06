/**
 * [INPUT]:  无外部依赖
 * [OUTPUT]: 对外提供 LOCALES 多语言字典、LOCALE_LABELS 显示名、Locale/LocaleStrings 类型
 * [POS]:    i18n/ 的核心数据层，被 hooks/use-locale 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

// ============================================================
//  类型定义
// ============================================================

export type Locale = 'en' | 'ja' | 'ko' | 'vi' | 'ms' | 'de' | 'fr' | 'it' | 'es' | 'zh-TW';

export interface LocaleStrings {
  // -- 连接面板 --
  connection:   string;
  connect:      string;
  connecting:   string;
  disconnect:   string;
  disconnected: string;
  handshaking:  string;
  streaming:    string;
  testMode:     string;
  // -- 设备信息 --
  deviceInfo: string;
  samples:    string;
  shuntRA:    string;
  shuntRB:    string;
  protocol:   string;
  channelA:   string;
  channelB:   string;
  voltage:    string;
  current:    string;
  power:      string;
  energy:     string;
  reset:      string;
  charge:     string;
  elapsed:    string;
  // -- 调试控制台 --
  debugConsole: string;
  noMessages:   string;
  // -- 主题 --
  switchToDark:  string;
  switchToLight: string;
  // -- 语言选择 --
  language: string;
}

// ============================================================
//  语言显示名（下拉列表用）
// ============================================================

export const LOCALE_LABELS: Record<Locale, string> = {
  'en':    'English',
  'ja':    '日本語',
  'ko':    '한국어',
  'vi':    'Tiếng Việt',
  'ms':    'Bahasa',
  'de':    'Deutsch',
  'fr':    'Français',
  'it':    'Italiano',
  'es':    'Español',
  'zh-TW': '繁體中文',
};

// ============================================================
//  翻译字典
// ============================================================

export const LOCALES: Record<Locale, LocaleStrings> = {
  // ── English (default) ──────────────────────────────────────
  en: {
    connection: 'Connection', connect: 'Connect', connecting: 'Connecting...',
    disconnect: 'Disconnect', disconnected: 'Disconnected',
    handshaking: 'Handshaking...', streaming: 'Streaming', testMode: 'Test Mode',
    deviceInfo: 'Device Info', samples: 'samples',
    shuntRA: 'Shunt R (A)', shuntRB: 'Shunt R (B)', protocol: 'Protocol',
    channelA: 'Channel A', channelB: 'Channel B',
    voltage: 'Voltage', current: 'Current', power: 'Power',
    energy: 'Energy', reset: 'Reset', charge: 'Charge', elapsed: 'Elapsed',
    debugConsole: 'Debug Console', noMessages: 'No messages',
    switchToDark: 'Switch to dark mode', switchToLight: 'Switch to light mode',
    language: 'Language',
  },

  // ── 日本語 ─────────────────────────────────────────────────
  ja: {
    connection: '接続', connect: '接続', connecting: '接続中...',
    disconnect: '切断', disconnected: '切断済み',
    handshaking: 'ハンドシェイク中...', streaming: 'ストリーミング中', testMode: 'テストモード',
    deviceInfo: 'デバイス情報', samples: 'サンプル',
    shuntRA: 'シャント R (A)', shuntRB: 'シャント R (B)', protocol: 'プロトコル',
    channelA: 'チャンネル A', channelB: 'チャンネル B',
    voltage: '電圧', current: '電流', power: '電力',
    energy: 'エネルギー', reset: 'リセット', charge: '電荷', elapsed: '経過時間',
    debugConsole: 'デバッグコンソール', noMessages: 'メッセージなし',
    switchToDark: 'ダークモードに切替', switchToLight: 'ライトモードに切替',
    language: '言語',
  },

  // ── 한국어 ─────────────────────────────────────────────────
  ko: {
    connection: '연결', connect: '연결', connecting: '연결 중...',
    disconnect: '연결 해제', disconnected: '연결 해제됨',
    handshaking: '핸드셰이킹 중...', streaming: '스트리밍 중', testMode: '테스트 모드',
    deviceInfo: '장치 정보', samples: '샘플',
    shuntRA: '션트 R (A)', shuntRB: '션트 R (B)', protocol: '프로토콜',
    channelA: '채널 A', channelB: '채널 B',
    voltage: '전압', current: '전류', power: '전력',
    energy: '에너지', reset: '초기화', charge: '전하', elapsed: '경과 시간',
    debugConsole: '디버그 콘솔', noMessages: '메시지 없음',
    switchToDark: '다크 모드로 전환', switchToLight: '라이트 모드로 전환',
    language: '언어',
  },

  // ── Tiếng Việt ─────────────────────────────────────────────
  vi: {
    connection: 'Kết nối', connect: 'Kết nối', connecting: 'Đang kết nối...',
    disconnect: 'Ngắt kết nối', disconnected: 'Đã ngắt kết nối',
    handshaking: 'Đang bắt tay...', streaming: 'Đang truyền', testMode: 'Chế độ thử nghiệm',
    deviceInfo: 'Thông tin thiết bị', samples: 'mẫu',
    shuntRA: 'Shunt R (A)', shuntRB: 'Shunt R (B)', protocol: 'Giao thức',
    channelA: 'Kênh A', channelB: 'Kênh B',
    voltage: 'Điện áp', current: 'Dòng điện', power: 'Công suất',
    energy: 'Năng lượng', reset: 'Đặt lại', charge: 'Điện tích', elapsed: 'Đã qua',
    debugConsole: 'Bảng điều khiển', noMessages: 'Không có tin nhắn',
    switchToDark: 'Chuyển sang tối', switchToLight: 'Chuyển sang sáng',
    language: 'Ngôn ngữ',
  },

  // ── Bahasa Melayu ──────────────────────────────────────────
  ms: {
    connection: 'Sambungan', connect: 'Sambung', connecting: 'Menyambung...',
    disconnect: 'Putus sambungan', disconnected: 'Tidak disambung',
    handshaking: 'Berjabat tangan...', streaming: 'Penstriman', testMode: 'Mod Ujian',
    deviceInfo: 'Maklumat Peranti', samples: 'sampel',
    shuntRA: 'Shunt R (A)', shuntRB: 'Shunt R (B)', protocol: 'Protokol',
    channelA: 'Saluran A', channelB: 'Saluran B',
    voltage: 'Voltan', current: 'Arus', power: 'Kuasa',
    energy: 'Tenaga', reset: 'Tetapkan Semula', charge: 'Cas', elapsed: 'Berlalu',
    debugConsole: 'Konsol Debug', noMessages: 'Tiada mesej',
    switchToDark: 'Tukar ke gelap', switchToLight: 'Tukar ke cerah',
    language: 'Bahasa',
  },

  // ── Deutsch ────────────────────────────────────────────────
  de: {
    connection: 'Verbindung', connect: 'Verbinden', connecting: 'Verbinde...',
    disconnect: 'Trennen', disconnected: 'Getrennt',
    handshaking: 'Handshake...', streaming: 'Streaming', testMode: 'Testmodus',
    deviceInfo: 'Geräteinformation', samples: 'Messungen',
    shuntRA: 'Shunt R (A)', shuntRB: 'Shunt R (B)', protocol: 'Protokoll',
    channelA: 'Kanal A', channelB: 'Kanal B',
    voltage: 'Spannung', current: 'Strom', power: 'Leistung',
    energy: 'Energie', reset: 'Zurücksetzen', charge: 'Ladung', elapsed: 'Vergangen',
    debugConsole: 'Debug-Konsole', noMessages: 'Keine Nachrichten',
    switchToDark: 'Dunkelmodus', switchToLight: 'Hellmodus',
    language: 'Sprache',
  },

  // ── Français ───────────────────────────────────────────────
  fr: {
    connection: 'Connexion', connect: 'Connecter', connecting: 'Connexion...',
    disconnect: 'Déconnecter', disconnected: 'Déconnecté',
    handshaking: 'Liaison...', streaming: 'En flux', testMode: 'Mode test',
    deviceInfo: 'Info appareil', samples: 'échantillons',
    shuntRA: 'Shunt R (A)', shuntRB: 'Shunt R (B)', protocol: 'Protocole',
    channelA: 'Canal A', channelB: 'Canal B',
    voltage: 'Tension', current: 'Courant', power: 'Puissance',
    energy: 'Énergie', reset: 'Réinitialiser', charge: 'Charge', elapsed: 'Écoulé',
    debugConsole: 'Console de débogage', noMessages: 'Aucun message',
    switchToDark: 'Mode sombre', switchToLight: 'Mode clair',
    language: 'Langue',
  },

  // ── Italiano ───────────────────────────────────────────────
  it: {
    connection: 'Connessione', connect: 'Connetti', connecting: 'Connessione...',
    disconnect: 'Disconnetti', disconnected: 'Disconnesso',
    handshaking: 'Handshake...', streaming: 'In streaming', testMode: 'Modalità test',
    deviceInfo: 'Info dispositivo', samples: 'campioni',
    shuntRA: 'Shunt R (A)', shuntRB: 'Shunt R (B)', protocol: 'Protocollo',
    channelA: 'Canale A', channelB: 'Canale B',
    voltage: 'Tensione', current: 'Corrente', power: 'Potenza',
    energy: 'Energia', reset: 'Ripristina', charge: 'Carica', elapsed: 'Trascorso',
    debugConsole: 'Console di debug', noMessages: 'Nessun messaggio',
    switchToDark: 'Modalità scura', switchToLight: 'Modalità chiara',
    language: 'Lingua',
  },

  // ── Español ────────────────────────────────────────────────
  es: {
    connection: 'Conexión', connect: 'Conectar', connecting: 'Conectando...',
    disconnect: 'Desconectar', disconnected: 'Desconectado',
    handshaking: 'Negociando...', streaming: 'Transmitiendo', testMode: 'Modo de prueba',
    deviceInfo: 'Info del dispositivo', samples: 'muestras',
    shuntRA: 'Shunt R (A)', shuntRB: 'Shunt R (B)', protocol: 'Protocolo',
    channelA: 'Canal A', channelB: 'Canal B',
    voltage: 'Voltaje', current: 'Corriente', power: 'Potencia',
    energy: 'Energía', reset: 'Reiniciar', charge: 'Carga', elapsed: 'Transcurrido',
    debugConsole: 'Consola de depuración', noMessages: 'Sin mensajes',
    switchToDark: 'Modo oscuro', switchToLight: 'Modo claro',
    language: 'Idioma',
  },

  // ── 繁體中文 ───────────────────────────────────────────────
  'zh-TW': {
    connection: '連線', connect: '連線', connecting: '連線中...',
    disconnect: '中斷連線', disconnected: '已中斷連線',
    handshaking: '握手中...', streaming: '串流中', testMode: '測試模式',
    deviceInfo: '裝置資訊', samples: '筆樣本',
    shuntRA: '分流電阻 (A)', shuntRB: '分流電阻 (B)', protocol: '通訊協定',
    channelA: '通道 A', channelB: '通道 B',
    voltage: '電壓', current: '電流', power: '功率',
    energy: '電能', reset: '重置', charge: '電荷', elapsed: '已用時間',
    debugConsole: '除錯主控台', noMessages: '無訊息',
    switchToDark: '切換暗色模式', switchToLight: '切換亮色模式',
    language: '語言',
  },
};
