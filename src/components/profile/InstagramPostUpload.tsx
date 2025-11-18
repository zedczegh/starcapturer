import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { loadImageFromFile, validateImageFile } from '@/utils/imageProcessingUtils';

interface InstagramPostUploadProps {
  userId: string;
  onUploadComplete: () => void;
}

export const InstagramPostUpload: React.FC<InstagramPostUploadProps> = ({
  userId,
  onUploadComplete
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [uploading, setUploading] = useState(false);
  const [transcodingProgress, setTranscodingProgress] = useState<number>(0);
  const [transcodingStatus, setTranscodingStatus] = useState<string>('');
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  const loadFFmpeg = async () => {
    if (ffmpegRef.current || ffmpegLoaded) return;
    
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      
      ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg:', message);
      });
      
      ffmpeg.on('progress', ({ progress }) => {
        setTranscodingProgress(Math.round(progress * 100));
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      setFfmpegLoaded(true);
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      toast.error('Failed to load video processor');
    }
  };

  const transcodeVideo = async (file: File): Promise<File> => {
    if (!ffmpegRef.current) {
      await loadFFmpeg();
    }

    if (!ffmpegRef.current) {
      throw new Error('FFmpeg not loaded');
    }

    try {
      const ffmpeg = ffmpegRef.current;
      const inputName = 'input.mp4';
      const outputName = 'output.mp4';

      setTranscodingStatus(`Transcoding ${file.name}...`);
      
      // Write input file
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Transcode to H.264 with web-compatible settings
      await ffmpeg.exec([
        '-i', inputName,
        '-c:v', 'libx264',           // H.264 video codec
        '-preset', 'fast',            // Fast encoding
        '-crf', '23',                 // Quality (lower = better, 23 is good)
        '-c:a', 'aac',                // AAC audio codec
        '-b:a', '128k',               // Audio bitrate
        '-movflags', '+faststart',    // Enable fast start for web
        '-pix_fmt', 'yuv420p',        // Pixel format for compatibility
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // Ensure even dimensions
        outputName
      ]);

      // Read output file and convert to Blob
      const data = await ffmpeg.readFile(outputName);
      // Create a proper Uint8Array by copying the data
      const buffer = new ArrayBuffer((data as Uint8Array).byteLength);
      const uint8View = new Uint8Array(buffer);
      uint8View.set(data as Uint8Array);
      const transcodedBlob = new Blob([uint8View], { type: 'video/mp4' });
      
      // Create new file with original name but .mp4 extension
      const originalNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const transcodedFile = new File(
        [transcodedBlob], 
        `${originalNameWithoutExt}.mp4`, 
        { type: 'video/mp4' }
      );

      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      setTranscodingStatus('');
      setTranscodingProgress(0);
      
      return transcodedFile;
    } catch (error) {
      console.error('Transcoding error:', error);
      setTranscodingStatus('');
      setTranscodingProgress(0);
      throw error;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const MAX_FILES = 10;
    const maxImageSize = 300 * 1024 * 1024; // 300MB for images
    const maxVideoSize = 50 * 1024 * 1024; // 50MB for videos
    const validFiles: File[] = [];
    const urls: string[] = [];

    // Check if adding these files would exceed the limit
    if (selectedFiles.length + files.length > MAX_FILES) {
      toast.error(`You can only upload up to ${MAX_FILES} files per post`);
      return;
    }

    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      // Validate file type (images and videos)
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error(`File "${file.name}" must be an image or video`);
        continue;
      }
      
      // Check file size based on type
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? maxVideoSize : maxImageSize;
      const maxSizeMB = isVideo ? 50 : 300;
      
      if (file.size > maxSize) {
        toast.error(`${isVideo ? 'Video' : 'Image'} "${file.name}" exceeds ${maxSizeMB}MB limit`);
        continue;
      }
      
      validFiles.push(file);
      
      // Handle TIFF/RAW files specially
      const fileName = file.name.toLowerCase();
      const isTiffOrRaw = fileName.endsWith('.tiff') || fileName.endsWith('.tif') || 
                          fileName.endsWith('.cr2') || fileName.endsWith('.nef') || 
                          fileName.endsWith('.arw') || fileName.endsWith('.dng') ||
                          fileName.endsWith('.raw') || fileName.endsWith('.orf') ||
                          fileName.endsWith('.rw2') || fileName.endsWith('.pef') ||
                          fileName.endsWith('.raf');
      
      if (isTiffOrRaw) {
        try {
          toast.info(`Processing ${file.name}...`);
          const { dataUrl } = await loadImageFromFile(file, { enableDownscale: true, maxResolution: 2048 });
          urls.push(dataUrl);
          
          // Convert TIFF/RAW to JPEG for Supabase compatibility
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const jpegFile = new File(
            [blob], 
            file.name.replace(/\.(tiff?|cr2|nef|arw|dng|raw|orf|rw2|pef|raf)$/i, '.jpg'),
            { type: 'image/jpeg' }
          );
          validFiles[validFiles.length - 1] = jpegFile; // Replace with JPEG version
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
          toast.error(`Failed to process ${file.name}`);
          validFiles.pop(); // Remove the file we just added
        }
      } else {
        urls.push(URL.createObjectURL(file));
      }
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...urls]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    if (!description.trim()) {
      toast.error('Please add a description');
      return;
    }

    setUploading(true);

    try {
      // Transcode videos first
      const processedFiles: File[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        if (file.type.startsWith('video/')) {
          try {
            toast.info(`Transcoding video ${i + 1}/${selectedFiles.length}...`);
            const transcodedFile = await transcodeVideo(file);
            processedFiles.push(transcodedFile);
            toast.success(`Video ${i + 1} transcoded successfully`);
          } catch (error) {
            console.error('Transcoding failed, uploading original:', error);
            toast.warning(`Using original video ${i + 1} (transcoding failed)`);
            processedFiles.push(file);
          }
        } else {
          processedFiles.push(file);
        }
      }

      // Upload all files
      const uploadedPaths: string[] = [];
      for (const file of processedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('user-posts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        uploadedPaths.push(fileName);
      }

      // Create single post with multiple files (images/videos)
      const { error: dbError } = await supabase
        .from('user_posts')
        .insert({
          user_id: userId,
          file_name: processedFiles[0].name,
          file_path: uploadedPaths[0], // Primary file
          file_type: processedFiles[0].type,
          file_size: processedFiles.reduce((sum, f) => sum + f.size, 0),
          description: description.trim(),
          category: 'general',
          images: uploadedPaths // All files array
        });

      if (dbError) throw dbError;

      toast.success('Post uploaded successfully');
      
      // Cleanup
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      setDescription('');
      setCategory('general');
      
      onUploadComplete();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload failed', { description: error.message });
    } finally {
      setUploading(false);
      setTranscodingStatus('');
      setTranscodingProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* File Preview Section */}
      <AnimatePresence mode="popLayout">
        {previewUrls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {previewUrls.map((url, index) => {
                const file = selectedFiles[index];
                const isVideo = file?.type.startsWith('video/');
                
                return (
                  <motion.div
                    key={url}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-lg overflow-hidden bg-cosmic-800 border border-primary/20 group"
                  >
                    {isVideo ? (
                      <video
                        src={url}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Button */}
      <div className="flex flex-col gap-3">
        <label
          htmlFor="post-upload"
          className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-primary/30 hover:border-primary/50 rounded-xl bg-cosmic-800/40 hover:bg-cosmic-800/60 cursor-pointer transition-all group"
        >
          <ImageIcon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-cosmic-100">
              {previewUrls.length > 0 ? 'Add more files' : 'Select images or videos'}
            </span>
            <span className="text-xs text-cosmic-400 mt-1">
              {previewUrls.length} / 10 files (Images: max 300MB, Videos: max 50MB)
            </span>
          </div>
          <input
            id="post-upload"
            type="file"
            multiple
            accept="image/*,image/tiff,image/tif,image/x-canon-cr2,image/x-nikon-nef,image/x-sony-arw,image/x-adobe-dng,image/x-panasonic-raw,image/x-olympus-orf,image/x-panasonic-rw2,image/x-pentax-pef,image/x-fuji-raf,.tiff,.tif,.cr2,.nef,.arw,.dng,.raw,.orf,.rw2,.pef,.raf,video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || previewUrls.length >= 10}
          />
        </label>

        {previewUrls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Description */}
            <div>
              <Textarea
                placeholder="Write a caption..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] bg-cosmic-800/40 border-primary/20 focus:border-primary/40 resize-none"
                disabled={uploading}
              />
            </div>

            {/* Post Button */}
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              size="lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Post
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
