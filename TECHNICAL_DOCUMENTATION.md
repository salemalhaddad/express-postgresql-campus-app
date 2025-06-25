# Smart Campus Navigation and Facility Booking System (SCNFBS)
## Technical Documentation

**Project:** COSC333 Software Systems & Design
**Version:** 1.0
**Date:** June 25, 2025
**Authors:** Salem Alhaddad
**Professor:** Dr. Kamal Taha

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Requirements Analysis](#3-requirements-analysis)
4. [System Design](#4-system-design)
5. [Implementation](#5-implementation)
6. [Database Schema](#6-database-schema)
7. [API Documentation](#7-api-documentation)
8. [Security Implementation](#8-security-implementation)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment Guide](#10-deployment-guide)
11. [User Manual](#11-user-manual)
12. [Future Enhancements](#12-future-enhancements)

---

## 1. Project Overview

### 1.1 System Purpose
The Smart Campus Navigation and Facility Booking System (SCNFBS) is a comprehensive web-based platform designed to enhance the university campus experience by providing:

- **Interactive Navigation**: Real-time campus maps with step-by-step directions between buildings, supporting both walking and accessible routes with estimated times and distances
- **Facility Booking**: Streamlined reservation system for study rooms, lecture halls, laboratories, and conference rooms with real-time availability checking and conflict prevention
- **Resource Management**: Administrative tools for facility oversight including usage analytics, booking rule configuration, and equipment management
- **Multi-User Support**: Role-based access control supporting Students, Faculty, Staff, Administrators, and Visitors with appropriate permission levels for each role

### 1.2 Problem Statement
Universities face significant challenges in campus navigation and facility utilization:

**Navigation Challenges:**
- Students and visitors struggle to locate buildings and rooms on large campuses
- Lack of accessible route information for users with mobility limitations
- No unified system for campus wayfinding and directions
- Inefficient routing leading to late arrivals and missed appointments

**Facility Management Issues:**
- Manual booking processes leading to double-bookings and conflicts
- Poor visibility into room availability and utilization rates
- Lack of integration between different facility types and booking systems
- Administrative overhead in managing reservations and user access

**User Experience Problems:**
- Fragmented systems requiring multiple logins and interfaces
- No mobile-friendly solutions for on-the-go campus navigation
- Limited self-service options for facility booking and management

### 1.3 Solution Overview
SCNFBS addresses these challenges through an integrated platform that combines:

**Unified Navigation System:**
- Interactive campus map with real-time building and room locations
- Intelligent routing algorithms for optimal path calculation
- Accessibility-aware routing for users with mobility requirements
- Turn-by-turn directions with estimated walking times

**Intelligent Booking Engine:**
- Real-time room availability with advanced search and filtering
- Automated conflict detection and prevention
- Role-based booking privileges and restrictions
- Integrated notification system for confirmations and reminders

**Comprehensive Administration:**
- Centralized user and facility management
- Usage analytics and reporting for data-driven decisions
- Configurable booking rules and access controls
- Audit logging for security and compliance

### 1.4 Key Features
- **Interactive Campus Map** with building locations and routing
- **Real-time Room Booking** with availability checking
- **Multi-Role Authentication** (Student, Faculty, Staff, Administrator, Visitor)
- **Responsive Design** for desktop and mobile devices
- **RESTful API** architecture for scalability
- **Secure Authentication** with JWT tokens
- **Database Integration** with PostgreSQL/Supabase

### 1.5 Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express.js framework
- **Database**: PostgreSQL (Supabase cloud)
- **Authentication**: JWT (JSON Web Tokens)
- **Development**: Git version control, npm package management
- **Deployment**: Local development server with production-ready configuration

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Web Browser   │  │   Mobile Web    │  │   Admin     │ │
│  │   (Students)    │  │   (Faculty)     │  │   Panel     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Navigation │  │   Booking   │  │   Authentication    │ │
│  │   Module    │  │   Module    │  │      Module         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ User Mgmt   │  │  Building   │  │     Notification    │ │
│  │   Module    │  │   Module    │  │      Module         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              RESTful API Endpoints                      │ │
│  │  /api/auth/*  /api/users/*  /api/buildings/*           │ │
│  │  /api/rooms/* /api/bookings/* /api/navigation/*        │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   PostgreSQL    │  │   File Storage  │  │   Session   │ │
│  │   Database      │  │   (Images)      │  │   Store     │ │
│  │   (Supabase)    │  │                 │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

#### 2.2.1 Core Modules
1. **Authentication Module**: User login/registration, JWT token management
2. **Navigation Module**: Campus mapping, pathfinding, directions
3. **Booking Module**: Room reservation, availability checking
4. **User Management**: Profile management, role-based access
5. **Building Management**: Campus infrastructure data
6. **Administrative Tools**: System configuration, reporting

#### 2.2.2 Data Flow
1. **User Request** → Web Interface
2. **Frontend** → API Call to Backend
3. **Backend** → Database Query/Update
4. **Database** → Response Data
5. **Backend** → JSON Response
6. **Frontend** → UI Update

---

## 3. Requirements Analysis

### 3.1 Functional Requirements

#### 3.1.1 User Authentication & Authorization
-  **FR001**: System shall support user registration with email verification
-  **FR002**: System shall authenticate users with secure login
-  **FR003**: System shall implement role-based access control (RBAC)
-  **FR004**: System shall support password reset functionality
-  **FR005**: System shall maintain user sessions securely

#### 3.1.2 Campus Navigation
-  **FR006**: System shall display interactive campus map
-  **FR007**: System shall provide building search functionality
-  **FR008**: System shall calculate routes between locations
-  **FR009**: System shall support accessible path options
-  **FR010**: System shall show real-time directions

#### 3.1.3 Facility Booking
-  **FR011**: System shall display room availability in real-time
-  **FR012**: System shall allow authorized booking of facilities
-  **FR013**: System shall enforce booking rules and restrictions
-  **FR014**: System shall send booking confirmations
-  **FR015**: System shall manage booking conflicts

#### 3.1.4 Administrative Functions
-  **FR016**: System shall allow building and room management
-  **FR017**: System shall provide user management capabilities
-  **FR018**: System shall generate utilization reports
-  **FR019**: System shall configure booking rules
-  **FR020**: System shall audit system activities

### 3.2 Non-Functional Requirements

#### 3.2.1 Performance Requirements
-  **NFR001**: System response time < 2 seconds for standard operations
-  **NFR002**: System shall support 100+ concurrent users
-  **NFR003**: Database queries optimized for < 500ms response
-  **NFR004**: Map rendering < 3 seconds initial load

#### 3.2.2 Security Requirements
-  **NFR005**: All data transmission encrypted (HTTPS)
-  **NFR006**: Password encryption using bcrypt (12 rounds)
-  **NFR007**: JWT tokens with expiration (24h access, 7d refresh)
-  **NFR008**: Input validation and sanitization
-  **NFR009**: Rate limiting to prevent abuse

#### 3.2.3 Usability Requirements
-  **NFR010**: Responsive design for mobile devices
-  **NFR011**: Intuitive navigation with < 3 clicks to book
-  **NFR012**: Accessibility compliance (WCAG 2.1)
-  **NFR013**: Cross-browser compatibility

#### 3.2.4 Reliability Requirements
-  **NFR014**: 99.5% uptime availability
-  **NFR015**: Graceful error handling and recovery
-  **NFR016**: Data backup and recovery procedures
-  **NFR017**: Connection pooling for database reliability

---

## 4. System Design

### 4.1 UML Diagrams

#### 4.1.1 Use Case Diagram

The system's use case diagram defines interactions between different user roles and system functionalities.

**Primary Actors and Use Cases:**

**Student Actor:**
- Search Buildings/Rooms
- View Campus Map
- Get Directions
- Book Study Rooms
- View Booking History
- Manage Profile

**Faculty Actor:**
- All Student capabilities
- Book Lecture Halls
- Book Laboratories
- View Advanced Reports

**Staff Actor:**
- All Faculty capabilities
- Manage Building Access
- Configure Rooms

**Administrator Actor:**
- All Staff capabilities
- Manage Users
- Generate Reports
- Configure System
- Manage Buildings

**Visitor Actor:**
- Search Buildings/Rooms
- View Campus Map
- Get Directions
- Limited facility search (no booking)

#### 4.1.2 Class Diagram

The domain model consists of the following core entities and their relationships:

**User Entity**
- Attributes: userId, username, email, passwordHash, firstName, lastName, role, phone, studentId, employeeId, isActive, lastLogin, timestamps
- Methods: authenticate(), hasPermission(), getBookingHistory()
- Relationships: One-to-many with Bookings, Notifications, AuditLogs

**Building Entity**
- Attributes: buildingId, code, name, address, latitude, longitude, floors, isAccessible, description, operatingHours, timestamps
- Methods: create(), findByCode(), getRooms(), getAvailableRooms(), calculateDistance()
- Relationships: One-to-many with Rooms and Entrances

**Room Entity**
- Attributes: roomId, buildingId, roomNumber, name, type, capacity, floor, isAccessible, isBookable, isActive, description, hourlyRate, timestamps
- Methods: create(), findById(), isAvailable(), getBookings(), getEquipment()
- Relationships: Many-to-one with Building, One-to-many with Bookings and Equipment

**Booking Entity**
- Attributes: bookingId, roomId, userId, startTime, endTime, purpose, status, notes, timestamps
- Methods: create(), findById(), cancel(), confirm(), checkConflicts(), sendNotification()
- Relationships: Many-to-one with User and Room

**Equipment Entity**
- Attributes: equipmentId, roomId, name, type, description, isWorking, timestamps
- Relationships: Many-to-one with Room

**Entrance Entity**
- Attributes: entranceId, buildingId, name, latitude, longitude, floor, isAccessible, isMain, operatingHours, timestamps
- Relationships: Many-to-one with Building

**MapPath Entity**
- Attributes: pathId, fromBuilding, toBuilding, distance, estimatedTime, pathType, isAccessible, coordinates, timestamps
- Methods: create(), findRoute(), calculateShortestPath()

**Notification Entity**
- Attributes: notificationId, userId, type, title, message, isRead, createdAt
- Methods: create(), findByUser(), markAsRead(), sendEmail()
- Relationships: Many-to-one with User

**AuditLog Entity**
- Attributes: logId, userId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent, createdAt
- Methods: create(), findByUser(), findByEntity()
- Relationships: Many-to-one with User

#### 4.1.3 Sequence Diagrams

**Authentication Process Sequence:**
1. User submits login credentials to Frontend
2. Frontend sends POST request to Auth Controller
3. Auth Controller validates credentials with User Service
4. User Service queries Database for user data
5. User Service performs password verification using bcrypt
6. If valid: JWT Service generates token, returns success response
7. If invalid: Returns 401 Unauthorized error
8. Frontend stores token and updates UI accordingly

**Room Booking Process Sequence:**
1. Student searches for available rooms via Frontend
2. Frontend calls Booking Controller with search criteria
3. Booking Controller queries Room Service for availability
4. Room Service performs complex database query with time overlap checks
5. Available rooms returned to Frontend for display
6. Student selects room and submits booking request
7. Booking Controller validates authentication token
8. Booking Service creates booking within database transaction
9. If successful: Notification Service sends confirmation email
10. If conflict: Transaction rolled back, error returned

**Navigation Process Sequence:**
1. User requests directions between two buildings
2. Frontend calls Navigation Controller with start/end locations
3. Navigation Controller queries Building Service for coordinates
4. Navigation Service calculates optimal route using Map Service
5. Map Service computes distance, time, and waypoints
6. Route data returned with turn-by-turn directions
7. Frontend displays interactive map with highlighted path

#### 4.1.4 Component Diagram

**System Architecture Layers:**

**Frontend Layer Components:**
- Web Browser Interface (HTML5, CSS3, JavaScript)
- Mobile Web Application (Responsive design)
- Admin Dashboard (Administrative tools)

**API Gateway Components:**
- Express.js Router (Request routing)
- Authentication Middleware (JWT validation)
- Rate Limiting (Request throttling)
- CORS Handler (Cross-origin requests)

**Application Services:**
- Authentication Service (User login/registration)
- User Management Service (Profile management)
- Building Service (Campus infrastructure)
- Room Service (Facility management)
- Booking Service (Reservation logic)
- Navigation Service (Route calculation)
- Notification Service (Email/SMS alerts)
- Audit Service (Activity logging)

**Data Access Layer:**
- User Repository (User data operations)
- Building Repository (Building data operations)
- Room Repository (Room data operations)
- Booking Repository (Booking data operations)
- Audit Repository (Log data operations)

**External Services:**
- Email Service (SMTP notifications)
- SMS Service (Text notifications)
- File Storage (Image/document storage)

**Database Layer:**
- PostgreSQL Database (Primary data store)
- Connection Pool (Database connection management)
- Query Builder (SQL query construction)

### 4.2 Core Domain Models

```javascript
// User Entity
class User {
  userId: UUID
  username: String
  email: String
  passwordHash: String
  firstName: String
  lastName: String
  role: UserRole
  phone: String
  studentId: String
  employeeId: String
  isActive: Boolean
  lastLogin: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}

// Building Entity
class Building {
  buildingId: UUID
  code: String
  name: String
  address: String
  latitude: Decimal
  longitude: Decimal
  floors: Integer
  isAccessible: Boolean
  description: Text
  operatingHours: JSON
  createdAt: DateTime
  updatedAt: DateTime
}

// Room Entity
class Room {
  roomId: UUID
  buildingId: UUID
  roomNumber: String
  name: String
  type: RoomType
  capacity: Integer
  floor: Integer
  isAccessible: Boolean
  isBookable: Boolean
  isActive: Boolean
  description: Text
  hourlyRate: Decimal
  createdAt: DateTime
  updatedAt: DateTime
}

// Booking Entity
class Booking {
  bookingId: UUID
  roomId: UUID
  userId: UUID
  startTime: DateTime
  endTime: DateTime
  purpose: String
  status: BookingStatus
  notes: Text
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 4.3 Sequence Diagrams

#### 4.3.1 User Authentication Flow
```
User → Frontend → Backend → Database
 │        │         │         │
 │──login request──→│         │
 │        │         │──validate──→│
 │        │         │←─user data──│
 │        │←─JWT token──────────│
 │←─auth success────│         │
```

#### 4.3.2 Room Booking Flow
```
User → Frontend → Backend → Database
 │        │         │         │
 │──search rooms───→│         │
 │        │         │──query available──→│
 │        │         │←─room list────────│
 │        │←─room options─────│         │
 │──book room──────→│         │
 │        │         │──create booking──→│
 │        │         │←─booking created──│
 │        │←─confirmation─────│         │
```

### 4.4 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Components                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Auth     │  │ Navigation  │  │      Booking        │ │
│  │ Component   │  │ Component   │  │     Component       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Map      │  │   Profile   │  │      Admin          │ │
│  │ Component   │  │ Component   │  │     Component       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Components                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Routes    │  │ Controllers │  │     Middleware      │ │
│  │  (Express)  │  │  (Business  │  │   (Auth, CORS,      │ │
│  │             │  │   Logic)    │  │   Validation)       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Models    │  │   Services  │  │     Utilities       │ │
│  │ (Database)  │  │ (External)  │  │   (Logger, etc.)    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation

### 5.1 Technology Choices

#### 5.1.1 Backend Framework: Node.js + Express.js
**Rationale:**
- **Rapid Development**: Express.js provides minimal, flexible framework
- **JavaScript Ecosystem**: Unified language for frontend/backend
- **RESTful APIs**: Excellent support for REST architecture
- **Middleware Support**: Built-in support for authentication, validation, logging

#### 5.1.2 Database: PostgreSQL (Supabase)
**Rationale:**
- **ACID Compliance**: Ensures data consistency for bookings
- **JSON Support**: Flexible schema for configuration data
- **Scalability**: Handles concurrent booking operations
- **Cloud Integration**: Supabase provides managed PostgreSQL with real-time features

#### 5.1.3 Frontend: Vanilla JavaScript
**Rationale:**
- **Performance**: No framework overhead
- **Simplicity**: Direct DOM manipulation
- **Educational Value**: Demonstrates core web technologies
- **Compatibility**: Works across all browsers

### 5.2 System Architecture Organization

The system follows a layered architecture pattern organized into distinct modules:

#### 5.2.1 Backend Layer Structure

**Configuration Module**
- Database connection management with connection pooling
- Environment variable handling for different deployment stages
- Security configuration including JWT secrets and encryption keys

**Middleware Layer**
- JWT Authentication: Token validation and user session management
- Error Handling: Centralized error processing and response formatting
- Rate Limiting: Request throttling to prevent abuse and ensure system stability
- Input Validation: Request sanitization and validation using express-validator

**Data Models**
- User Model: Authentication, role management, and profile data
- Building Model: Campus infrastructure with geographic coordinates
- Room Model: Facility details with booking availability logic
- Booking Model: Reservation management with conflict prevention

**API Routes**
- Authentication Endpoints: Registration, login, password reset, token refresh
- User Management: Profile operations, role assignments, account management
- Building Management: Campus infrastructure CRUD operations
- Room Management: Facility information and availability queries
- Booking Operations: Reservation creation, modification, cancellation
- Navigation Services: Route calculation and mapping functionality
- Administrative Tools: System configuration and reporting endpoints

**Business Services**
- Email Service: SMTP integration for notifications and confirmations
- Map Service: Geographic calculations and routing algorithms
- Report Service: Data aggregation and analysis for administrative reporting

**Utility Components**
- Logging System: Winston-based structured logging with rotation
- Helper Functions: Common operations like date formatting, validation
- Application Constants: System-wide configuration values and enums

#### 5.2.2 Frontend Layer Structure

**Core Application**
- Single-page application with vanilla JavaScript for optimal performance
- Responsive CSS design using modern flexbox and grid layouts
- Component-based architecture for maintainable code organization

**User Interface Components**
- Authentication Forms: Login and registration with real-time validation
- Navigation Interface: Interactive campus map with building selection
- Booking Interface: Room search, availability display, and reservation forms
- Administrative Dashboard: User management and system configuration tools

**Static Assets**
- Stylesheet Organization: Modular CSS with responsive design patterns
- Image Assets: Building photos, icons, and map overlays
- Client-side Scripts: API communication and user interaction handling

#### 5.2.3 Testing Structure

**Unit Testing**
- Model Testing: Database operations and business logic validation
- Service Testing: External service integrations and utility functions
- API Testing: Endpoint functionality and response validation

**Integration Testing**
- End-to-end Workflows: Complete user journeys from login to booking
- Database Integration: Model-database interaction testing
- Authentication Flow: Security and session management testing

**Test Data Management**
- Fixture Creation: Standardized test data for consistent testing
- Mock Services: External service simulation for isolated testing

### 5.3 Key Implementation Features

#### 5.3.1 Authentication System
```javascript
// JWT Token Generation
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Role-based Access Control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};
```

#### 5.3.2 Interactive Map System
```javascript
// Building Rendering
function renderMapBuildings() {
  const mapContainer = document.getElementById('interactiveMap');

  // Calculate map bounds for coordinate positioning
  const bounds = calculateMapBounds(mapBuildings);

  mapBuildings.forEach(building => {
    const buildingElement = createBuildingElement(building, bounds);
    mapContainer.appendChild(buildingElement);
  });
}

// Route Calculation and Display
function displayRoute(routeData) {
  const path = createPathElement(routeData.route.waypoints);
  const routeInfo = createRouteInfoOverlay(routeData);

  mapContainer.appendChild(path);
  mapContainer.appendChild(routeInfo);
}
```

#### 5.3.3 Booking System Logic
```javascript
// Availability Checking
async function checkRoomAvailability(roomId, startTime, endTime) {
  const query = `
    SELECT booking_id FROM bookings
    WHERE room_id = $1
    AND status IN ('CONFIRMED', 'PENDING')
    AND (
      (start_time <= $2 AND end_time > $2) OR
      (start_time < $3 AND end_time >= $3) OR
      (start_time >= $2 AND end_time <= $3)
    )
  `;

  const result = await database.query(query, [roomId, startTime, endTime]);
  return result.rows.length === 0;
}

// Booking Creation with Conflict Prevention
async function createBooking(bookingData) {
  return await database.transaction(async (client) => {
    // Double-check availability within transaction
    const isAvailable = await checkRoomAvailability(
      bookingData.roomId,
      bookingData.startTime,
      bookingData.endTime
    );

    if (!isAvailable) {
      throw new Error('Room is no longer available');
    }

    // Create the booking
    const booking = await Booking.create(bookingData, client);

    // Send confirmation email
    await emailService.sendBookingConfirmation(booking);

    return booking;
  });
}
```

### 5.4 API Implementation Standards

#### 5.4.1 Response Format
```javascript
// Success Response
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}

// Error Response
{
  "success": false,
  "error": "Error message",
  "details": [], // Optional validation details
  "code": "ERROR_CODE" // Optional error code
}
```

#### 5.4.2 Input Validation
```javascript
// Express-validator implementation
const bookingValidation = [
  body('roomId')
    .isUUID()
    .withMessage('Valid room ID required'),
  body('startTime')
    .isISO8601()
    .withMessage('Valid start time required'),
  body('endTime')
    .isISO8601()
    .withMessage('Valid end time required')
    .custom((endTime, { req }) => {
      if (new Date(endTime) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('purpose')
    .isLength({ min: 1, max: 500 })
    .withMessage('Purpose must be 1-500 characters')
];
```

---

## 6. Database Schema

### 6.1 Entity Relationship Diagram

```sql
-- Users table
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'STUDENT',
  phone VARCHAR(20),
  student_id VARCHAR(20),
  employee_id VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buildings table
CREATE TABLE buildings (
  building_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  floors INTEGER,
  is_accessible BOOLEAN DEFAULT true,
  description TEXT,
  operating_hours JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE rooms (
  room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(building_id) ON DELETE CASCADE,
  room_number VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type room_type NOT NULL,
  capacity INTEGER NOT NULL,
  floor INTEGER NOT NULL,
  is_accessible BOOLEAN DEFAULT true,
  is_bookable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  hourly_rate DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(building_id, room_number)
);

-- Bookings table
CREATE TABLE bookings (
  booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  purpose VARCHAR(500) NOT NULL,
  status booking_status DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_time > start_time)
);
```

### 6.2 Indexing Strategy

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_buildings_code ON buildings(code);
CREATE INDEX idx_buildings_location ON buildings(latitude, longitude);
CREATE INDEX idx_rooms_building ON rooms(building_id);
CREATE INDEX idx_rooms_type ON rooms(type);
CREATE INDEX idx_bookings_room_time ON bookings(room_id, start_time, end_time);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
```

### 6.3 Data Integrity Constraints

```sql
-- Custom types
CREATE TYPE user_role AS ENUM (
  'STUDENT', 'FACULTY', 'STAFF', 'ADMINISTRATOR', 'VISITOR'
);

CREATE TYPE room_type AS ENUM (
  'STUDY_ROOM', 'LECTURE_HALL', 'LABORATORY', 'CONFERENCE_ROOM',
  'SPORTS_VENUE', 'LIBRARY_SPACE', 'MEETING_ROOM'
);

CREATE TYPE booking_status AS ENUM (
  'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 7. API Documentation

### 7.1 Authentication Endpoints

#### POST /api/auth/register
**Description**: Register a new user account

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@university.edu",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT",
  "phone": "+1-555-0123",
  "studentId": "STU2024001"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "userId": "uuid",
      "username": "john_doe",
      "email": "john@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STUDENT"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### POST /api/auth/login
**Description**: Authenticate user and return tokens

**Request Body**:
```json
{
  "email": "john@university.edu",
  "password": "SecurePass123!"
}
```

### 7.2 Navigation Endpoints

#### GET /api/navigation/buildings
**Description**: Get all buildings with coordinates for map display

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "building_uuid",
      "code": "LIB",
      "name": "Main Library",
      "coordinates": {
        "lat": 40.713,
        "lng": -74.0058
      },
      "floors": 3,
      "isAccessible": true,
      "description": "Central library with study rooms"
    }
  ]
}
```

#### GET /api/navigation/directions
**Description**: Get directions between two buildings

**Parameters**:
- `from`: Building code or ID
- `to`: Building code or ID
- `accessible`: Boolean for accessible routes only

**Response**:
```json
{
  "success": true,
  "data": {
    "from": {
      "id": "uuid",
      "code": "LIB",
      "name": "Main Library",
      "coordinates": {"lat": 40.713, "lng": -74.0058}
    },
    "to": {
      "id": "uuid",
      "code": "CSB",
      "name": "Computer Science Building",
      "coordinates": {"lat": 40.7128, "lng": -74.006}
    },
    "route": {
      "distance": 28,
      "estimatedTime": 1,
      "pathType": "WALKWAY",
      "isAccessible": true,
      "waypoints": [
        {"lat": 40.713, "lng": -74.0058, "name": "Main Library"},
        {"lat": 40.7128, "lng": -74.006, "name": "Computer Science Building"}
      ]
    }
  }
}
```

### 7.3 Booking Endpoints

#### GET /api/rooms/available
**Description**: Get available rooms for a time period

**Parameters**:
- `startTime`: ISO 8601 datetime
- `endTime`: ISO 8601 datetime
- `type`: Optional room type filter
- `buildingId`: Optional building filter
- `minCapacity`: Optional minimum capacity

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "roomId": "uuid",
      "buildingId": "uuid",
      "roomNumber": "S1",
      "name": "Study Room 1",
      "type": "STUDY_ROOM",
      "capacity": 8,
      "floor": 1,
      "isAccessible": true,
      "buildingName": "Main Library",
      "buildingCode": "LIB"
    }
  ],
  "searchCriteria": {
    "startTime": "2025-06-26T09:00:00.000Z",
    "endTime": "2025-06-26T10:00:00.000Z"
  }
}
```

#### POST /api/bookings
**Description**: Create a new room booking (requires authentication)

**Request Body**:
```json
{
  "roomId": "room_uuid",
  "startTime": "2025-06-26T09:00:00.000Z",
  "endTime": "2025-06-26T10:00:00.000Z",
  "purpose": "Group study session",
  "notes": "Need whiteboard access"
}
```

### 7.4 Error Handling

#### Common HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., booking overlap)
- `500 Internal Server Error`: Server error

#### Error Response Format
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Valid email address required"
    }
  ]
}
```

---

## 8. Security Implementation

### 8.1 Authentication & Authorization

#### 8.1.1 Password Security
- **Hashing**: bcrypt with 12 salt rounds
- **Validation**: Minimum 8 characters, mixed case, numbers, special characters
- **Reset**: Secure token-based password reset flow

#### 8.1.2 JWT Token Management
```javascript
// Token Configuration
const JWT_CONFIG = {
  accessTokenExpiry: '24h',
  refreshTokenExpiry: '7d',
  algorithm: 'HS256',
  issuer: 'SCNFBS'
};

// Token Validation Middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or deactivated user'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};
```

### 8.2 Input Validation & Sanitization

#### 8.2.1 Request Validation
```javascript
// Comprehensive validation using express-validator
const validateBooking = [
  body('roomId')
    .isUUID()
    .withMessage('Valid room ID required'),
  body('startTime')
    .isISO8601()
    .withMessage('Valid start time required')
    .custom((value) => {
      const startTime = new Date(value);
      const now = new Date();
      if (startTime <= now) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),
  body('purpose')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Purpose must be 1-500 characters')
    .escape() // Prevent XSS
];
```

### 8.3 Security Headers & Middleware

```javascript
// Security configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});
```

### 8.4 Database Security

#### 8.4.1 Connection Security
- SSL/TLS encryption for database connections
- Connection pooling with maximum limits
- Prepared statements to prevent SQL injection

#### 8.4.2 Data Protection
```javascript
// SQL injection prevention
const getUserBookings = async (userId) => {
  const query = `
    SELECT b.*, r.name as room_name, bld.name as building_name
    FROM bookings b
    JOIN rooms r ON b.room_id = r.room_id
    JOIN buildings bld ON r.building_id = bld.building_id
    WHERE b.user_id = $1
    ORDER BY b.start_time DESC
  `;

  return await database.query(query, [userId]);
};
```

---

## 9. Testing Strategy

### 9.1 Testing Pyramid

#### 9.1.1 Unit Testing (70%)
- **Model Testing**: User, Building, Room, Booking models
- **Utility Testing**: Helper functions, validators
- **Service Testing**: Email service, map service

#### 9.1.2 Integration Testing (20%)
- **API Endpoint Testing**: All REST endpoints
- **Database Integration**: Model-database interactions
- **Authentication Flow**: Login/registration/authorization

#### 9.1.3 End-to-End Testing (10%)
- **User Workflows**: Complete booking process
- **Navigation Testing**: Map interaction and routing
- **Cross-browser Testing**: Chrome, Firefox, Safari, Edge

### 9.2 Test Implementation

#### 9.2.1 Unit Test Example
```javascript
// Room availability testing
describe('Room Availability', () => {
  test('should return false for conflicting bookings', async () => {
    const room = await Room.create(testRoomData);
    await Booking.create({
      roomId: room.roomId,
      userId: testUser.userId,
      startTime: '2025-06-26T09:00:00Z',
      endTime: '2025-06-26T10:00:00Z',
      purpose: 'Test booking'
    });

    const isAvailable = await room.isAvailable(
      '2025-06-26T09:30:00Z',
      '2025-06-26T10:30:00Z'
    );

    expect(isAvailable).toBe(false);
  });
});
```

#### 9.2.2 API Integration Test
```javascript
// Authentication endpoint testing
describe('POST /api/auth/login', () => {
  test('should return JWT token for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@university.edu',
        password: 'ValidPass123!'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.email).toBe('test@university.edu');
  });
});
```

### 9.3 Test Coverage Requirements

- **Code Coverage**: Minimum 80% line coverage
- **Branch Coverage**: Minimum 70% branch coverage
- **Function Coverage**: 90% function coverage
- **Critical Path Coverage**: 100% for booking and authentication flows

### 9.4 Performance Testing

#### 9.4.1 Load Testing Scenarios
- **Concurrent Users**: 100 simultaneous users
- **Database Stress**: 1000 booking requests/minute
- **Map Loading**: Response time under 3 seconds
- **API Responses**: Average response time under 500ms

---

## 10. Deployment Guide

### 10.1 Environment Setup

#### 10.1.1 Development Environment

**Prerequisites:**
- Node.js version 16.x or higher
- PostgreSQL database server (local or cloud-hosted)
- Git for version control
- Text editor or IDE (VS Code recommended)

**Installation Steps:**
1. **Setup Project Directory**: Create new directory for the application
2. **Initialize Node.js Project**: Run `npm init` to create package.json
3. **Install Dependencies**: Install required packages including Express.js, JWT, bcrypt, pg (PostgreSQL client)
4. **Environment Configuration**: Create environment file with database credentials, JWT secrets, and API keys
5. **Database Setup**: Configure PostgreSQL connection and run initial schema creation
6. **Development Server**: Start application in development mode with hot reloading

**Required Environment Variables:**
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
JWT_SECRET=your-256-bit-secret-key
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### 10.1.2 Production Environment

**Production Configuration:**
- **Security**: All communications over HTTPS with valid SSL certificates
- **Database**: Production-grade PostgreSQL with connection pooling and read replicas
- **Monitoring**: Application performance monitoring and error tracking
- **Logging**: Centralized logging with log rotation and retention policies
- **Backup**: Automated database backups with point-in-time recovery

**Production Environment Variables:**
```
NODE_ENV=production
PORT=443
DATABASE_URL=postgresql://prod_user:secure_password@db.host:5432/prod_db
JWT_SECRET=highly-secure-256-bit-production-secret
REDIS_URL=redis://redis.host:6379
EMAIL_PROVIDER=production-smtp-service
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=900000
LOG_LEVEL=error
```

### 10.2 Database Migration

```sql
-- Production database setup
-- 1. Create database and user
-- 2. Run schema creation scripts
-- 3. Create indexes
-- 4. Insert initial data
-- 5. Set up backup procedures
```

### 10.3 Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database connections encrypted
- [ ] Rate limiting configured
- [ ] Security headers implemented
- [ ] Input validation active
- [ ] Error messages sanitized
- [ ] Logs configured without sensitive data

### 10.4 Monitoring & Logging

```javascript
// Production logging configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});
```

---

## 11. User Manual

### 11.1 Getting Started

#### 11.1.1 User Registration
1. Click "Register" button in navigation
2. Fill in required information:
   - Username (3-50 characters)
   - Email address
   - Secure password (8+ characters with mixed case, numbers, symbols)
   - First and last name
   - Role (Student, Faculty, Staff, Visitor)
   - Optional: Phone number, Student/Employee ID
3. Click "Register" to create account
4. Login with new credentials

#### 11.1.2 System Navigation
- **Home**: Overview and quick actions
- **Navigation**: Interactive campus map and directions
- **Booking**: Room reservation system
- **Facilities**: Browse all campus buildings and rooms

### 11.2 Campus Navigation

#### 11.2.1 Using the Interactive Map
1. Navigate to "Navigation" tab
2. View campus buildings on interactive map
3. **Select locations**:
   - Click buildings on map for start/destination
   - Use dropdown menus to select buildings
4. **Get directions**:
   - Route appears automatically when both locations selected
   - View distance, estimated time, and path type
   - Toggle "Accessible route" option if needed

#### 11.2.2 Search Functionality
1. Use search box to find buildings
2. Type building name or code (e.g., "Library" or "LIB")
3. Click search results to navigate to location

### 11.3 Room Booking

#### 11.3.1 Finding Available Rooms
1. Navigate to "Booking" tab
2. **Set search criteria**:
   - Date: Select booking date
   - Start/End time: Set time range
   - Facility type: Choose room type (Study Room, Lab, etc.)
   - Building: Optional building filter
   - Capacity: Minimum number of people
3. Click "Search Available"
4. Browse available rooms with details

#### 11.3.2 Making a Reservation
1. **Login required**: Must be logged in to book rooms
2. Click on desired room from search results
3. **Booking form**:
   - Review room details and time
   - Enter purpose for booking
   - Add any additional notes
4. Click "Confirm Booking"
5. Receive confirmation message

#### 11.3.3 Managing Bookings
- View booking history in user profile
- Cancel bookings if policies allow
- Receive email confirmations and reminders

### 11.4 User Roles and Permissions

#### 11.4.1 Student
- Search and navigate campus
- Book study rooms and general facilities
- View personal booking history

#### 11.4.2 Faculty
- All student capabilities
- Book lecture halls and laboratories
- Extended booking privileges

#### 11.4.3 Staff
- All faculty capabilities
- Manage room configurations
- Access utilization reports

#### 11.4.4 Administrator
- Full system access
- Manage users and buildings
- Generate comprehensive reports
- Configure system settings

### 11.5 Troubleshooting

#### 11.5.1 Common Issues
- **Login Problems**: Check email/password, ensure account is active
- **Booking Conflicts**: Room may have been booked by another user
- **Map Not Loading**: Check internet connection, refresh page
- **Permission Denied**: Contact administrator for role adjustment

#### 11.5.2 Browser Requirements
- **Supported**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: Must be enabled
- **Cookies**: Required for authentication
- **Local Storage**: Used for user preferences

---

## 12. Future Enhancements

### 12.1 Planned Features

#### 12.1.1 Phase 2 Enhancements
- **Mobile Application**: Native iOS/Android apps
- **Push Notifications**: Real-time booking updates
- **Calendar Integration**: Sync with Google Calendar, Outlook
- **QR Code Check-in**: Verify room usage with QR codes
- **Indoor Navigation**: Detailed floor plans with routing
- **Advanced Analytics**: Machine learning for usage predictions

#### 12.1.2 Integration Opportunities
- **University Information System**: Student/faculty data sync
- **Access Control Systems**: Automatic door unlocking
- **Payment Processing**: Paid bookings for external users
- **Emergency Alerts**: Campus safety notifications
- **Event Management**: Large event coordination

### 12.2 Technical Improvements

#### 12.2.1 Performance Optimizations
- **Caching Strategy**: Redis for session and data caching
- **CDN Integration**: Static asset delivery optimization
- **Database Optimization**: Query optimization and indexing
- **API Rate Limiting**: More sophisticated rate limiting
- **Load Balancing**: Horizontal scaling capabilities

#### 12.2.2 Security Enhancements
- **Two-Factor Authentication**: SMS/TOTP-based 2FA
- **Single Sign-On**: SAML/OAuth integration
- **Audit Logging**: Comprehensive activity tracking
- **Data Encryption**: At-rest data encryption
- **Security Scanning**: Automated vulnerability testing

### 12.3 User Experience Improvements

#### 12.3.1 Accessibility
- **Screen Reader Support**: Enhanced ARIA labels
- **Keyboard Navigation**: Full keyboard accessibility
- **Voice Commands**: Voice-controlled navigation
- **High Contrast Mode**: Improved visual accessibility
- **Multiple Languages**: Internationalization support

#### 12.3.2 Advanced Features
- **Favorite Locations**: Save frequently used buildings
- **Booking Templates**: Recurring booking patterns
- **Group Bookings**: Coordinate team reservations
- **Waitlist System**: Queue for popular rooms
- **Smart Suggestions**: AI-powered room recommendations

---

## Conclusion

The Smart Campus Navigation and Facility Booking System (SCNFBS) successfully addresses the core requirements for modern university campus management. The system provides:

 **Comprehensive Navigation**: Interactive maps with real-time directions
 **Efficient Booking**: Streamlined room reservation with conflict prevention
 **Role-Based Access**: Secure multi-user system with appropriate permissions
 **Scalable Architecture**: Modern web technologies supporting growth
 **Security First**: Industry-standard authentication and data protection

The implementation demonstrates effective use of:
- **Node.js/Express.js** for robust backend development
- **PostgreSQL** for reliable data management
- **JWT Authentication** for secure user sessions
- **Responsive Design** for cross-device compatibility
- **RESTful APIs** for extensible architecture

This technical documentation provides comprehensive coverage of system design, implementation details, and operational procedures, ensuring successful deployment and maintenance of the SCNFBS platform.

---

**Document Version**: 1.0
**Last Updated**: June 25, 2025
**Next Review**: June 25, 2026
