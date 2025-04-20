import { GoogleGenerativeAI } from '@google/generative-ai';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import subtitle from 'subtitle';
import { SubtitleStyle, subtitleStylePresets } from '../models/subtitle_style.model';

// Cấu hình đường dẫn FFmpeg
ffmpeg.setFfmpegPath(ffmpegPath.path);

// Khởi tạo Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro', // hoặc 'gemini-2.5-pro' cho chất lượng tốt hơn
});

/**
 * Phiên bản tối ưu của hàm chuyển đổi thành base64
 * Thay vì đọc toàn bộ file vào bộ nhớ, chúng ta sử dụng stream để giảm thiểu sử dụng RAM
 */
export async function convertToBase64Optimized(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // Sử dụng streaming thay vì đọc toàn bộ file vào bộ nhớ
        try {
            const fileStats = fs.statSync(filePath);

            // Với file lớn (>50MB), sử dụng phương pháp đặc biệt để xử lý
            if (fileStats.size > 50 * 1024 * 1024) {
                console.log(`Large file detected (${Math.round(fileStats.size / 1024 / 1024)}MB), using chunked base64 conversion`);

                // Đọc file theo từng phần để tránh quá tải bộ nhớ
                const stream = fs.createReadStream(filePath);
                const chunks: Buffer[] = [];

                stream.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                stream.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer.toString('base64'));
                });

                stream.on('error', reject);
            } else {
                // Với file nhỏ hơn, đọc toàn bộ nhanh hơn
                const buffer = fs.readFileSync(filePath);
                resolve(buffer.toString('base64'));
            }
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Lấy thông tin metadata của video
 * @param videoPath Đường dẫn đến file video
 */
export function getVideoMetadata(videoPath: string): Promise<{ duration: number }> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                return reject(err);
            }

            const duration = metadata.format.duration || 0;
            resolve({ duration });
        });
    });
}

/**
 * Chia video thành các phân đoạn nhỏ
 * @param videoPath Đường dẫn đến file video
 * @param segmentDuration Độ dài mỗi phân đoạn (giây)
 * @param outputDir Thư mục đầu ra
 */
export async function splitVideoIntoSegments(
    videoPath: string,
    segmentDuration = 600,
    outputDir: string
): Promise<{ segments: any[], totalDuration: number }> {
    return new Promise((resolve, reject) => {
        // Lấy thông tin video
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                return reject(err);
            }

            // Lấy tổng thời lượng video
            const duration = metadata.format.duration || 0;

            const segments: any[] = [];
            const segmentPromises: Promise<void>[] = [];

            // Tính số phân đoạn cần tạo
            const numSegments = Math.ceil(duration / segmentDuration);

            for (let i = 0; i < numSegments; i++) {
                const startTime = i * segmentDuration;
                const actualDuration = Math.min(segmentDuration, duration - startTime);
                const outputPath = path.join(outputDir, `segment_${i}.mp4`);

                // Cắt phân đoạn video
                const segmentPromise = new Promise<void>((resolveSegment, rejectSegment) => {
                    ffmpeg(videoPath)
                        .setStartTime(startTime)
                        .setDuration(actualDuration)
                        .output(outputPath)
                        .on('end', () => {
                            segments.push({
                                index: i,
                                path: outputPath,
                                startTime,
                                duration: actualDuration
                            });
                            resolveSegment();
                        })
                        .on('error', rejectSegment)
                        .run();
                });

                segmentPromises.push(segmentPromise);
            }

            // Đợi tất cả phân đoạn được tạo xong
            Promise.all(segmentPromises)
                .then(() => {
                    // Sắp xếp phân đoạn theo thứ tự
                    segments.sort((a, b) => a.index - b.index);
                    resolve({
                        segments,
                        totalDuration: duration
                    });
                })
                .catch(reject);
        });
    });
}

/**
 * Tạo prompt tối ưu cho Gemini API dựa trên loại nội dung
 * @param contentType Loại nội dung ('lecture', 'tutorial', 'demo', etc.)
 * @param segmentInfo Thông tin phân đoạn (nếu đang xử lý phân đoạn)
 */
function getOptimizedPrompt(contentType = 'lecture', segmentInfo: any = null): string {
    let prompt = `Tạo phụ đề chính xác cho video ${contentType} này. `;

    // Thêm hướng dẫn về định dạng
    prompt += `Trả về phụ đề theo định dạng JSON sau:
  [
    {
      "index": (số thứ tự bắt đầu từ 0),
      "startTime": (thời gian bắt đầu định dạng mm:ss.sss),
      "endTime": (thời gian kết thúc định dạng mm:ss.sss),
      "text": (nội dung phụ đề)
    }
  ]
  
  Hướng dẫn về chất lượng phụ đề:
  1. Phụ đề phải ngắn gọn, mỗi câu không quá 80 ký tự hoặc 2 dòng
  2. Thời lượng mỗi phụ đề từ 2-6 giây, tùy theo lượng nội dung
  3. Giữ nguyên ngữ nghĩa của nội dung, loại bỏ các từ lặp lại không cần thiết
  4. Cú pháp và chính tả phải chính xác
  5. Đảm bảo thời gian phụ đề đồng bộ với lời nói trong video`;

    // Nếu xử lý phân đoạn, thêm thông tin về phân đoạn
    if (segmentInfo) {
        prompt += `\n\nĐây là phân đoạn ${segmentInfo.index + 1} của video, bắt đầu từ thời điểm ${segmentInfo.startTime} giây, độ dài ${segmentInfo.duration} giây.`;

        if (segmentInfo.totalDuration) {
            prompt += ` Tổng thời lượng của video là ${segmentInfo.totalDuration} giây.`;
        }

        prompt += `\nĐảm bảo thời gian bắt đầu và kết thúc của phụ đề nằm trong phạm vi phân đoạn này (${segmentInfo.startTime} - ${segmentInfo.startTime + segmentInfo.duration} giây).`;
    }

    // Thêm hướng dẫn đặc biệt dựa trên loại nội dung
    if (contentType === 'lecture') {
        prompt += `\n\nĐây là video bài giảng, cần chú ý:
    1. Giữ lại thuật ngữ kỹ thuật, công thức hoặc khái niệm quan trọng
    2. Xử lý phù hợp các trường hợp giảng viên nêu câu hỏi hoặc diễn giải`;
    } else if (contentType === 'tutorial') {
        prompt += `\n\nĐây là video hướng dẫn, cần chú ý:
    1. Giữ lại các bước chỉ dẫn quan trọng, số thứ tự các bước
    2. Đảm bảo thời gian phụ đề khớp với các thao tác trực quan`;
    }

    return prompt;
}

/**
 * Chuyển định dạng thời gian từ 'mm:ss.sss' sang số giây
 */
function parseTimeToSeconds(timeStr: string): number {
    const match = timeStr.match(/(\d+):(\d+)\.(\d+)/);
    if (!match) return 0;

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const milliseconds = parseInt(match[3], 10);

    return minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * Gọi Gemini API để tạo phụ đề
 */
export async function callGeminiApi(videoBase64: string, options: any = {}): Promise<any[]> {
    try {
        const mimeType = options.mimeType || 'video/mp4';
        const contentType = options.contentType || 'lecture';
        const segmentInfo = options.segmentInfo || null;

        // Chuẩn bị prompt
        const prompt = getEnhancedPrompt(contentType, segmentInfo);

        // Chuẩn bị request
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: videoBase64
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.2,
                topK: 32,
                topP: 0.95,
                maxOutputTokens: 8192,
            }
        });

        // Xử lý response
        const responseText = result.response.text();
        console.log('Gemini API response:', responseText.substring(0, 200) + '...');

        // Tìm phần JSON trong response
        const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
        if (!jsonMatch) {
            throw new Error('Không thể tìm thấy dữ liệu JSON trong response');
        }

        // Parse JSON
        const subtitlesJson = JSON.parse(jsonMatch[0]);

        // Chuyển đổi định dạng thời gian thành seconds
        return subtitlesJson.map((subtitle: any) => ({
            index: subtitle.index,
            start: parseTimeToSeconds(subtitle.startTime),
            end: parseTimeToSeconds(subtitle.endTime),
            text: subtitle.text
        }));
    } catch (error: any) {
        console.error('Error calling Gemini API:', error.message);
        throw new Error(`Failed to generate subtitles: ${error.message}`);
    }
}

/**
 * Thử lại gọi Gemini API với số lần tối đa
 */
export async function callGeminiApiWithRetry(videoBase64: string, options: any = {}, maxRetries = 3): Promise<any[]> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await callGeminiApi(videoBase64, options);
        } catch (error: any) {
            console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
            lastError = error;

            // Nếu chưa phải lần thử cuối, đợi trước khi thử lại
            if (attempt < maxRetries) {
                // Exponential backoff: 1s, 2s, 4s, ...
                const delay = 1000 * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Nếu tất cả các lần thử đều thất bại, throw error
    throw lastError;
}

/**
 * Tạo file phụ đề SRT
 */
export async function createSubtitleFile(subtitles: any[], outputPath: string): Promise<void> {
    // Chuyển đổi định dạng subtitles sang định dạng SRT
    const srtSubtitles = subtitles.map((sub: any, index: number) => {
        const startTime = new Date(sub.start * 1000).toISOString().substr(11, 12).replace('.', ',');
        const endTime = new Date(sub.end * 1000).toISOString().substr(11, 12).replace('.', ',');

        return {
            id: index + 1,
            start: startTime,
            end: endTime,
            text: sub.text
        };
    });

    // Tạo nội dung file SRT
    const srtContent = srtSubtitles.map((sub: any) => {
        return `${sub.id}\n${sub.start} --> ${sub.end}\n${sub.text}\n`;
    }).join('\n');

    // Ghi file
    await fs.writeFile(outputPath, srtContent, 'utf8');
    console.log(`Subtitle file created: ${outputPath}`);
}

/**
 * Chuyển đổi cấu trúc kiểu dáng phụ đề sang cú pháp FFmpeg
 * @param style Kiểu dáng phụ đề
 * @returns Chuỗi định dạng FFmpeg
 */
export function convertStyleToFFmpegFormat(style: SubtitleStyle): string {
    // Xử lý màu sắc: Chuyển đổi từ mã màu hex sang mã ASS
    const hexToAss = (hexColor: string): string => {
        // Loại bỏ ký tự # nếu có
        hexColor = hexColor.replace('#', '');

        // Đảm bảo mã màu đủ 6 ký tự
        if (hexColor.length === 3) {
            hexColor = hexColor.split('').map(c => c + c).join('');
        }

        // Kiểm tra tính hợp lệ
        if (!/^[0-9A-Fa-f]{6}$/.test(hexColor)) {
            console.warn(`Invalid hex color: ${hexColor}, falling back to white`);
            hexColor = 'FFFFFF';
        }

        // Chuyển đổi sang định dạng ASS: &HAABBGGRR (AA=alpha, BB=blue, GG=green, RR=red)
        const r = hexColor.substring(0, 2);
        const g = hexColor.substring(2, 4);
        const b = hexColor.substring(4, 6);

        // Tính toán alpha từ opacity (0 = trong suốt, FF = đục)
        const textAlpha = Math.round((1 - (style.textOpacity || 1)) * 255).toString(16).padStart(2, '0');

        return `&H${textAlpha}${b}${g}${r}`;
    };

    // Xử lý màu sắc cho nền
    const hexToAssBackground = (hexColor: string, opacity: number): string => {
        // Loại bỏ ký tự # nếu có
        hexColor = hexColor.replace('#', '');

        // Đảm bảo mã màu đủ 6 ký tự
        if (hexColor.length === 3) {
            hexColor = hexColor.split('').map(c => c + c).join('');
        }

        // Kiểm tra tính hợp lệ
        if (!/^[0-9A-Fa-f]{6}$/.test(hexColor)) {
            console.warn(`Invalid hex color: ${hexColor}, falling back to black`);
            hexColor = '000000';
        }

        // Chuyển đổi sang định dạng ASS: &HAABBGGRR (AA=alpha, BB=blue, GG=green, RR=red)
        const r = hexColor.substring(0, 2);
        const g = hexColor.substring(2, 4);
        const b = hexColor.substring(4, 6);

        // Tính toán alpha từ opacity (0 = trong suốt, FF = đục)
        const bgAlpha = Math.round((1 - opacity) * 255).toString(16).padStart(2, '0');

        return `&H${bgAlpha}${b}${g}${r}`;
    };

    // Xây dựng chuỗi style
    let styleString = `FontName=${style.font},FontSize=${style.fontSize},`;

    // Thêm màu sắc
    styleString += `PrimaryColour=${hexToAss(style.primaryColor)},`;
    styleString += `OutlineColour=${hexToAss(style.outlineColor)},`;

    // Thêm thuộc tính nền nếu được bật
    if (style.backgroundEnabled && style.backgroundOpacity > 0) {
        styleString += `BackColour=${hexToAssBackground(style.backgroundColor, style.backgroundOpacity)},`;
    }

    // Thêm hiệu ứng bóng đổ nếu được bật
    if (style.shadowEnabled && style.shadowDepth > 0) {
        styleString += `ShadowColour=${hexToAss(style.shadowColor)},`;
        styleString += `Shadow=${style.shadowDepth},`;
    } else {
        styleString += `Shadow=0,`;
    }

    // Định dạng văn bản
    styleString += `Bold=${style.bold ? '1' : '0'},`;
    styleString += `Italic=${style.italic ? '1' : '0'},`;

    // Đặt kiểu viền
    styleString += `BorderStyle=3,`; // ASS border
    styleString += `Outline=${style.outlineWidth},`;

    return styleString;
}

/**
 * Xây dựng phần vị trí cho phụ đề trong FFmpeg
 * @param style Kiểu dáng phụ đề
 * @returns Chuỗi định dạng vị trí FFmpeg
 */
export function buildPositionString(style: SubtitleStyle): string {
    let positionString = '';

    // Vị trí dọc (MarginV)
    if (style.position === 'top') {
        positionString += `:MarginV=${style.marginV || 20}`;
    } else if (style.position === 'middle') {
        positionString += `:MarginV=0`;
    } else {
        // Mặc định là bottom
        positionString += `:MarginV=${style.marginV || 30}`;
    }

    // Căn chỉnh ngang
    if (style.alignment === 'left') {
        positionString += `:MarginL=${style.marginH || 20}`;
    } else if (style.alignment === 'right') {
        positionString += `:MarginR=${style.marginH || 20}`;
    }

    // Xác định mã Alignment (ASS format)
    // 1-3: sub bottom; 4-6: sub middle; 7-9: sub top
    // 1,4,7: sub left; 2,5,8: sub center; 3,6,9: sub right
    let alignmentCode = 2; // Mặc định: bottom center

    if (style.position === 'top') {
        if (style.alignment === 'left') alignmentCode = 7;
        else if (style.alignment === 'center') alignmentCode = 8;
        else if (style.alignment === 'right') alignmentCode = 9;
    } else if (style.position === 'middle') {
        if (style.alignment === 'left') alignmentCode = 4;
        else if (style.alignment === 'center') alignmentCode = 5;
        else if (style.alignment === 'right') alignmentCode = 6;
    } else { // bottom
        if (style.alignment === 'left') alignmentCode = 1;
        else if (style.alignment === 'center') alignmentCode = 2;
        else if (style.alignment === 'right') alignmentCode = 3;
    }

    positionString += `:Alignment=${alignmentCode}`;

    return positionString;
}

/**
 * Gắn cứng phụ đề vào video với kiểu dáng tùy chỉnh nâng cao
 * @param videoPath Đường dẫn đến file video
 * @param subtitlePath Đường dẫn đến file phụ đề
 * @param outputPath Đường dẫn đến file video đầu ra
 * @param style Kiểu dáng phụ đề (hoặc tên preset)
 */
export async function burnSubtitlesToVideo(
    videoPath: string,
    subtitlePath: string,
    outputPath: string,
    style?: SubtitleStyle | string
): Promise<string> {
    // Xác định style cần sử dụng
    let subtitleStyle: SubtitleStyle;

    if (!style) {
        // Sử dụng style mặc định
        subtitleStyle = subtitleStylePresets.default;
    } else if (typeof style === 'string') {
        // Sử dụng preset từ tên
        subtitleStyle = subtitleStylePresets[style] || subtitleStylePresets.default;
    } else {
        // Sử dụng style được cung cấp, bổ sung các giá trị mặc định cho các trường thiếu
        subtitleStyle = {
            ...subtitleStylePresets.default,
            ...style
        };
    }

    // Chuyển đổi style thành định dạng FFmpeg
    const styleString = convertStyleToFFmpegFormat(subtitleStyle);

    // Xây dựng chuỗi vị trí
    const positionString = buildPositionString(subtitleStyle);

    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .inputOptions('-threads 4') // Tăng hiệu suất
            .addOption('-vf', `subtitles=${subtitlePath}:force_style='${styleString}${positionString}'`)
            .output(outputPath)
            .outputOptions('-c:a copy') // Giữ nguyên audio
            .on('start', (commandLine) => {
                console.log('FFmpeg command:', commandLine);
            })
            .on('end', () => {
                console.log('Subtitles burned successfully');
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('Error burning subtitles:', err);
                reject(err);
            })
            .on('progress', (progress) => {
                console.log(`Processing: ${progress.percent ? Math.round(progress.percent) : 0}% done`);
            })
            .run();
    });
}

/**
 * Trích xuất kiểu dáng phụ đề mặc định từ cài đặt người dùng
 * - Đọc từ cài đặt lưu trữ trong database hoặc localStorage
 * - Trả về style mặc định nếu không tìm thấy
 */
export async function getDefaultSubtitleStyle(): Promise<SubtitleStyle> {
    try {
        // TODO: Khi có API và model cài đặt, đọc từ database

        // Hiện tại thử đọc từ localStorage (giả lập phía server)
        let defaultStyle: SubtitleStyle | null = null;

        try {
            const storedStyle = process.env.DEFAULT_SUBTITLE_STYLE || '{}';
            defaultStyle = JSON.parse(storedStyle);
        } catch (error) {
            console.error('Error parsing stored subtitle style:', error);
        }

        // Trả về style mặc định nếu không tìm thấy hoặc không hợp lệ
        if (!defaultStyle || typeof defaultStyle !== 'object') {
            return subtitleStylePresets.default;
        }

        // Kết hợp style lưu trữ với default để đảm bảo đủ trường
        return {
            ...subtitleStylePresets.default,
            ...defaultStyle
        };
    } catch (error) {
        console.error('Error getting default subtitle style:', error);
        return subtitleStylePresets.default;
    }
}

/**
 * Cơ chế fallback nếu mọi lần thử đều thất bại
 */
export async function processFallback(videoPath: string): Promise<any[]> {
    console.log('Using fallback method for subtitle generation');

    try {
        // Tạo phụ đề trống hoặc đơn giản với thông tin cơ bản
        const { duration } = await getVideoMetadata(videoPath);

        // Tạo phụ đề đơn giản dựa trên tên video
        const filename = path.basename(videoPath, path.extname(videoPath));
        return [
            {
                index: 0,
                start: 0,
                end: Math.min(5, duration),
                text: filename.replace(/_/g, ' ')
            },
            {
                index: 1,
                start: Math.min(5, duration),
                end: duration,
                text: 'Video content'
            }
        ];
    } catch (error) {
        console.error('Fallback method failed:', error);
        // Trả về mảng rỗng nếu mọi phương pháp đều thất bại
        return [];
    }
}

/**
 * Hàm dọn dẹp các file tạm thời
 */
export async function cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
        try {
            if (await fs.pathExists(filePath)) {
                const stats = await fs.stat(filePath);
                if (stats.isDirectory()) {
                    await fs.remove(filePath);
                } else {
                    await fs.unlink(filePath);
                }
                console.log(`Cleaned up: ${filePath}`);
            }
        } catch (error) {
            console.error(`Error cleaning up ${filePath}:`, error);
        }
    }
}

/**
 * Tối ưu hóa phân đoạn thông minh với giới hạn phát hiện khoảng lặng
 */
export async function splitVideoIntoSmartSegmentsOptimized(
    videoPath: string,
    maxSegmentDuration = 600,
    outputDir: string,
    maxDetectionDuration = 3600 // Giới hạn phát hiện khoảng lặng trong 1 giờ đầu tiên
): Promise<{ segments: any[], totalDuration: number }> {
    return new Promise((resolve, reject) => {
        // Lấy thông tin video
        ffmpeg.ffprobe(videoPath, async (err, metadata) => {
            if (err) {
                return reject(err);
            }

            // Lấy tổng thời lượng video
            const duration = metadata.format.duration || 0;
            console.log(`Video total duration: ${duration} seconds`);

            // Nếu video quá dài, chia thành các phân đoạn đều nhau thay vì phân tích khoảng lặng
            if (duration > 7200) { // Hơn 2 giờ
                console.log('Video too long, using direct segmentation without silence detection');
                try {
                    const result = await splitVideoIntoSegments(videoPath, maxSegmentDuration, outputDir);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
                return;
            }

            // Giới hạn phát hiện khoảng lặng trong khoảng thời gian đầu tiên
            const detectionDuration = Math.min(duration, maxDetectionDuration);

            try {
                // Trích xuất đoạn đầu tiên để phát hiện khoảng lặng
                const tempSamplePath = path.join(outputDir, 'temp_sample.mp4');

                await new Promise<void>((resolveExtract, rejectExtract) => {
                    ffmpeg(videoPath)
                        .setDuration(detectionDuration)
                        .output(tempSamplePath)
                        .on('end', () => resolveExtract())
                        .on('error', rejectExtract)
                        .run();
                });

                // Phát hiện khoảng lặng từ mẫu
                let silenceEndTimes: number[] = [];

                await new Promise<void>((resolveDetect, rejectDetect) => {
                    ffmpeg(tempSamplePath)
                        .audioFilters('silencedetect=noise=-30dB:d=1')
                        .format('null')
                        .output('-')
                        .on('error', rejectDetect)
                        .on('end', () => resolveDetect())
                        .on('stderr', (stderrLine) => {
                            // Phân tích output để tìm khoảng lặng
                            const silenceMatches = stderrLine.match(/silence_end: (\d+\.\d+)/g);
                            if (silenceMatches && silenceMatches.length > 0) {
                                const times = silenceMatches.map(match => {
                                    const timeMatch = match.match(/silence_end: (\d+\.\d+)/);
                                    return timeMatch ? parseFloat(timeMatch[1]) : 0;
                                }).filter(time => time > 0);

                                silenceEndTimes.push(...times);
                            }
                        })
                        .run();
                });

                // Xóa file tạm
                try {
                    fs.unlinkSync(tempSamplePath);
                } catch (e) {
                    console.warn('Error removing temporary sample file:', e);
                }

                console.log(`Detected ${silenceEndTimes.length} potential segment break points`);

                // Xác định các điểm phân đoạn tối ưu
                const segmentBreakpoints = [0]; // Bắt đầu với điểm 0
                let currentSegmentStart = 0;

                // Sắp xếp tăng dần
                silenceEndTimes.sort((a, b) => a - b);

                for (const time of silenceEndTimes) {
                    // Nếu khoảng cách từ điểm bắt đầu hiện tại vượt quá 90% của maxSegmentDuration
                    if (time - currentSegmentStart >= maxSegmentDuration * 0.9 && time < duration) {
                        segmentBreakpoints.push(time);
                        currentSegmentStart = time;
                    }
                }

                // Thêm các điểm phân đoạn đều đặn cho phần còn lại của video (nếu có)
                if (detectionDuration < duration) {
                    const lastBreakpoint = segmentBreakpoints[segmentBreakpoints.length - 1];
                    let currentPoint = lastBreakpoint;

                    while (currentPoint < duration) {
                        currentPoint += maxSegmentDuration;
                        if (currentPoint < duration) {
                            segmentBreakpoints.push(currentPoint);
                        }
                    }
                }

                // Thêm điểm cuối cùng
                if (segmentBreakpoints[segmentBreakpoints.length - 1] < duration) {
                    segmentBreakpoints.push(duration);
                }

                console.log(`Optimized segment breakpoints: ${segmentBreakpoints.join(', ')}`);

                // Tạo các phân đoạn video từ các điểm phân đoạn
                const segments: any[] = [];
                const segmentPromises: Promise<void>[] = [];

                // Giới hạn số lượng công việc xử lý song song
                const maxConcurrent = 2; // Giới hạn số công việc ffmpeg đồng thời
                const segmentGroups: number[][] = [];

                // Chia thành các nhóm xử lý
                for (let i = 0; i < segmentBreakpoints.length - 1; i++) {
                    const groupIndex = Math.floor(i / maxConcurrent);
                    if (!segmentGroups[groupIndex]) {
                        segmentGroups[groupIndex] = [];
                    }
                    segmentGroups[groupIndex].push(i);
                }

                // Xử lý từng nhóm
                for (const group of segmentGroups) {
                    const groupPromises = group.map(i => {
                        const startTime = segmentBreakpoints[i];
                        const endTime = segmentBreakpoints[i + 1];
                        const segmentDuration = endTime - startTime;
                        const outputPath = path.join(outputDir, `segment_${i}.mp4`);

                        // Cắt phân đoạn video
                        return new Promise<void>((resolveSegment, rejectSegment) => {
                            ffmpeg(videoPath)
                                .setStartTime(startTime)
                                .setDuration(segmentDuration)
                                .output(outputPath)
                                .on('progress', (progress) => {
                                    console.log(`Segment ${i + 1}/${segmentBreakpoints.length - 1}: ${Math.round(progress.percent || 0)}% done`);
                                })
                                .on('end', () => {
                                    segments.push({
                                        index: i,
                                        path: outputPath,
                                        startTime,
                                        duration: segmentDuration
                                    });
                                    resolveSegment();
                                })
                                .on('error', rejectSegment)
                                .run();
                        });
                    });

                    // Đợi tất cả công việc trong nhóm hoàn thành
                    await Promise.all(groupPromises);
                }

                // Sắp xếp phân đoạn theo thứ tự
                segments.sort((a, b) => a.index - b.index);
                resolve({
                    segments,
                    totalDuration: duration
                });
            } catch (error) {
                console.error('Error in smart segmentation, falling back to regular segmentation', error);
                try {
                    const result = await splitVideoIntoSegments(videoPath, maxSegmentDuration, outputDir);
                    resolve(result);
                } catch (fallbackError) {
                    reject(fallbackError);
                }
            }
        });
    });
}

/**
 * Tối ưu hóa xử lý song song với quản lý tài nguyên
 */
export async function processSegmentsInParallelOptimized(
    segments: any[],
    options: any = {},
    onProgress?: (progress: number, message: string) => void
): Promise<any[]> {
    if (!segments || segments.length === 0) {
        return [];
    }

    const totalSegments = segments.length;
    const allSubtitles: any[] = [];

    // Tự động tính số lượng xử lý đồng thời dựa trên số lõi CPU
    const cpuCount = os.cpus().length;
    const concurrentLimit = Math.max(1, Math.min(3, Math.floor(cpuCount / 2))); // Tối đa 50% CPU cores, tối đa 3
    console.log(`Using ${concurrentLimit} concurrent processes based on ${cpuCount} CPU cores`);

    // Chia thành các nhóm xử lý
    const segmentGroups: any[][] = [];
    for (let i = 0; i < segments.length; i += concurrentLimit) {
        segmentGroups.push(segments.slice(i, i + concurrentLimit));
    }

    let processedCount = 0;

    // Tạo một giới hạn bộ nhớ đơn giản
    const memoryThreshold = 0.7; // 70% RAM
    const checkMemoryUsage = () => {
        const memoryInfo = process.memoryUsage();
        const usedMemory = memoryInfo.heapUsed / memoryInfo.heapTotal;
        return usedMemory < memoryThreshold;
    };

    // Xử lý từng nhóm phân đoạn
    for (let groupIndex = 0; groupIndex < segmentGroups.length; groupIndex++) {
        const group = segmentGroups[groupIndex];

        onProgress?.(
            Math.round((processedCount / totalSegments) * 100),
            `Đang xử lý nhóm phân đoạn ${groupIndex + 1}/${segmentGroups.length}...`
        );

        // Kiểm tra sử dụng bộ nhớ trước khi bắt đầu nhóm mới
        if (!checkMemoryUsage()) {
            console.log('Memory usage high, waiting before processing next batch...');
            // Đợi giải phóng bộ nhớ (GC)
            await new Promise(resolve => setTimeout(resolve, 5000));
            // Force garbage collection nếu có thể
            if (global.gc) {
                global.gc();
            }
        }

        // Xử lý song song các phân đoạn trong nhóm
        const batchPromises = group.map(async (segment: any) => {
            try {
                console.log(`Processing segment ${segment.index + 1}/${totalSegments}`);

                // Cập nhật tiến độ cho từng phân đoạn
                onProgress?.(
                    Math.round(((processedCount + 0.5) / totalSegments) * 100),
                    `Đang xử lý phân đoạn ${segment.index + 1}/${totalSegments}...`
                );

                // Tối ưu: Chỉ cần đọc một phần đầu của file để giảm sử dụng bộ nhớ
                // (video được hiểu là có nội dung quan trọng ở phần đầu cho mục đích tạo phụ đề)
                const maxProcessSize = 100 * 1024 * 1024; // 100MB
                const segmentStats = fs.statSync(segment.path);

                let segmentBase64;
                if (segmentStats.size > maxProcessSize) {
                    // Trích xuất phần đầu của video để xử lý
                    const tempSegmentPath = segment.path + '.temp.mp4';
                    await new Promise<void>((resolveExtract, rejectExtract) => {
                        ffmpeg(segment.path)
                            .setDuration(Math.min(segment.duration, 300)) // Tối đa 5 phút
                            .output(tempSegmentPath)
                            .on('end', () => resolveExtract())
                            .on('error', rejectExtract)
                            .run();
                    });

                    // Chuyển đổi file tạm thành base64
                    segmentBase64 = await convertToBase64Optimized(tempSegmentPath);

                    // Xóa file tạm
                    try {
                        fs.unlinkSync(tempSegmentPath);
                    } catch (e) {
                        console.warn('Error removing temporary segment file:', e);
                    }
                } else {
                    // Với phân đoạn nhỏ, xử lý bình thường
                    segmentBase64 = await convertToBase64Optimized(segment.path);
                }

                // Thêm thông tin phân đoạn vào options
                const segmentOptions = {
                    ...options,
                    segmentInfo: {
                        index: segment.index,
                        startTime: segment.startTime,
                        duration: segment.duration,
                        totalDuration: segments[totalSegments - 1].startTime + segments[totalSegments - 1].duration
                    }
                };

                // Gọi API với tiếp tục với cơ chế thử lại
                const segmentSubtitles = await callGeminiApiWithRetry(segmentBase64, segmentOptions);

                // Điều chỉnh timestamp dựa trên vị trí phân đoạn
                return segmentSubtitles.map((subtitle: any) => ({
                    ...subtitle,
                    start: subtitle.start + segment.startTime,
                    end: subtitle.end + segment.startTime
                }));
            } catch (error: any) {
                console.error(`Error processing segment ${segment.index + 1}/${totalSegments}:`, error);

                // Thử lại với mô hình dự phòng nếu lỗi
                try {
                    console.log(`Retrying segment ${segment.index + 1} with fallback model...`);
                    const fallbackOptions = {
                        ...options,
                        model: 'gemini-1.5-flash',
                        segmentInfo: {
                            index: segment.index,
                            startTime: segment.startTime,
                            duration: segment.duration,
                            totalDuration: segments[totalSegments - 1].startTime + segments[totalSegments - 1].duration
                        }
                    };

                    const segmentBase64 = await convertToBase64Optimized(segment.path);
                    const segmentSubtitles = await callGeminiApiWithRetry(segmentBase64, fallbackOptions);

                    return segmentSubtitles.map((subtitle: any) => ({
                        ...subtitle,
                        start: subtitle.start + segment.startTime,
                        end: subtitle.end + segment.startTime
                    }));
                } catch (fallbackError) {
                    console.error(`Fallback also failed for segment ${segment.index + 1}:`, fallbackError);
                    // Tạo phụ đề đơn giản cho phân đoạn này thay vì trả về mảng rỗng
                    return [
                        {
                            index: 0,
                            start: segment.startTime,
                            end: segment.startTime + Math.min(10, segment.duration / 2),
                            text: `[Phân đoạn ${segment.index + 1}]`
                        },
                        {
                            index: 1,
                            start: segment.startTime + Math.min(10, segment.duration / 2),
                            end: segment.startTime + segment.duration,
                            text: `[Nội dung video]`
                        }
                    ];
                }
            } finally {
                processedCount++;
                onProgress?.(
                    Math.round((processedCount / totalSegments) * 100),
                    `Đã xử lý ${processedCount}/${totalSegments} phân đoạn`
                );
            }
        });

        // Đợi tất cả phân đoạn trong nhóm hoàn thành
        const batchResults = await Promise.all(batchPromises);

        // Thu thập kết quả
        batchResults.forEach(subtitles => {
            if (subtitles && Array.isArray(subtitles)) {
                allSubtitles.push(...subtitles);
            }
        });

        // Giải phóng bộ nhớ giữa các nhóm
        if (global.gc) {
            global.gc();
        }
    }

    // Sắp xếp phụ đề theo thời gian bắt đầu
    return allSubtitles.sort((a, b) => a.start - b.start);
}

/**
 * Cải tiến prompt cho Gemini API với hướng dẫn chi tiết hơn
 */
function getEnhancedPrompt(contentType = 'lecture', segmentInfo: any = null): string {
    let prompt = `Tạo phụ đề chính xác cho video ${contentType} này.`;

    // Thêm chi tiết về định dạng cần thiết
    prompt += `
    Trả về phụ đề theo định dạng JSON sau:
    [
      {
        "index": (số thứ tự bắt đầu từ 0),
        "startTime": (thời gian bắt đầu định dạng mm:ss.sss),
        "endTime": (thời gian kết thúc định dạng mm:ss.sss),
        "text": (nội dung phụ đề)
      }
    ]
    
    Hướng dẫn QUAN TRỌNG về thời gian phụ đề:
    1. Bắt đầu từ giây thứ 0 và đảm bảo phụ đề liên tục
    2. Mỗi phụ đề KHÔNG quá 6 giây và KHÔNG ít hơn 1 giây
    3. Phụ đề phải ĐỒNG BỘ chính xác với lời nói trong video
    4. Sử dụng thời gian chính xác trong định dạng mm:ss.sss (phút:giây.mili giây)
    
    Hướng dẫn QUAN TRỌNG về nội dung phụ đề:
    1. Mỗi phụ đề tối đa 2 dòng, mỗi dòng KHÔNG quá 42 ký tự
    2. KHÔNG viết tắt mà viết đầy đủ các từ và cụm từ
    3. Giữ nguyên ý nghĩa và sử dụng chính xác thuật ngữ chuyên ngành
    4. LOẠI BỎ từ lặp lại, từ đệm, và các âm thanh không có nội dung (ừm, ah, etc.)
    5. KHÔNG thêm thông tin không có trong âm thanh
    `;

    // Thêm hướng dẫn cho từng loại nội dung video
    if (contentType === 'lecture') {
        prompt += `
      Hướng dẫn đặc biệt cho video bài giảng:
      1. Ưu tiên giữ lại các thuật ngữ học thuật, công thức chính xác
      2. Nếu giảng viên viết lên bảng, đảm bảo phụ đề đồng bộ với nội dung được viết
      3. Phụ đề phải đúng ngữ pháp, dấu câu, viết hoa tên riêng
      4. Nếu có các câu hỏi từ giảng viên, giữ lại cấu trúc câu hỏi trong phụ đề
      `;
    } else if (contentType === 'tutorial') {
        prompt += `
      Hướng dẫn đặc biệt cho video hướng dẫn:
      1. Giữ lại đúng các bước, số thứ tự, và tên lệnh/thao tác
      2. Phụ đề phải đồng bộ với các thao tác trực quan
      3. Giữ lại chính xác các tên file, mã lệnh, và đường dẫn
      4. Đảm bảo phụ đề ngắn gọn và dễ đọc khi người dùng thực hiện theo
      `;
    }

    // Nếu xử lý phân đoạn, thêm thông tin về phân đoạn
    if (segmentInfo) {
        prompt += `
      Thông tin về phân đoạn này:
      - Đây là phân đoạn ${segmentInfo.index + 1} của video
      - Thời gian bắt đầu: ${segmentInfo.startTime} giây
      - Thời lượng phân đoạn: ${segmentInfo.duration} giây
      - Kết thúc phân đoạn tại: ${segmentInfo.startTime + segmentInfo.duration} giây
      
      Lưu ý quan trọng:
      - Đảm bảo phụ đề KHÔNG vượt quá thời lượng của phân đoạn
      - Thời gian của phụ đề phải nằm trong khoảng từ 0 đến ${segmentInfo.duration} giây
      `;

        if (segmentInfo.totalDuration) {
            prompt += `- Tổng thời lượng của video đầy đủ là ${segmentInfo.totalDuration} giây\n`;
        }
    }

    return prompt;
}

/**
 * Cải tiến hậu xử lý phụ đề để tăng chất lượng
 */
function enhancedPostProcessSubtitles(subtitles: any[]): any[] {
    if (!subtitles || subtitles.length === 0) {
        return [];
    }

    // Sắp xếp theo thời gian bắt đầu
    subtitles.sort((a, b) => a.start - b.start);

    // Bước 1: Loại bỏ phụ đề trùng lặp hoặc gần giống nhau
    const deduplicatedSubtitles: any[] = [];
    for (let i = 0; i < subtitles.length; i++) {
        if (i === 0) {
            deduplicatedSubtitles.push(subtitles[i]);
            continue;
        }

        const currentSub = subtitles[i];
        const prevSub = deduplicatedSubtitles[deduplicatedSubtitles.length - 1];

        // Hàm tính độ tương đồng giữa hai chuỗi (0-1)
        const similarity = (s1: string, s2: string): number => {
            const longer = s1.length > s2.length ? s1 : s2;
            const shorter = s1.length > s2.length ? s2 : s1;

            if (longer.length === 0) {
                return 1.0;
            }

            // Sử dụng độ dài chuỗi chung dài nhất làm thước đo tương đồng
            let longestCommon = 0;
            for (let i = 0; i < shorter.length; i++) {
                for (let j = 0; j < longer.length; j++) {
                    let k = 0;
                    while (i + k < shorter.length && j + k < longer.length && shorter[i + k] === longer[j + k]) {
                        k++;
                    }
                    longestCommon = Math.max(longestCommon, k);
                }
            }

            return longestCommon / longer.length;
        };

        // Kiểm tra nếu văn bản quá giống nhau và thời gian gần nhau
        if (
            similarity(currentSub.text, prevSub.text) > 0.8 &&
            Math.abs(currentSub.start - prevSub.end) < 1
        ) {
            // Kết hợp hai phụ đề nếu nội dung tương tự
            prevSub.end = Math.max(prevSub.end, currentSub.end);
            continue;
        }

        deduplicatedSubtitles.push(currentSub);
    }

    // Bước 2: Điều chỉnh thời gian hiển thị dựa trên độ dài văn bản
    const adjustedSubtitles = deduplicatedSubtitles.map(sub => {
        const text = sub.text;
        const words = text.split(/\s+/).length;

        // Tính thời gian hiển thị lý tưởng: trung bình 0.3s/từ, tối thiểu 1.5s
        const idealDuration = Math.max(1.5, words * 0.3);
        const currentDuration = sub.end - sub.start;

        // Nếu thời gian hiển thị quá ngắn, kéo dài
        if (currentDuration < idealDuration) {
            return {
                ...sub,
                end: sub.start + idealDuration
            };
        }

        // Nếu thời gian hiển thị quá dài, có thể rút ngắn
        if (currentDuration > idealDuration * 2 && currentDuration > 6) {
            return {
                ...sub,
                end: sub.start + Math.min(currentDuration, Math.max(6, idealDuration * 1.5))
            };
        }

        return sub;
    });

    // Bước 3: Đảm bảo không có chồng chéo và có khoảng cách phù hợp giữa các phụ đề
    const finalSubtitles: any[] = [];

    for (let i = 0; i < adjustedSubtitles.length; i++) {
        const currentSub = { ...adjustedSubtitles[i] };

        if (i === 0) {
            finalSubtitles.push(currentSub);
            continue;
        }

        const prevSub = finalSubtitles[finalSubtitles.length - 1];

        // Nếu phụ đề hiện tại bắt đầu trước khi phụ đề trước kết thúc
        if (currentSub.start < prevSub.end) {
            // Tạo khoảng dừng nhỏ (0.1s) giữa các phụ đề
            currentSub.start = prevSub.end + 0.1;

            // Đảm bảo thời gian hiển thị tối thiểu là 1 giây
            if (currentSub.end - currentSub.start < 1) {
                currentSub.end = currentSub.start + 1;
            }
        }
        // Nếu khoảng cách quá lớn (> 5s), có thể là thiếu phụ đề
        else if (currentSub.start - prevSub.end > 5) {
            // Thêm phụ đề "khoảng lặng" nếu khoảng cách quá lớn (nếu cần)
            // Hiện tại tạm bỏ qua phần này để không làm rối phụ đề
        }

        // Kiểm tra xem phụ đề có quá dài không
        if (currentSub.text.length > 84) { // Giả sử 42 ký tự * 2 dòng
            // Chia phụ đề thành các đoạn nhỏ hơn
            const words = currentSub.text.split(' ');
            const midpoint = Math.ceil(words.length / 2);

            const firstHalf = words.slice(0, midpoint).join(' ');
            const secondHalf = words.slice(midpoint).join(' ');

            // Chia thời gian hiển thị
            const midTime = currentSub.start + (currentSub.end - currentSub.start) / 2;

            // Thêm phụ đề được chia nhỏ
            finalSubtitles.push({
                ...currentSub,
                text: firstHalf,
                end: midTime
            });

            // Thêm nửa sau vào danh sách chờ xử lý
            adjustedSubtitles.splice(i + 1, 0, {
                ...currentSub,
                text: secondHalf,
                start: midTime + 0.1,
            });

            continue;
        }

        finalSubtitles.push(currentSub);
    }

    return finalSubtitles;
}

/**
 * Tối ưu hóa việc tạo file phụ đề SRT với kiểm tra chất lượng
 */
export async function createEnhancedSubtitleFile(subtitles: any[], outputPath: string): Promise<void> {
    if (!subtitles || subtitles.length === 0) {
        throw new Error('No subtitles provided');
    }

    // Kiểm tra chất lượng phụ đề trước khi tạo file
    const issuesFound: string[] = [];

    // 1. Kiểm tra khoảng trống
    let gapCount = 0;
    for (let i = 1; i < subtitles.length; i++) {
        if (subtitles[i].start - subtitles[i - 1].end > 3) {
            gapCount++;
        }
    }
    if (gapCount > Math.ceil(subtitles.length / 10)) { // Nếu > 10% phụ đề có khoảng trống
        issuesFound.push(`Found ${gapCount} large gaps between subtitles`);
    }

    // 2. Kiểm tra chồng chéo
    let overlapCount = 0;
    for (let i = 1; i < subtitles.length; i++) {
        if (subtitles[i].start < subtitles[i - 1].end) {
            overlapCount++;
        }
    }
    if (overlapCount > 0) {
        issuesFound.push(`Found ${overlapCount} overlapping subtitles`);
    }

    // 3. Kiểm tra phụ đề quá dài
    let longSubtitleCount = 0;
    for (const sub of subtitles) {
        if (sub.text.length > 84) { // Giả sử 42 ký tự * 2 dòng
            longSubtitleCount++;
        }
    }
    if (longSubtitleCount > Math.ceil(subtitles.length / 20)) { // Nếu > 5% phụ đề quá dài
        issuesFound.push(`Found ${longSubtitleCount} subtitles exceeding recommended length`);
    }

    // Log các vấn đề và tiến hành hậu xử lý nếu cần
    if (issuesFound.length > 0) {
        console.log('Quality issues detected in subtitles:');
        issuesFound.forEach(issue => console.log(`- ${issue}`));
        console.log('Applying enhanced post-processing...');

        // Thực hiện hậu xử lý nâng cao nếu phát hiện vấn đề
        subtitles = enhancedPostProcessSubtitles(subtitles);
    }

    // Format các phụ đề sang định dạng SRT
    const srtSubtitles = subtitles.map((sub: any, index: number) => {
        // Đảm bảo định dạng thời gian chính xác hh:mm:ss,mmm
        const formatTimeToSrt = (timeInSeconds: number): string => {
            const hours = Math.floor(timeInSeconds / 3600);
            const minutes = Math.floor((timeInSeconds % 3600) / 60);
            const seconds = Math.floor(timeInSeconds % 60);
            const milliseconds = Math.floor((timeInSeconds % 1) * 1000);

            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
        };

        const startTime = formatTimeToSrt(sub.start);
        const endTime = formatTimeToSrt(sub.end);

        // Tự động chia phụ đề thành 2 dòng nếu quá dài
        let text = sub.text;
        if (text.length > 42 && !text.includes('\n')) {
            // Tìm một khoảng trắng gần giữa chuỗi để chia thành 2 dòng
            const middle = Math.floor(text.length / 2);
            let spaceIndex = text.indexOf(' ', middle);
            if (spaceIndex === -1 || spaceIndex > middle + 15) {
                // Nếu không tìm thấy khoảng trắng phù hợp, tìm ngược lại
                spaceIndex = text.lastIndexOf(' ', middle);
            }

            if (spaceIndex !== -1) {
                text = text.substring(0, spaceIndex) + '\n' + text.substring(spaceIndex + 1);
            }
        }

        return {
            id: index + 1,
            start: startTime,
            end: endTime,
            text: text
        };
    });

    // Tạo nội dung file SRT
    const srtContent = srtSubtitles.map((sub: any) => {
        return `${sub.id}\n${sub.start} --> ${sub.end}\n${sub.text}\n`;
    }).join('\n');

    // Ghi file
    await fs.writeFile(outputPath, srtContent, 'utf8');
    console.log(`Enhanced subtitle file created: ${outputPath}`);
}

/**
 * Tối ưu hóa quá trình gắn phụ đề vào video
 * - Tăng tốc độ xử lý
 * - Giảm sử dụng tài nguyên
 * - Giữ nguyên chất lượng video
 */
export async function burnSubtitlesOptimized(
    videoPath: string,
    subtitlePath: string,
    outputPath: string,
    style?: SubtitleStyle | string,
    options: {
        hardwareAcceleration?: boolean;
        preserveQuality?: boolean;
        showProgress?: boolean;
        onProgress?: (progress: number) => void;
    } = {}
): Promise<string> {
    // Xác định style cần sử dụng
    let subtitleStyle: SubtitleStyle;

    if (!style) {
        // Sử dụng style mặc định
        subtitleStyle = subtitleStylePresets.default;
    } else if (typeof style === 'string') {
        // Sử dụng preset từ tên
        subtitleStyle = subtitleStylePresets[style] || subtitleStylePresets.default;
    } else {
        // Sử dụng style được cung cấp, bổ sung các giá trị mặc định cho các trường thiếu
        subtitleStyle = {
            ...subtitleStylePresets.default,
            ...style
        };
    }

    // Chuyển đổi style thành định dạng FFmpeg
    const styleString = convertStyleToFFmpegFormat(subtitleStyle);

    // Xây dựng chuỗi vị trí
    const positionString = buildPositionString(subtitleStyle);

    // Kiểm tra hệ điều hành để xác định phần cứng có thể sử dụng
    const platform = os.platform();
    let hwaccel = '';
    let videoCodec = '';

    // Bật tăng tốc phần cứng nếu được yêu cầu
    if (options.hardwareAcceleration !== false) {
        if (platform === 'darwin') {
            // macOS - sử dụng VideoToolbox
            hwaccel = 'videotoolbox';
            videoCodec = 'h264_videotoolbox';
        } else if (platform === 'win32') {
            // Windows - thử sử dụng NVIDIA trước, sau đó là Intel QuickSync
            try {
                // Kiểm tra xem có GPU NVIDIA không
                const nvidiaSmiOutput = require('child_process').execSync('nvidia-smi', { stdio: 'pipe' }).toString();
                if (nvidiaSmiOutput.includes('NVIDIA-SMI')) {
                    hwaccel = 'cuda';
                    videoCodec = 'h264_nvenc';
                }
            } catch (e) {
                // Không có GPU NVIDIA, thử Intel QuickSync
                hwaccel = 'qsv';
                videoCodec = 'h264_qsv';
            }
        } else if (platform === 'linux') {
            // Linux - thử VAAPI
            hwaccel = 'vaapi';
            videoCodec = 'h264_vaapi';
        }
    }

    return new Promise((resolve, reject) => {
        // Tạo instance ffmpeg
        const ffmpegCommand = ffmpeg(videoPath);

        // Thêm tùy chọn tăng tốc phần cứng nếu có
        if (hwaccel && hwaccel.length > 0) {
            ffmpegCommand.inputOptions(`-hwaccel ${hwaccel}`);
        }

        // Tối ưu hóa đa luồng
        ffmpegCommand.inputOptions('-threads 0'); // Sử dụng tất cả CPU cores cho giải mã

        // Thêm bộ lọc phụ đề
        ffmpegCommand.addOption('-vf', `subtitles=${subtitlePath}:force_style='${styleString}${positionString}'`);

        // Tối ưu cài đặt mã hóa video
        if (videoCodec && videoCodec.length > 0) {
            ffmpegCommand.outputOptions(`-c:v ${videoCodec}`);
        } else {
            // Sử dụng libx264 với preset nhanh nếu không có tăng tốc phần cứng
            ffmpegCommand.outputOptions('-c:v libx264');
            ffmpegCommand.outputOptions('-preset fast');
        }

        // Giữ nguyên chất lượng nếu được yêu cầu, nếu không thì tối ưu kích thước
        if (options.preserveQuality === true) {
            ffmpegCommand.outputOptions('-crf 18'); // Chất lượng cao, ít nén
        } else {
            ffmpegCommand.outputOptions('-crf 23'); // Cân bằng giữa chất lượng và kích thước
        }

        // Giữ nguyên audio
        ffmpegCommand.outputOptions('-c:a copy');

        // Thêm đầu ra
        ffmpegCommand.output(outputPath);

        // Xử lý sự kiện
        ffmpegCommand
            .on('start', (commandLine) => {
                console.log('FFmpeg command:', commandLine);
            })
            .on('end', () => {
                console.log('Subtitles burned successfully');
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('Error burning subtitles:', err);
                reject(err);
            });

        // Hiển thị tiến độ nếu được yêu cầu
        if (options.showProgress !== false) {
            ffmpegCommand.on('progress', (progress) => {
                const percent = progress.percent ? Math.round(progress.percent) : 0;
                console.log(`Processing: ${percent}% done`);

                if (options.onProgress && typeof options.onProgress === 'function') {
                    options.onProgress(percent);
                }
            });
        }

        // Bắt đầu xử lý
        ffmpegCommand.run();
    });
}

/**
 * Tiền xử lý video để tối ưu hóa
 * - Cân chỉnh kích thước
 * - Điều chỉnh bitrate
 * - Giải quyết vấn đề định dạng
 */
export async function preprocessVideo(
    videoPath: string,
    outputPath: string,
    options: {
        maxWidth?: number;
        maxHeight?: number;
        targetBitrate?: string;
        normalizeAudio?: boolean;
    } = {}
): Promise<string> {
    return new Promise((resolve, reject) => {
        // Lấy thông tin video
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                return reject(err);
            }

            // Lấy thông tin kích thước và bitrate
            let width = 0;
            let height = 0;
            let inputBitrate = 0;

            if (metadata.streams) {
                for (const stream of metadata.streams) {
                    if (stream.codec_type === 'video') {
                        width = stream.width || 0;
                        height = stream.height || 0;
                        inputBitrate = stream.bit_rate ? parseInt(stream.bit_rate) : 0;
                        break;
                    }
                }
            }

            // Xác định kích thước đầu ra
            const maxWidth = options.maxWidth || 1280; // Mặc định giới hạn 720p
            const maxHeight = options.maxHeight || 720;

            let outputWidth = width;
            let outputHeight = height;

            // Giảm kích thước nếu vượt quá giới hạn
            if (width > maxWidth || height > maxHeight) {
                const aspectRatio = width / height;

                if (width > height) {
                    outputWidth = Math.min(width, maxWidth);
                    outputHeight = Math.round(outputWidth / aspectRatio);

                    // Kiểm tra lại chiều cao
                    if (outputHeight > maxHeight) {
                        outputHeight = maxHeight;
                        outputWidth = Math.round(outputHeight * aspectRatio);
                    }
                } else {
                    outputHeight = Math.min(height, maxHeight);
                    outputWidth = Math.round(outputHeight * aspectRatio);

                    // Kiểm tra lại chiều rộng
                    if (outputWidth > maxWidth) {
                        outputWidth = maxWidth;
                        outputHeight = Math.round(outputWidth / aspectRatio);
                    }
                }
            }

            // Xác định bitrate đầu ra
            const targetBitrate = options.targetBitrate ||
                (inputBitrate > 0 ? `${Math.min(inputBitrate, 2500000)}` : '2500k'); // Giới hạn 2.5 Mbps

            // Tạo ffmpeg command
            const ffmpegCommand = ffmpeg(videoPath);

            // Thêm các tùy chọn xử lý

            // Điều chỉnh kích thước nếu cần
            if (outputWidth !== width || outputHeight !== height) {
                ffmpegCommand.size(`${outputWidth}x${outputHeight}`);
            }

            // Thiết lập bitrate
            ffmpegCommand.videoBitrate(targetBitrate);

            // Chuẩn hóa âm thanh nếu được yêu cầu
            if (options.normalizeAudio) {
                ffmpegCommand.audioFilters('loudnorm=I=-16:TP=-1.5:LRA=11');
            } else {
                // Giữ nguyên âm thanh
                ffmpegCommand.outputOptions('-c:a copy');
            }

            // Thiết lập codec video
            ffmpegCommand.outputOptions('-c:v libx264');
            ffmpegCommand.outputOptions('-preset medium');
            ffmpegCommand.outputOptions('-crf 23');

            // Đảm bảo video có thể phát được mọi nơi
            ffmpegCommand.outputOptions('-pix_fmt yuv420p');

            // Sử dụng đa luồng
            ffmpegCommand.outputOptions('-threads 0');

            // Thêm đầu ra
            ffmpegCommand.output(outputPath);

            // Xử lý sự kiện
            ffmpegCommand
                .on('start', (commandLine) => {
                    console.log('FFmpeg preprocessing command:', commandLine);
                })
                .on('end', () => {
                    console.log('Video preprocessing completed successfully');
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error('Error preprocessing video:', err);
                    reject(err);
                })
                .on('progress', (progress) => {
                    console.log(`Preprocessing: ${progress.percent ? Math.round(progress.percent) : 0}% done`);
                });

            // Bắt đầu xử lý
            ffmpegCommand.run();
        });
    });
}

/**
 * Tạo phiên bản được tối ưu hóa của hàm processVideoAndGenerateSubtitles
 */
export async function processVideoAndGenerateSubtitlesOptimized(
    videoPath: string,
    options: any = {},
    onProgress?: (progress: number, message: string) => void
): Promise<{
    subtitles: any[];
    subtitlePath: string;
    outputVideoPath: string;
}> {
    // Tạo thư mục tạm thời cho các file xử lý
    const tempDir = path.join(os.tmpdir(), 'video-processing', Date.now().toString());
    await fs.mkdirp(tempDir);

    // Theo dõi tiến độ
    let lastProgressUpdate = 0;
    const progressTracker = (progress: number, message: string) => {
        // Giới hạn cập nhật tiến độ tối đa 5 lần/giây để tránh quá tải
        const now = Date.now();
        if (now - lastProgressUpdate > 200 || progress === 100) {
            lastProgressUpdate = now;
            onProgress?.(progress, message);
        }
    };

    try {
        // Kiểm tra kích thước file
        const videoStats = fs.statSync(videoPath);
        const videoSizeMB = videoStats.size / (1024 * 1024);
        console.log(`Original video size: ${videoSizeMB.toFixed(2)}MB`);

        // Tiền xử lý video nếu quá lớn
        let processedVideoPath = videoPath;
        if (videoSizeMB > 200) { // Nếu lớn hơn 200MB
            progressTracker(5, 'Video lớn, đang tiền xử lý...');

            const preprocessedPath = path.join(tempDir, 'preprocessed.mp4');
            processedVideoPath = await preprocessVideo(videoPath, preprocessedPath, {
                maxWidth: 1280,
                maxHeight: 720,
                normalizeAudio: true
            });

            // Kiểm tra kích thước sau khi xử lý
            const newStats = fs.statSync(processedVideoPath);
            const newSizeMB = newStats.size / (1024 * 1024);
            console.log(`Preprocessed video size: ${newSizeMB.toFixed(2)}MB (${Math.round(newSizeMB / videoSizeMB * 100)}% of original)`);

            progressTracker(10, 'Tiền xử lý hoàn tất, đang phân tích video...');
        } else {
            progressTracker(5, 'Đang phân tích video...');
        }

        // Kiểm tra độ dài video
        const { duration } = await getVideoMetadata(processedVideoPath);
        const subtitlePath = path.join(tempDir, 'subtitles.srt');
        const outputVideoPath = path.join(tempDir, `output_${path.basename(videoPath)}`);
        let subtitles: any[] = [];

        console.log(`Processing video with duration: ${duration} seconds`);

        // Xử lý khác nhau tùy theo độ dài video
        if (duration <= 600) { // Dưới 10 phút
            console.log('Video is short, processing directly');
            progressTracker(10, 'Video ngắn, xử lý trực tiếp...');

            try {
                // Xử lý video ngắn trực tiếp
                progressTracker(20, 'Đang chuyển đổi video...');
                const videoBase64 = await convertToBase64Optimized(processedVideoPath);

                progressTracker(40, 'Đang tạo phụ đề với Gemini AI...');
                subtitles = await callGeminiApiWithRetry(videoBase64, {
                    ...options,
                    mimeType: 'video/mp4'
                });

                progressTracker(70, 'Đã nhận phụ đề từ Gemini AI');
            } catch (error) {
                console.error('Error generating subtitles directly:', error);
                progressTracker(40, 'Gặp lỗi, đang sử dụng phương án dự phòng...');
                // Sử dụng fallback
                subtitles = await processFallback(processedVideoPath);
            }
        } else {
            // Xử lý video dài bằng cách phân đoạn
            console.log('Video is long, processing with segments');
            progressTracker(10, 'Video dài, đang phân đoạn...');

            const segmentsDir = path.join(tempDir, 'segments');
            await fs.mkdirp(segmentsDir);

            try {
                // Phân đoạn video với phương pháp thông minh
                progressTracker(20, 'Đang phân đoạn video thông minh...');
                const { segments, totalDuration } = await splitVideoIntoSmartSegmentsOptimized(processedVideoPath, 600, segmentsDir);
                console.log(`Video split into ${segments.length} segments`);
                progressTracker(30, `Đã phân đoạn video thành ${segments.length} phần`);

                // Xử lý từng phân đoạn với kiểm soát song song
                progressTracker(35, 'Đang xử lý các phân đoạn...');
                subtitles = await processSegmentsInParallelOptimized(segments, options, (progress, message) => {
                    // Map progress từ 0-100 sang 35-75
                    const scaledProgress = 35 + (progress * 0.4);
                    progressTracker(Math.round(scaledProgress), message);
                });
            } catch (error) {
                console.error('Error processing video segments:', error);
                progressTracker(50, 'Gặp lỗi khi xử lý phân đoạn, đang sử dụng phương án dự phòng...');
                // Sử dụng fallback
                subtitles = await processFallback(processedVideoPath);
            }
        }

        // Hậu xử lý phụ đề
        progressTracker(80, 'Đang hậu xử lý phụ đề...');
        subtitles = enhancedPostProcessSubtitles(subtitles);

        // Tạo file phụ đề SRT
        progressTracker(85, 'Đang tạo file phụ đề SRT...');
        await createEnhancedSubtitleFile(subtitles, subtitlePath);

        // Gắn cứng phụ đề vào video
        progressTracker(90, 'Đang gắn phụ đề vào video...');

        // Xác định cài đặt phụ đề dựa trên loại nội dung
        const contentType = options.contentType || 'lecture';
        const subtitleStyleName = contentType in subtitleStylePresets ? contentType : 'default';

        await burnSubtitlesOptimized(
            processedVideoPath,
            subtitlePath,
            outputVideoPath,
            subtitleStyleName,
            {
                hardwareAcceleration: true,
                preserveQuality: true,
                showProgress: true,
                onProgress: (percent) => {
                    // Map progress từ 0-100 sang 90-98
                    const scaledProgress = 90 + (percent * 0.08);
                    progressTracker(Math.round(scaledProgress), `Đang gắn phụ đề: ${percent}%`);
                }
            }
        );

        progressTracker(100, 'Hoàn thành xử lý video và phụ đề!');

        return {
            subtitles,
            subtitlePath,
            outputVideoPath
        };
    } catch (error) {
        // Xóa thư mục tạm nếu có lỗi
        try {
            await fs.remove(tempDir);
        } catch (cleanupError) {
            console.error('Error cleaning up temp directory:', cleanupError);
        }

        throw error;
    }
}