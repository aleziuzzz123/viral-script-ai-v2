
import { useCallback } from 'react';

export const useVideoProcessor = () => {
  const extractFrames = useCallback((videoFile: File, maxFrames: number): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const videoUrl = URL.createObjectURL(videoFile);

      video.src = videoUrl;
      video.muted = true;

      let frames: string[] = [];

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 0;
      };

      video.onseeked = async () => {
        if (!context) {
          reject(new Error("Canvas 2D context is not available."));
          return;
        }

        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        frames.push(frameData);

        if (frames.length < maxFrames && video.currentTime < video.duration) {
          // Move to the next frame interval
          video.currentTime += video.duration / maxFrames;
        } else {
          // Finished
          URL.revokeObjectURL(videoUrl);
          resolve(frames);
        }
      };

      video.onerror = (e) => {
        URL.revokeObjectURL(videoUrl);
        reject(new Error("Error loading video file. It might be corrupt or in an unsupported format."));
      };

      video.onended = () => {
        URL.revokeObjectURL(videoUrl);
        resolve(frames);
      };

      // Start the process
      video.play().then(() => {
         // Pause immediately to seek to the first frame
         video.pause();
         // Start seeking
         video.currentTime = 0;
      }).catch(err => {
         reject(new Error(`Could not play video to start frame extraction: ${err.message}`));
      });
    });
  }, []);

  return { extractFrames };
};
