# CNWEB_20252
Đề tài : Hệ thống streaming và xử lí ảnh real-time

Thành viên nhóm : 
+ Nguyễn Khắc Quang 20225760
+ Seng Saikchhun 20239708
+ Chu Đình Sơn 20215636



1. Clone the project
git clone https://github.com/20225760kquang/CNWEB_20252.git
cd CNWEB_20252

2. Backend setup (FastAPI + OpenCV)
Go to backend
cd backend
Create virtual environment
python3 -m venv venv
source venv/bin/activate
Install dependencies (IMPORTANT)
pip install fastapi uvicorn "uvicorn[standard]" opencv-python numpy

Run backend
uvicorn main:app --reload
✔ Backend should be at:
http://127.0.0.1:8000

3. Frontend setup (Next.js)
Open a NEW terminal:
cd CNWEB_20252/frontend
Install dependencies
npm install
Run frontend
npm run dev
✔ Frontend runs at:
http://localhost:3000
