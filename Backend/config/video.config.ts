import path from 'path';
import os from 'os';

// Đọc biến môi trường với giá trị mặc định
const getEnvOrDefault = (key: string, defaultValue: string): string => {
    const value = process.env[key];
    if (value === undefined || value === 'auto' || value === '') {
        return defaultValue;
    }
    return value;
};

// Phát hiện nền tảng
const isWindows = 
    getEnvOrDefault('PLATFORM', process.platform === 'win32' ? 'windows' : 'linux') === 'windows';

// Phát hiện thư mục temp
const defaultTempDir = isWindows 
    ? path.join(os.tmpdir(), 'video-processing')
    : '/tmp/video-processing';

// Cấu hình FFmpeg
const config = {
    // Cấu hình nền tảng
    platform: isWindows ? 'windows' : 'linux',
    
    // Đường dẫn đến FFmpeg và FFprobe
    ffmpegPath: getEnvOrDefault('FFMPEG_PATH', ''),
    ffprobePath: getEnvOrDefault('FFPROBE_PATH', ''),
    
    // Thư mục tạm cho xử lý video
    tempDir: getEnvOrDefault('TEMP_VIDEO_DIR', defaultTempDir),
    
    // Cấu hình tăng tốc phần cứng
    useHardwareAcceleration: getEnvOrDefault('USE_HW_ACCELERATION', 'false') === 'true',
    gpuVendor: getEnvOrDefault('GPU_VENDOR', 'none'),
    
    // Cấu hình chất lượng video
    videoQuality: getEnvOrDefault('VIDEO_QUALITY', 'medium'), // low, medium, high
    videoResolution: getEnvOrDefault('VIDEO_RESOLUTION', '720p'), // 480p, 720p, 1080p
    
    // Cấu hình phụ đề
    subtitle: {
        font: getEnvOrDefault('SUBTITLE_FONT', 'Arial'),
        fontSize: parseInt(getEnvOrDefault('SUBTITLE_FONT_SIZE', '28')),
        position: getEnvOrDefault('SUBTITLE_POSITION', 'bottom'),
        alignment: getEnvOrDefault('SUBTITLE_ALIGNMENT', 'center'),
    },
    
    // Giới hạn xử lý đồng thời
    concurrencyLimit: parseInt(getEnvOrDefault('CONCURRENCY_LIMIT', '2')),
};

// Map video quality to FFmpeg settings
const qualitySettings = {
    low: { preset: 'veryfast', crf: '28', bitrate: '1M' },
    medium: { preset: 'medium', crf: '23', bitrate: '3M' },
    high: { preset: 'slow', crf: '18', bitrate: '5M' },
};

// Map video resolution to dimensions
const resolutionSettings = {
    '480p': { width: 854, height: 480 },
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
};

// Xuất các hàm tiện ích
export default {
    ...config,
    
    // Lấy cài đặt chất lượng video dựa trên config
    getQualitySettings() {
        return qualitySettings[config.videoQuality as keyof typeof qualitySettings] || qualitySettings.medium;
    },
    
    // Lấy cài đặt độ phân giải dựa trên config
    getResolutionSettings() {
        return resolutionSettings[config.videoResolution as keyof typeof resolutionSettings] || resolutionSettings['720p'];
    },
    
    // Xử lý đường dẫn phù hợp với nền tảng
    formatPath(filePath: string): string {
        if (isWindows) {
            // Chuyển đổi đường dẫn Windows cho FFmpeg (sử dụng forward slashes)
            return filePath.replace(/\\/g, '/');
        } else {
            // Escape khoảng trắng trong đường dẫn Linux
            return filePath.replace(/ /g, '\\ ');
        }
    },
    
    // Kiểm tra xem có nên sử dụng hardware acceleration không
    getHardwareAccelerationSettings() {
        if (!config.useHardwareAcceleration) {
            return {
                hwaccel: null,
                videoCodec: 'libx264',
            };
        }
        
        if (isWindows && config.gpuVendor === 'nvidia') {
            return {
                hwaccel: 'cuda',
                videoCodec: 'h264_nvenc',
            };
        } else if (!isWindows) {
            // Linux
            if (config.gpuVendor === 'intel') {
                return {
                    hwaccel: 'vaapi',
                    videoCodec: 'h264_vaapi',
                };
            } else if (config.gpuVendor === 'nvidia') {
                return {
                    hwaccel: 'cuda',
                    videoCodec: 'h264_nvenc',
                };
            }
        }
        
        // Fallback to software encoding
        return {
            hwaccel: null,
            videoCodec: 'libx264',
        };
    }
};
