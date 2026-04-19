import cv2
import numpy as np

# Load the pre-trained Haar Cascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def process_frame(frame_bytes: bytes) -> bytes:
    # Convert bytes to numpy array
    np_arr = np.frombuffer(frame_bytes, np.uint8)
    
    # Check if we have valid data
    if np_arr.size == 0:
        return frame_bytes
        
    # Decode image
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    
    if frame is None:
        return frame_bytes

    # Convert to grayscale for face detection
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Detect faces
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    
    # Draw bounding boxes (Verkada/Cyberpunk style - Cyan)
    color = (255, 255, 0) # Cyan in BGR
    for (x, y, w, h) in faces:
        # Subtle bounding box
        cv2.rectangle(frame, (x, y), (x+w, y+h), color, 1)
        
        # Draw corners for a modern HUD effect
        line_len = 15
        thickness = 2
        
        # Top left
        cv2.line(frame, (x, y), (x + line_len, y), color, thickness)
        cv2.line(frame, (x, y), (x, y + line_len), color, thickness)
        # Top right
        cv2.line(frame, (x + w, y), (x + w - line_len, y), color, thickness)
        cv2.line(frame, (x + w, y), (x + w, y + line_len), color, thickness)
        # Bottom left
        cv2.line(frame, (x, y + h), (x + line_len, y + h), color, thickness)
        cv2.line(frame, (x, y + h), (x, y + h - line_len), color, thickness)
        # Bottom right
        cv2.line(frame, (x + w, y + h), (x + w - line_len, y + h), color, thickness)
        cv2.line(frame, (x + w, y + h), (x + w, y + h - line_len), color, thickness)

        # Add a sleek label
        cv2.putText(frame, "HUMAN DETECTED", (x, max(15, y - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1, cv2.LINE_AA)
        
    # Compress back to JPEG
    ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
    if not ret:
        return frame_bytes
        
    return buffer.tobytes()
