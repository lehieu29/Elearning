
export interface Subtitle {
    index: number;
    start: number; // Time in seconds
    end: number; // Time in seconds
    text: string;
}

export interface RawSubtitle {
    index: number;
    startTime: string; // Format mm:ss.sss
    endTime: string; // Format mm:ss.sss
    text: string;
}

export interface SegmentInfo {
    index: number;
    startTime: number;
    duration: number;
    totalDuration?: number;
}

export interface VideoMetadata {
    duration: number;
}

export interface Segment {
    index: number;
    path: string;
    startTime: number;
    duration: number;
}

export interface GeminiApiOptions {
    mimeType?: string;
    contentType?: string;
    segmentInfo?: SegmentInfo | null;
    model?: string; // Allow specifying model for fallback
}

export interface BurnOptions {
    hardwareAcceleration?: boolean;
    preserveQuality?: boolean;
    showProgress?: boolean;
    onProgress?: (progress: number) => void;
}

export interface PreprocessOptions {
    maxWidth?: number;
    maxHeight?: number;
    targetBitrate?: string;
    normalizeAudio?: boolean;
}

/**
 * Cấu trúc kiểu dáng phụ đề mở rộng
 */
export interface SubtitleStyle {
    // Font và text
    font: string;
    fontSize: number;
    primaryColor: string;  // Màu chữ chính
    outlineColor: string;  // Màu viền
    outlineWidth: number;  // Độ rộng viền
    bold: boolean;         // In đậm
    italic: boolean;       // In nghiêng

    // Vị trí
    position: 'top' | 'bottom' | 'middle';  // Vị trí dọc
    alignment: 'left' | 'center' | 'right'; // Căn chỉnh ngang
    marginV: number;       // Lề dọc (pixel)
    marginH: number;       // Lề ngang (pixel)

    // Hiệu ứng nâng cao
    backgroundEnabled: boolean;    // Có hiển thị nền không
    backgroundColor: string;       // Màu nền
    backgroundOpacity: number;     // Độ trong suốt nền (0-1)
    textOpacity: number;           // Độ trong suốt chữ (0-1)
    shadowEnabled: boolean;        // Có hiệu ứng bóng đổ không
    shadowColor: string;           // Màu bóng đổ
    shadowDepth: number;           // Độ sâu bóng đổ
}

/**
 * Preset kiểu dáng phụ đề cho các loại video khác nhau
 */
export const subtitleStylePresets: Record<string, SubtitleStyle> = {
    default: {
        font: 'Arial',
        fontSize: 24,
        primaryColor: 'white',
        outlineColor: 'black',
        outlineWidth: 1,
        bold: false,
        italic: false,
        position: 'bottom',
        alignment: 'center',
        marginV: 30,
        marginH: 20,
        backgroundEnabled: false,
        backgroundColor: 'black',
        backgroundOpacity: 0.5,
        textOpacity: 1,
        shadowEnabled: false,
        shadowColor: 'black',
        shadowDepth: 1
    },

    lecture: {
        font: 'Arial',
        fontSize: 28,
        primaryColor: 'white',
        outlineColor: 'black',
        outlineWidth: 2,
        bold: true,
        italic: false,
        position: 'bottom',
        alignment: 'center',
        marginV: 40,
        marginH: 20,
        backgroundEnabled: true,
        backgroundColor: 'black',
        backgroundOpacity: 0.6,
        textOpacity: 1,
        shadowEnabled: false,
        shadowColor: 'black',
        shadowDepth: 1
    },

    tutorial: {
        font: 'Arial',
        fontSize: 22,
        primaryColor: 'white',
        outlineColor: 'black',
        outlineWidth: 1.5,
        bold: false,
        italic: false,
        position: 'top',
        alignment: 'left',
        marginV: 20,
        marginH: 40,
        backgroundEnabled: true,
        backgroundColor: '#003366',
        backgroundOpacity: 0.7,
        textOpacity: 1,
        shadowEnabled: true,
        shadowColor: 'black',
        shadowDepth: 2
    },

    documentary: {
        font: 'Verdana',
        fontSize: 26,
        primaryColor: '#F5F5F5',
        outlineColor: '#333333',
        outlineWidth: 1.8,
        bold: false,
        italic: false,
        position: 'bottom',
        alignment: 'center',
        marginV: 35,
        marginH: 30,
        backgroundEnabled: false,
        backgroundColor: 'black',
        backgroundOpacity: 0,
        textOpacity: 1,
        shadowEnabled: true,
        shadowColor: 'black',
        shadowDepth: 2
    },

    minimal: {
        font: 'Helvetica',
        fontSize: 20,
        primaryColor: 'white',
        outlineColor: 'black',
        outlineWidth: 0.8,
        bold: false,
        italic: false,
        position: 'bottom',
        alignment: 'center',
        marginV: 25,
        marginH: 20,
        backgroundEnabled: false,
        backgroundColor: 'black',
        backgroundOpacity: 0,
        textOpacity: 1,
        shadowEnabled: false,
        shadowColor: 'black',
        shadowDepth: 0
    },

    highContrast: {
        font: 'Arial',
        fontSize: 28,
        primaryColor: 'yellow',
        outlineColor: 'black',
        outlineWidth: 2.5,
        bold: true,
        italic: false,
        position: 'bottom',
        alignment: 'center',
        marginV: 40,
        marginH: 20,
        backgroundEnabled: false,
        backgroundColor: 'black',
        backgroundOpacity: 0,
        textOpacity: 1,
        shadowEnabled: true,
        shadowColor: 'black',
        shadowDepth: 3
    }
};