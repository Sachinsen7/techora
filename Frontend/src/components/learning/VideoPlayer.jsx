import React, { useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";

function VideoPlayer({ src, onProgress, onEnded, lastWatchedPosition }) {
  const videoRef = useRef(null);
  const progressInterval = useRef(null);

  useEffect(() => {
    if (videoRef.current && lastWatchedPosition > 0) {
      videoRef.current.currentTime = lastWatchedPosition;
    }
  }, [lastWatchedPosition]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && onProgress) {
      if (progressInterval.current) {
        clearTimeout(progressInterval.current);
      }
      progressInterval.current = setTimeout(() => {
        onProgress(videoRef.current.currentTime);
      }, 5000);
    }
  }, [onProgress]);

  const handleEnded = useCallback(() => {
    if (onEnded) {
      onEnded();
    }
    if (progressInterval.current) {
      clearTimeout(progressInterval.current);
    }
  }, [onEnded]);

  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearTimeout(progressInterval.current);
      }
    };
  }, []);

  if (!src) {
    return (
      <div className="w-full aspect-video bg-gray-200 flex items-center justify-center rounded-lg text-text-secondary">
        No video source provided.
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-md">
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        controlsList="nodownload"
        preload="auto"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

VideoPlayer.propTypes = {
  src: PropTypes.string,
  onProgress: PropTypes.func,
  onEnded: PropTypes.func,
  lastWatchedPosition: PropTypes.number,
};

export default VideoPlayer;
