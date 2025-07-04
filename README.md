# Maritime Activity Monitoring Platform

This repository contains the assignments for the Software Engineering (ΥΣ09) course of DIT NKUA.

## Project Description

Our project focuses on developing a web platform for monitoring maritime activity through AIS (Automatic Identification System) data. The platform allows users to track vessel positions, movements, and related maritime information in real-time.

## Features

- Real-time vessel tracking on interactive maps
- Filtering options based on vessel type, status, and position
- User accounts with saved vessels functionality
- Notification system for vessel events
- Administrative panel for system management

## Team Members

- **Μάριος Γιαννόπουλος, Α.Μ. 1115202000032**
- **Γεώργιος Κορύλλος, Α.Μ. 1115202100069**
- **Αργύριος Λαζαρίδης, Α.Μ. 1115202100083**
- **Όλγα Πασβάνη, Α.Μ. 1115202100146**

## Technologies Used

- Frontend: HTML, CSS, JavaScript, Tailwind CSS, React.js
- Maps: Leaflet.js
- Backend: Java with Spring Boot, Maven
- Database: PostgreSQL
- Microservices: Docker, Docker Compose

## Installation and Setup
1. Clone the repository:
```bash
git clone
```
2. Navigate to the project directory:
```bash
cd Software-Engineering
```
3. Install dependencies:
You need to use 2 separate terminals for the frontend and backend.

Terminal 1 (Frontend):
```bash
cd frontend
npm install
```
Terminal 2 (Backend):
```bash
cd backend
sudo docker-compose up --build
```

4. Start the application:
    - For the frontend, run:
    ```bash
    npm run dev
    ```
    - For the backend, ensure Docker is running and the services are up.    
5. Access the application:
    - Open your web browser and go to `https://localhost:5173` for the frontend.
    - The backend API will be available at `http://localhost:8443`.

## Cleaning Up

### Stop Services
To stop the backend services while preserving data:
```bash
sudo docker-compose down
```

### Complete Cleanup
To stop the backend services and remove all volumes and images (⚠️ **This will delete all database data**):
```bash
sudo docker-compose down -v --rmi all
```

### Stop Frontend
To stop the frontend development server:
- Press `Ctrl + C` in the terminal where `npm run dev` is running

### Restart Everything
If you need to restart the entire application:
```bash
# Stop everything
sudo docker-compose down

# Start backend
sudo docker-compose up --build

# In another terminal, start frontend
cd frontend
npm run dev
```
