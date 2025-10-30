# AG-URL Shortener

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)

A modern, enterprise-grade URL shortening application built with React, Express, and MongoDB. This comprehensive full-stack solution delivers efficient URL shortening capabilities, real-time updates via Socket.IO, and a responsive user interface for seamless URL management across all devices.

## Live Preview

**Experience the application live:** [https://ag-url-shortener.netlify.app/](https://ag-url-shortener.netlify.app/)

![Live Demo](https://img.shields.io/badge/Live%20Demo-Available-success?style=for-the-badge&logo=netlify&logoColor=white)

## Core Features

**Intelligent URL Shortening** - Instantly create shortened URLs with a clean, intuitive interface. Each URL receives a unique collision-resistant code optimized for sharing and tracking across platforms.

**Real-Time Synchronization** - Experience seamless real-time updates across all connected clients using Socket.IO, ensuring immediate visibility of newly created, accessed, or deleted URLs without page refreshes.

**Advanced Click Analytics** - Monitor the performance of your shortened URLs with comprehensive click tracking that updates in real-time across all connected devices, providing instant insights into link engagement.

**Comprehensive Admin Dashboard** - Manage your shortened URLs through an intuitive administrative interface with complete CRUD operations, real-time statistics, and bulk management capabilities.

**Mobile-First Responsive Design** - Enjoy a consistent, optimized experience across all devices with a responsive design that adapts seamlessly to desktop, tablet, and mobile screen sizes.

**Enterprise-Grade Storage** - All shortened URLs are securely stored in MongoDB with automatic connection retry, data validation, and in-memory caching for enhanced performance and 99.9% uptime reliability.

**Smart Caching System** - Dual-layer caching architecture with both client-side and server-side optimization for lightning-fast URL resolution and reduced database load.

## Technology Stack

| Technology | Version | Purpose | Implementation |
|------------|---------|----------|----------------|
| React | 18.x | Frontend UI framework with hooks and component architecture | Modern functional components with state management |
| Express | 4.x | Backend API server for handling URL operations | RESTful API with comprehensive error handling |
| MongoDB | 7.x | NoSQL database for storing URL data | Document-based storage with indexing optimization |
| Socket.IO | 4.x | Real-time bidirectional event-based communication | WebSocket connections with fallback protocols |
| Vite | 5.x | Next-generation frontend build tool | Hot module replacement and optimized bundling |
| Mongoose | 7.x | MongoDB object modeling for Node.js | Schema validation and middleware integration |
| Axios | 1.x | Promise-based HTTP client for API requests | Interceptors and automatic request/response transformation |
| Lucide React | Latest | Modern icon system with consistent styling | Scalable vector icons with accessibility support |

## Quick Start

### Prerequisites

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-9%2B-CB3837?style=flat-square&logo=npm&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7%2B-47A248?style=flat-square&logo=mongodb&logoColor=white)

- Node.js 18.0 or higher
- npm 9.0 or higher  
- MongoDB 7.0 or higher (local installation or Atlas account)
- Modern web browser with ES6+ support

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

# Optional: Install development tools globally
npm install -g nodemon concurrently
```

### Environment Configuration

Create environment files for both frontend and backend:

**Backend (.env)**
```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/url-shortener
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:3002
VITE_SOCKET_URL=http://localhost:3002
```

### Running the Application

```bash
# Option 1: Start services separately

# Start MongoDB (if running locally)
mongod --dbpath /path/to/data/db

# Start the backend server (from the backend directory)
cd backend
npm start
# or with auto-reload: npm run dev

# Start the frontend development server (from the frontend directory)
cd ../frontend
npm run dev

# Option 2: Start both services concurrently (if configured)
npm run dev:full-stack

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3002
# Socket.IO: ws://localhost:3002
```

## Application Usage

### Creating Short URLs
1. **URL Input** - Enter any valid URL in the input field on the homepage
2. **Instant Generation** - Click the "Shorten" button for immediate URL creation
3. **Copy & Share** - Use the copy button to instantly copy the generated short URL to clipboard
4. **Format Support** - Accepts URLs with or without protocol prefixes (automatically adds HTTPS)

### Real-Time Analytics
1. **Live Dashboard** - All shortened URLs appear instantly in the results section
2. **Click Tracking** - Each entry displays the original URL, shortened URL, and real-time click count
3. **Auto-Updates** - Click counts update automatically across all connected clients
4. **Performance Metrics** - View creation timestamps and engagement statistics

### URL Management
1. **Quick Actions** - Delete unwanted URLs using the integrated delete button
2. **Smart Copy** - Click on any shortened URL to automatically copy it to clipboard
3. **Direct Navigation** - Click original URL links to visit destinations in new tabs
4. **Bulk Operations** - Select multiple URLs for batch management operations

## API Documentation

### REST API Endpoints

| Endpoint | Method | Description | Request Format | Response Format |
|----------|--------|-------------|----------------|-----------------|
| `/api/shorten` | POST | Create a new shortened URL | `{"url": "https://example.com"}` | Complete URL object with metadata |
| `/api/urls` | GET | Retrieve all shortened URLs | None | Array of URL objects with statistics |
| `/api/urls/:id` | DELETE | Delete a specific URL by ID | None | Success confirmation with ID |
| `/:code` | GET | Redirect to the original URL | None | HTTP 302 redirect response |

### Socket.IO Events

**Client to Server:**
- `new_url` - Request creation of new shortened URL
- `delete_url` - Request deletion of existing URL
- `get_urls` - Request all URLs (reconnection recovery)

**Server to Client:**
- `url_created` - New URL creation notification
- `url_deleted` - URL deletion notification  
- `url_clicked` - Real-time click count updates
- `urls` - Complete URL list (initial load)

## System Architecture

The application implements a modern full-stack architecture optimized for scalability and real-time performance:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│   Socket.IO     │◄──►│  Express API    │
│   (Frontend)    │    │   WebSocket     │    │   (Backend)     │
│                 │    │   Gateway       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────►│   HTTP REST     │◄─────────────┘
                        │     API         │
                        └─────────────────┘
                                │
                     ┌─────────────────────────┐
                     │      MongoDB Atlas      │
                     │   Persistent Storage    │
                     │   + Connection Pool     │
                     └─────────────────────────┘
```

**Architecture Highlights:**
- **Frontend**: React SPA with Vite for optimal development experience and build optimization
- **Backend**: Express.js server with comprehensive middleware stack and error handling
- **Database**: MongoDB with Mongoose ODM for robust data modeling and validation
- **Real-Time Layer**: Socket.IO for bidirectional communication with automatic fallbacks
- **Deployment**: Frontend on Netlify CDN, Backend on cloud infrastructure with auto-scaling

## Performance Optimization

**Frontend Optimizations:**
- Code splitting and lazy loading for reduced initial bundle size
- React.memo and useMemo for component render optimization
- Debounced input handling for improved user experience
- Service worker integration for offline functionality

**Backend Optimizations:**
- Connection pooling for database operations
- In-memory caching for frequently accessed URLs
- Efficient database indexing on URL codes and creation dates
- Compression middleware for reduced payload sizes

**Database Optimizations:**
- Compound indexes for optimized query performance
- Connection retry logic with exponential backoff
- Lean queries for reduced memory footprint
- Automatic data validation and sanitization

## Development Features

**Hot Reload Development**
- Vite HMR for instant frontend updates
- Nodemon integration for automatic backend restarts
- Socket.IO development mode with enhanced debugging

**Code Quality Tools**
- ESLint configuration for consistent code formatting
- Prettier integration for automated code styling
- Pre-commit hooks for quality assurance
- TypeScript support for enhanced development experience

## Deployment Guide

### Production Environment Variables

**Frontend (Netlify)**
```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_SOCKET_URL=https://your-api-domain.com
```

**Backend (Server/Cloud)**
```env
PORT=3002
MONGODB_URI=...
NODE_ENV=production
CORS_ORIGIN=https://ag-url-shortener.netlify.app
```

### Build Commands

```bash
# Frontend build for production
cd frontend
npm run build

# Backend preparation for deployment
cd backend
npm ci --only=production
```

## Contributing Guidelines

![Contributing](https://img.shields.io/badge/Contributing-Welcome-brightgreen?style=for-the-badge&logo=git&logoColor=white)

### Development Workflow

1. **Repository Setup** - Fork the repository and create a feature branch from `main` with descriptive naming
2. **Development Environment** - Follow installation instructions and verify both frontend and backend functionality
3. **Code Implementation** - Implement changes following established patterns, component structure, and API conventions
4. **Comprehensive Testing** - Test all features including real-time updates, URL creation, deletion, and analytics
5. **Quality Assurance** - Ensure responsive design, cross-browser compatibility, and performance optimization
6. **Documentation Update** - Update relevant documentation for any API changes or new features
7. **Pull Request Submission** - Submit a detailed PR with comprehensive description, testing notes, and screenshots

### Code Standards

- Follow React functional component patterns with hooks
- Implement proper error boundaries and loading states
- Use semantic HTML and ARIA attributes for accessibility
- Maintain consistent naming conventions and file structure
- Write comprehensive JSDoc comments for complex functions
- Ensure mobile-first responsive design principles

## Testing Strategy

**Frontend Testing:**
- Component unit tests with React Testing Library
- Integration tests for user workflows
- Cross-browser compatibility testing
- Responsive design validation across devices

**Backend Testing:**
- API endpoint testing with comprehensive coverage
- Socket.IO event testing for real-time functionality
- Database integration testing with test fixtures
- Performance testing under concurrent load

## Contact & Support

![Email](https://img.shields.io/badge/Email-aadigunjal0975%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)
![LinkedIn](https://img.shields.io/badge/LinkedIn-aadityagunjal0975-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-aaditya09750-181717?style=for-the-badge&logo=github&logoColor=white)

**Technical Support & Collaboration**

For technical inquiries, feature requests, bug reports, or development collaboration:

- **Primary Contact:** [aadigunjal0975@gmail.com](mailto:aadigunjal0975@gmail.com)
- **LinkedIn:** [aadityagunjal0975](https://www.linkedin.com/in/aadityagunjal0975)
- **GitHub Issues:** [Create Issue](https://github.com/aaditya09750/url-shortener/issues)
- **Live Demo Feedback:** Use the application and provide feedback through GitHub

## License & Usage Rights

![License](https://img.shields.io/badge/License-All_Rights_Reserved-red?style=for-the-badge&logo=copyright&logoColor=white)

**Usage Rights:** All rights reserved by the author. Contact for licensing inquiries, commercial usage permissions, and enterprise deployment discussions.

**Attribution Required:** Please credit the original author for any derivative works, academic references, or commercial implementations.

**Commercial License:** Available for enterprise use cases with custom features and dedicated support.

---

**AG-URL Shortener** delivers a comprehensive, production-ready solution for URL shortening with real-time functionality and modern user experience. This full-stack application demonstrates expertise in React development, Node.js backend architecture, real-time communication protocols, and scalable database design with a focus on performance, reliability, and user-centric design principles.

**🌐 Try it live:** [https://ag-url-shortener.netlify.app/](https://ag-url-shortener.netlify.app/)
