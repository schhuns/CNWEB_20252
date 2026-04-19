"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface VideoStreamProps {
  cameraId: string;
}

export default function VideoStream({ cameraId }: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const animationFrameId = useRef<number | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
        connectWebSocket();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setStatus('disconnected');
  };

  const connectWebSocket = () => {
    setStatus('connecting');
    // Connect to FastAPI backend
    const ws = new WebSocket('ws://localhost:8000/ws/stream');
    
    ws.onopen = () => {
      setStatus('connected');
      console.log('WebSocket connected');
      // Start sending frames
      sendFrameLoop();
    };

    ws.onmessage = (event) => {
      // Received processed frame with AI bounding boxes
      const imageSrc = event.data;
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
          };
          img.src = imageSrc;
        }
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      console.log('WebSocket disconnected');
      if (isStreaming) {
        // Simple reconnect after 3 seconds
        setTimeout(() => connectWebSocket(), 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  };

  const sendFrameLoop = useCallback(() => {
    if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    // Use a temporary canvas to get the base64 encoded frame
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 640;
    tempCanvas.height = 480;
    const ctx = tempCanvas.getContext('2d');
    
    if (ctx && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
      // Get base64 string
      const base64Data = tempCanvas.toDataURL('image/jpeg', 0.6); // Quality 0.6 to balance lag and clarity
      
      // Send to backend
      wsRef.current.send(base64Data);
    }

    // Send around ~15-20 frames per second to avoid overloading
    setTimeout(() => {
      if (isStreaming) {
        animationFrameId.current = requestAnimationFrame(sendFrameLoop);
      }
    }, 50); 
  }, [isStreaming]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="stream-container">
      <div className="video-wrapper">
        {/* Hidden video element to capture webcam */}
        <video ref={videoRef} playsInline muted style={{ display: 'none' }} />
        
        {/* Canvas displaying the AI processed frame from backend */}
        <canvas 
          ref={canvasRef} 
          width={640} 
          height={480}
          style={{ 
            display: 'block', 
            backgroundColor: isStreaming ? '#000' : 'transparent',
            opacity: isStreaming ? 1 : 0,
            transition: 'opacity 0.3s'
          }}
        />

        {!isStreaming && (
          <div className="camera-placeholder">
            CAMERA OFFLINE
          </div>
        )}
        
        <div className={`connection-status status-${status}`}>
          <div className="status-dot"></div>
          {status === 'connected' ? 'LIVE - AI ACTIVE' : status === 'connecting' ? 'CONNECTING...' : 'OFFLINE'}
        </div>
        
        <div className="camera-label">{cameraId}</div>
      </div>
      
      <div className="controls">
        {!isStreaming ? (
          <button className="btn btn-primary" onClick={startCamera}>
            Enable AI Camera
          </button>
        ) : (
          <button className="btn btn-danger" onClick={stopCamera}>
            Stop Stream
          </button>
        )}
      </div>
    </div>
  );
}
