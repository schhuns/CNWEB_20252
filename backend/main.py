from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import base64
from cv_model import process_frame
import uvicorn

app = FastAPI(title="AI Video Streaming API")

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "FastAPI AI Backend is running."}

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket client connected")
    try:
        while True:
            # Receive base64 encoded image from client
            data = await websocket.receive_text()
            
            try:
                # Remove header e.g., "data:image/jpeg;base64,"
                if "," in data:
                    header, base64_data = data.split(",", 1)
                else:
                    base64_data = data
                    header = "data:image/jpeg;base64"
                    
                # Decode base64
                frame_bytes = base64.b64decode(base64_data)
                
                # Process frame (Computer Vision)
                processed_bytes = process_frame(frame_bytes)
                
                # Encode back to base64
                encoded_frame = base64.b64encode(processed_bytes).decode("utf-8")
                
                # Send back with header
                response_data = f"{header},{encoded_frame}"
                
                await websocket.send_text(response_data)
            except Exception as e:
                print(f"Error processing frame: {e}")
                
    except WebSocketDisconnect:
        print("WebSocket client disconnected")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
