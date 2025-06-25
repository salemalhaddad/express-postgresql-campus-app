# Smart Campus Navigation and Facility Booking System (SCNFBS)

A comprehensive web-based application designed to enhance the campus experience for students, faculty, staff, and visitors by integrating real-time facility booking capabilities with an interactive navigation system.

## 🚀 Features

### Navigation Module
- **Interactive Campus Map**: Digital map with building locations and landmarks
- **Turn-by-Turn Directions**: Step-by-step navigation between campus locations
- **Accessibility Support**: Wheelchair-accessible routes and elevator locations
- **Multiple Route Options**: Shortest path, accessible routes, indoor/outdoor preferences

### Booking Module
- **Real-Time Availability**: Search and book available facilities instantly
- **Multiple Facility Types**: Study rooms, labs, lecture halls, sports venues
- **Smart Filtering**: Filter by capacity, equipment, accessibility, and more
- **Booking Management**: Create, modify, cancel, and track reservations
- **Email Notifications**: Automated confirmations and reminders

### User Management
- **Role-Based Access**: Different permissions for students, faculty, staff, and admins
- **Secure Authentication**: JWT-based authentication with password security
- **User Profiles**: Manage personal information and booking history

### Administrative Features
- **Facility Management**: Add, edit, and manage buildings and rooms
- **User Administration**: Manage user accounts and permissions
- **Booking Rules**: Configure booking policies and restrictions
- **Analytics & Reports**: Utilization statistics and usage patterns

## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js framework
- **PostgreSQL** database with optimized schema
- **JWT** for secure authentication
- **bcryptjs** for password hashing
- **Winston** for logging
- **Express Validator** for input validation

### Frontend
- **HTML5/CSS3** with responsive design
- **Vanilla JavaScript** for dynamic interactions
- **Font Awesome** icons
- **CSS Grid/Flexbox** for modern layouts

### Security & Performance
- **Helmet.js** for security headers
- **Rate limiting** to prevent abuse
- **CORS** configuration for cross-origin requests
- **Compression** for optimized responses

## 📋 Project Structure

```
cosc333-campus-software/
├── src/
│   ├── app.js                 # Main application entry point
│   ├── config/
│   │   └── database.js        # Database configuration
│   ├── controllers/           # Request handlers
│   ├── middleware/
│   │   ├── auth.js           # Authentication middleware
│   │   └── errorHandler.js   # Error handling
│   ├── models/
│   │   ├── User.js           # User model
│   │   ├── Building.js       # Building model
│   │   └── Room.js           # Room model
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── users.js          # User management routes
│   │   └── buildings.js      # Building/facility routes
│   ├── services/             # Business logic
│   └── utils/
│       └── logger.js         # Logging utility
├── public/
│   ├── index.html            # Main frontend file
│   ├── css/
│   │   └── styles.css        # Application styles
│   └── js/
│       └── app.js            # Frontend JavaScript
├── tests/                    # Test files
├── logs/                     # Log files
├── uploads/                  # File uploads
└── docs/                     # Documentation
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cosc333/campus-software.git
   cd cosc333-campus-software
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb scnfbs_db
   
   # Run database schema
   psql -d scnfbs_db -f database-schema.sql
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - Open your browser to `http://localhost:3000`
   - Register a new account or use the demo credentials

### Environment Configuration

Key environment variables to configure in `.env`:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/scnfbs_db

# JWT Security
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Email (for notifications)
MAIL_HOST=smtp.gmail.com
MAIL_USER=your-email@example.com
MAIL_PASS=your-app-password

# Server
PORT=3000
NODE_ENV=development
```

## 📊 Database Schema

The system uses a well-designed PostgreSQL schema with the following key entities:

- **Users**: Student, faculty, staff, and admin accounts
- **Buildings**: Campus buildings with location data
- **Rooms**: Individual bookable spaces within buildings
- **Bookings**: Reservation records with status tracking
- **Equipment**: Available equipment in each room
- **Locations**: Navigation waypoints and landmarks
- **Map Paths**: Route information for navigation

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/refresh` - Refresh JWT token

### Buildings & Facilities
- `GET /api/buildings` - List all buildings
- `GET /api/buildings/search` - Search buildings
- `GET /api/buildings/:id` - Get building details
- `GET /api/buildings/:id/rooms` - List rooms in building
- `GET /api/buildings/:id/rooms/available` - Available rooms

### User Management
- `GET /api/users` - List users (admin only)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `GET /api/users/:id/bookings` - User booking history

## 🎯 User Roles & Permissions

### Student
- Navigate campus and search facilities
- Book study rooms and select event spaces
- View and manage personal bookings
- Access booking history and statistics

### Faculty/Staff
- All student permissions
- Book lecture halls, labs, and meeting rooms
- Extended booking duration limits
- Access to advanced facility features

### Administrator
- Full system access and management
- Manage all users and facilities
- Configure booking rules and policies
- Generate usage reports and analytics
- System configuration and maintenance

## 🔧 Development

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Build project
npm run build
```

### Development Workflow
1. Create feature branch from `main`
2. Implement features with tests
3. Run linting and tests
4. Submit pull request
5. Code review and merge

## 📈 Performance & Monitoring

The application includes:
- Database query optimization with indexes
- Request/response compression
- Rate limiting for API protection
- Comprehensive logging with Winston
- Error tracking and monitoring
- Performance metrics collection

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Security**: bcrypt hashing with salt rounds
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Controlled cross-origin access
- **Security Headers**: Helmet.js for security hardening
- **SQL Injection Prevention**: Parameterized queries

## 📱 Mobile Responsiveness

The frontend is fully responsive and optimized for:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile devices (< 768px)
- Touch interfaces and gestures

## 🚀 Deployment

### Production Deployment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secrets
4. Configure email service
5. Set up reverse proxy (nginx)
6. Configure SSL certificates
7. Set up monitoring and backups

### Docker Deployment (Optional)
```bash
# Build image
docker build -t scnfbs .

# Run container
docker run -p 3000:3000 --env-file .env scnfbs
```

## 📝 Documentation

Additional documentation available:
- [Requirements Specification](requirements-specification.md)
- [UML Diagrams](uml-diagrams.md)
- [Database Schema](database-schema.sql)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**COSC333 Development Team**
- Project Management & Backend Development
- Frontend Development & UI/UX Design
- Database Design & Architecture
- Testing & Quality Assurance

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation
- Review the FAQ section

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Enhanced navigation features
- **v1.2.0** - Advanced booking management
- **v2.0.0** - Complete system redesign (planned)

---

**Built with ❤️ for COSC333 - Software Engineering Course**