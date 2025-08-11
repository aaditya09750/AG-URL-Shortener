# AG-URL Shortener

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)

A modern, real-time URL shortening application built with React, Express, and MongoDB. This comprehensive solution provides efficient URL shortening capabilities, real-time updates via Socket.IO, and a responsive user interface for managing shortened links.

## Core Features

**URL Shortening** - Instantly create shortened URLs with a clean, user-friendly interface. Each URL is assigned a unique code for easy sharing and tracking.

**Real-Time Updates** - Experience seamless real-time synchronization across all connected clients using Socket.IO, ensuring immediate visibility of newly created or deleted URLs.

**Click Tracking** - Monitor the performance of your shortened URLs with built-in click tracking that updates in real-time across all connected devices.

**Admin Panel** - Manage your shortened URLs through an intuitive admin interface with the ability to view, track, and delete links as needed.

**Responsive Design** - Enjoy a consistent experience across all devices with a mobile-first responsive design that adapts to any screen size.

**Persistent Storage** - All shortened URLs are securely stored in MongoDB with automatic caching for improved performance and reliability.

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|----------|
| React | 18.x | Frontend UI framework with hooks and component architecture |
| Express | 4.x | Backend API server for handling URL operations |
| MongoDB | 7.x | NoSQL database for storing URL data |
| Socket.IO | 4.x | Real-time bidirectional event-based communication |
| Vite | 5.x | Next-generation frontend build tool |
| Mongoose | 7.x | MongoDB object modeling for Node.js |
| Axios | 1.x | Promise-based HTTP client for API requests |
| Lucide React | Latest | Modern icon system with consistent styling |

## Quick Start

### Prerequisites

![Node.js](https://img.shields.io/badge/Node.js-16%2B-339933?style=flat-square&logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-Latest-CB3837?style=flat-square&logo=npm&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248?style=flat-square&logo=mongodb&logoColor=white)

### Installation

```bash
# Clone the repository
git clone https://github.com/aaditya09750/url-shortener.git
cd url-shortener

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

```bash
# Start MongoDB (if not running as a service)
# mongod --dbpath /path/to/data/db

# Start the backend server (from the backend directory)
cd backend
npm start

# Start the frontend development server (from the frontend directory)
cd ../frontend
npm run dev

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3002
```

## Usage

1. **Creating a Short URL**
   - Enter a URL in the input field on the homepage
   - Click the "Shorten" button
   - Copy the generated short URL to share

2. **Viewing Statistics**
   - All shortened URLs appear in the results section
   - Each entry displays the original URL, shortened URL, and click count
   - Click counts update in real-time as links are accessed

3. **Managing URLs**
   - Delete unwanted URLs using the delete button
   - Click on a shortened URL to copy it to the clipboard
   - Use the original URL link to visit the destination

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/shorten` | POST | Create a new shortened URL |
| `/api/urls` | GET | Retrieve all shortened URLs |
| `/api/urls/:id` | DELETE | Delete a specific URL by ID |
| `/:code` | GET | Redirect to the original URL |

## Architecture

The application follows a client-server architecture with real-time communication:

- **Frontend**: React application with Socket.IO client for real-time updates
- **Backend**: Express server with Socket.IO for bidirectional communication
- **Database**: MongoDB for persistent storage of URL data
- **Caching**: In-memory caching for improved performance

## Contributing Guidelines

![Contributing](https://img.shields.io/badge/Contributing-Guidelines-purple?style=for-the-badge&logo=git&logoColor=white)

### Development Workflow

1. **Fork Repository** - Create a personal fork with a feature branch from `main`
2. **Development Setup** - Follow installation instructions and verify local environment
3. **Code Implementation** - Implement changes following established patterns and conventions
4. **Quality Assurance** - Test your changes thoroughly before submission
5. **Pull Request** - Submit a comprehensive PR with detailed description and testing notes

## Contact & Support

![Email](https://img.shields.io/badge/Email-aadigunjal0975%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)
![LinkedIn](https://img.shields.io/badge/LinkedIn-aadityagunjal0975-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)

**Technical Support & Collaboration**

For technical inquiries, feature requests, or development collaboration:

- **Primary Contact:** [aadigunjal0975@gmail.com](mailto:aadigunjal0975@gmail.com)
- **LinkedIn:** [aadityagunjal0975](https://www.linkedin.com/in/aadityagunjal0975)

## License & Usage Rights

![License](https://img.shields.io/badge/License-All_Rights_Reserved-red?style=for-the-badge&logo=copyright&logoColor=white)

**Usage Rights:** All rights reserved by the author. Contact for licensing inquiries and commercial usage permissions.

**Attribution Required:** Please credit the original author for any derivative works or academic references.

---

**URL Shortener** provides a robust solution for creating and managing shortened URLs with real-time functionality. This project demonstrates expertise in full-stack development, real-time communication, and database management with a focus on user experience and performance optimization.
