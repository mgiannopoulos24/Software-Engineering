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

## Technologies Used

- Frontend: HTML, CSS, JavaScript, Tailwind CSS, React.js
- Websockets: SockJS
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
3. Compose the project:
```bash
sudo docker-compose up --build
```
4. Access the application:
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

### Restart Everything
If you need to restart the entire application:
```bash
# Stop everything
sudo docker-compose down

# Rebuild and start the services
sudo docker-compose up --build
```

## Important Notes
In order to run the entire application, you need to download the AIS data from the following links:
- [AIS Data P1](https://zenodo.org/records/1167595/files/%5BP1%5D%20AIS%20Data.zip?download=1) (Download this with wget)
- [vessel_types.csv](https://owncloud.skel.iit.demokritos.gr:443/index.php/s/k8eBG9Ze7B5TCjX/download) (Download this with curl)

Once downloaded, place the files in the `backend/src/main/resources/AIS-Data` directory and start the build process.
