# UML Diagrams

This directory contains PlantUML diagram files for the Smart Campus Navigation and Facility Booking System (SCNFBS).

## Available Diagrams

### 1. Use Case Diagram (`use-case-diagram.puml`)
Defines system actors (Student, Faculty, Staff, Administrator, Visitor) and their interactions with system use cases including navigation, booking, and administration functions.

### 2. Class Diagram (`class-diagram.puml`)
Complete domain model showing all entities, enums, relationships, and methods including:
- User management (User, UserRole)
- Facility management (Building, Room, Equipment, Entrance)
- Booking system (Booking, BookingStatus)
- Navigation (MapPath)
- System services (Notification, AuditLog)

### 3. Sequence Diagrams
- **Authentication** (`sequence-authentication.puml`): User login process with JWT token generation
- **Booking** (`sequence-booking.puml`): Room booking workflow with availability checking and notifications
- **Navigation** (`sequence-navigation.puml`): Route planning and direction calculation process

### 4. Component Diagram (`component-diagram.puml`)
System architecture showing layered structure including:
- Frontend Layer (Web Browser, Mobile, Admin Dashboard)
- API Gateway (Express.js Router, Authentication, Rate Limiting)
- Application Services (Authentication, User Management, Booking, Navigation)
- Data Access Layer (Repositories)
- External Services (Email, SMS, File Storage)
- Database Layer (PostgreSQL with connection pooling)

## Generating Visual Diagrams

To generate PNG/SVG images from these PlantUML files, you can use:

### Online PlantUML Server
1. Copy the contents of any .puml file
2. Visit https://www.plantuml.com/plantuml/uml/
3. Paste the code and generate the diagram

### Local PlantUML Installation
```bash
# Install PlantUML (requires Java)
java -jar plantuml.jar *.puml

# Or use npm package
npm install -g node-plantuml
puml generate *.puml
```

### VS Code Extension
Install the "PlantUML" extension in VS Code for real-time preview and export capabilities.

## Integration with Technical Documentation

These diagrams are referenced in the main technical documentation (`TECHNICAL_DOCUMENTATION.md`) and provide visual representations of the system design and architecture described in the project requirements.