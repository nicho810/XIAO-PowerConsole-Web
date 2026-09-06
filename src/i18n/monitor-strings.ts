/**
 * [INPUT]: locales 的 Locale 类型
 * [OUTPUT]: MONITOR_STRINGS，采集控制与健康状态的十语言文案
 * [POS]: i18n/ 的测量工作区文案，与基础连接文案分开维护
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import type { Locale } from './locales.js';
const en = {
  pause: 'Pause view', resume: 'Resume live', pausedHint: 'View frozen · acquisition and recording continue',
  window: 'Time window', start: 'Start recording', append: 'Resume recording', stop: 'Stop recording',
  export: 'Export CSV', clear: 'Clear recording', recorded: 'recorded',
  limit: 'Recording stopped at 64 MiB. Export, then clear to start again.',
  local: 'Stored in this tab · 64 MiB limit · export before closing',
  live: 'Receiving', waiting: 'Waiting for data', stale: 'No samples for 2+ seconds', idle: 'Offline',
  last: 'Last sample', crc: 'CRC errors', health: 'Acquisition health', recording: 'Recording', exportError: 'CSV export failed',
};
export const MONITOR_STRINGS: Record<Locale, typeof en> = {
  en,
  'zh-TW': {
    pause: '暫停顯示', resume: '恢復即時', pausedHint: '畫面已凍結 · 採集與錄製持續進行',
    window: '時間範圍', start: '開始錄製', append: '繼續錄製', stop: '停止錄製',
    export: '匯出 CSV', clear: '清除錄製', recorded: '筆已錄製',
    limit: '錄製已達 64 MiB 上限。請先匯出，再清除以重新錄製。',
    local: '僅儲存於此分頁 · 上限 64 MiB · 關閉前請匯出',
    live: '接收中', waiting: '等待資料', stale: '超過 2 秒未收到樣本', idle: '離線',
    last: '最後樣本', crc: 'CRC 錯誤', health: '採集狀態', recording: '錄製中', exportError: 'CSV 匯出失敗',
  },
  ja: {
    pause: '表示を一時停止', resume: 'リアルタイムに戻る', pausedHint: '表示停止中 · 取得と記録は継続',
    window: '表示時間', start: '記録開始', append: '記録再開', stop: '記録停止',
    export: 'CSV 出力', clear: '記録を消去', recorded: '件記録済み',
    limit: '64 MiB に達したため記録を停止しました。出力後、消去して再開してください。',
    local: 'このタブ内に保存 · 上限 64 MiB · 閉じる前に出力',
    live: '受信中', waiting: 'データ待機中', stale: '2 秒以上サンプル未受信', idle: 'オフライン',
    last: '最終サンプル', crc: 'CRC エラー', health: '取得状態', recording: '記録中', exportError: 'CSV 出力に失敗',
  },
  ko: {
    pause: '화면 일시정지', resume: '실시간 보기', pausedHint: '화면 정지 중 · 수집과 기록은 계속됩니다',
    window: '시간 범위', start: '기록 시작', append: '기록 재개', stop: '기록 중지',
    export: 'CSV 내보내기', clear: '기록 지우기', recorded: '개 기록됨',
    limit: '64 MiB 한도에 도달했습니다. 내보낸 후 기록을 지우고 다시 시작하세요.',
    local: '이 탭에 저장 · 최대 64 MiB · 닫기 전에 내보내기',
    live: '수신 중', waiting: '데이터 대기', stale: '2초 이상 샘플 없음', idle: '오프라인',
    last: '마지막 샘플', crc: 'CRC 오류', health: '수집 상태', recording: '기록 중', exportError: 'CSV 내보내기 실패',
  },
  de: {
    pause: 'Ansicht pausieren', resume: 'Live fortsetzen', pausedHint: 'Ansicht eingefroren · Erfassung und Aufzeichnung laufen weiter',
    window: 'Zeitfenster', start: 'Aufnahme starten', append: 'Aufnahme fortsetzen', stop: 'Aufnahme stoppen',
    export: 'CSV exportieren', clear: 'Aufnahme löschen', recorded: 'aufgezeichnet',
    limit: '64 MiB erreicht. Exportieren und löschen, um erneut aufzunehmen.',
    local: 'In diesem Tab gespeichert · maximal 64 MiB · vor dem Schließen exportieren',
    live: 'Empfang aktiv', waiting: 'Warten auf Daten', stale: 'Seit über 2 Sekunden keine Messung', idle: 'Offline',
    last: 'Letzte Messung', crc: 'CRC-Fehler', health: 'Erfassungsstatus', recording: 'Aufnahme', exportError: 'CSV-Export fehlgeschlagen',
  },
  fr: {
    pause: 'Figer la vue', resume: 'Reprendre le direct', pausedHint: 'Vue figée · acquisition et enregistrement maintenus',
    window: 'Plage de temps', start: 'Enregistrer', append: 'Reprendre l’enregistrement', stop: 'Arrêter l’enregistrement',
    export: 'Exporter CSV', clear: 'Effacer l’enregistrement', recorded: 'enregistrés',
    limit: 'Limite de 64 MiB atteinte. Exportez puis effacez pour recommencer.',
    local: 'Stocké dans cet onglet · limite de 64 MiB · exporter avant de fermer',
    live: 'Réception', waiting: 'En attente de données', stale: 'Aucun échantillon depuis plus de 2 s', idle: 'Hors ligne',
    last: 'Dernier échantillon', crc: 'Erreurs CRC', health: 'État de l’acquisition', recording: 'Enregistrement', exportError: 'Échec de l’export CSV',
  },
  es: {
    pause: 'Pausar vista', resume: 'Volver al directo', pausedHint: 'Vista congelada · la adquisición y grabación continúan',
    window: 'Intervalo', start: 'Iniciar grabación', append: 'Reanudar grabación', stop: 'Detener grabación',
    export: 'Exportar CSV', clear: 'Borrar grabación', recorded: 'grabados',
    limit: 'Límite de 64 MiB alcanzado. Exporta y borra para volver a grabar.',
    local: 'Guardado en esta pestaña · límite de 64 MiB · exportar antes de cerrar',
    live: 'Recibiendo', waiting: 'Esperando datos', stale: 'Sin muestras durante más de 2 s', idle: 'Sin conexión',
    last: 'Última muestra', crc: 'Errores CRC', health: 'Estado de adquisición', recording: 'Grabando', exportError: 'Error al exportar CSV',
  },
  it: {
    pause: 'Pausa vista', resume: 'Riprendi dal vivo', pausedHint: 'Vista bloccata · acquisizione e registrazione continuano',
    window: 'Intervallo', start: 'Avvia registrazione', append: 'Riprendi registrazione', stop: 'Ferma registrazione',
    export: 'Esporta CSV', clear: 'Cancella registrazione', recorded: 'registrati',
    limit: 'Raggiunto il limite di 64 MiB. Esporta e cancella per ricominciare.',
    local: 'Salvato in questa scheda · limite di 64 MiB · esporta prima di chiudere',
    live: 'Ricezione', waiting: 'In attesa di dati', stale: 'Nessun campione da oltre 2 s', idle: 'Offline',
    last: 'Ultimo campione', crc: 'Errori CRC', health: 'Stato acquisizione', recording: 'Registrazione', exportError: 'Esportazione CSV fallita',
  },
  vi: {
    pause: 'Dừng hiển thị', resume: 'Xem trực tiếp', pausedHint: 'Đã đóng băng màn hình · vẫn thu thập và ghi dữ liệu',
    window: 'Khoảng thời gian', start: 'Bắt đầu ghi', append: 'Tiếp tục ghi', stop: 'Dừng ghi',
    export: 'Xuất CSV', clear: 'Xóa bản ghi', recorded: 'mẫu đã ghi',
    limit: 'Đã đạt giới hạn 64 MiB. Xuất rồi xóa để ghi tiếp.',
    local: 'Lưu trong thẻ này · tối đa 64 MiB · xuất trước khi đóng',
    live: 'Đang nhận', waiting: 'Đang chờ dữ liệu', stale: 'Không có mẫu trong hơn 2 giây', idle: 'Ngoại tuyến',
    last: 'Mẫu cuối', crc: 'Lỗi CRC', health: 'Trạng thái thu thập', recording: 'Đang ghi', exportError: 'Xuất CSV thất bại',
  },
  ms: {
    pause: 'Jeda paparan', resume: 'Sambung langsung', pausedHint: 'Paparan dibekukan · pengumpulan dan rakaman diteruskan',
    window: 'Julat masa', start: 'Mula rakaman', append: 'Sambung rakaman', stop: 'Henti rakaman',
    export: 'Eksport CSV', clear: 'Padam rakaman', recorded: 'direkodkan',
    limit: 'Had 64 MiB dicapai. Eksport dan padam untuk merakam semula.',
    local: 'Disimpan dalam tab ini · had 64 MiB · eksport sebelum menutup',
    live: 'Menerima', waiting: 'Menunggu data', stale: 'Tiada sampel melebihi 2 saat', idle: 'Luar talian',
    last: 'Sampel terakhir', crc: 'Ralat CRC', health: 'Status pengumpulan', recording: 'Merakam', exportError: 'Eksport CSV gagal',
  },
};
