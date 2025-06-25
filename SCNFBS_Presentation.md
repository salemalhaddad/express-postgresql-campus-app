---
marp: true
theme: default
class: lead
paginate: true
backgroundColor: #ffffff
color: #333333
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600;700&display=swap');

section {
  font-family: 'Inter', sans-serif;
  background: #ffffff;
  color: #333333;
  padding: 60px;
}

h1 {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 44px;
  color: #1a1a2e;
  margin-bottom: 30px;
  text-align: center;
}

h2 {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 32px;
  color: #1a1a2e;
  margin-bottom: 25px;
}

h3 {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 28px;
  color: #2d3748;
  margin-bottom: 20px;
}

p, li {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 20px;
  line-height: 1.6;
  margin-bottom: 15px;
  color: #333333;
}

code {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  background-color: #f7fafc;
  color: #2d3748;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 16px;
  border: 1px solid #e2e8f0;
}

pre {
  background-color: #f7fafc;
  color: #2d3748;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 16px;
  line-height: 1.4;
  border-left: 4px solid #0f4c75;
  border: 1px solid #e2e8f0;
}

.demo-slide {
  background: linear-gradient(135deg, #0f4c75 0%, #1a1a2e 100%);
  color: #ffffff;
}

.demo-slide h1, .demo-slide h2, .demo-slide h3 {
  color: #ffffff;
}

.demo-slide p, .demo-slide li {
  color: #ffffff;
}

.demo-box {
  background-color: rgba(255, 255, 255, 0.1);
  border: 2px solid #ffffff;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  color: #ffffff;
}

.metrics-box {
  background-color: rgba(40, 167, 69, 0.1);
  border: 2px solid #28a745;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
  color: #333333;
}

.tech-stack {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin: 30px 0;
  font-size: 18px;
  color: #0f4c75;
  font-weight: 500;
}

ul {
  list-style: none;
  padding-left: 0;
}

li:before {
  content: "• ";
  color: #0f4c75;
  font-weight: bold;
  margin-right: 10px;
}

.demo-slide li:before {
  color: #ffffff;
}

.center {
  text-align: center;
}

.title-slide {
  text-align: center;
  padding: 80px 60px;
}

.contact-info {
  background-color: rgba(15, 76, 117, 0.1);
  border: 2px solid #0f4c75;
  border-radius: 8px;
  padding: 20px;
  margin-top: 30px;
  color: #333333;
}
</style>

<!-- Title Slide -->
# Smart Campus Navigation and Facility Booking System
## COSC333 Software Systems & Design

### Technical Implementation & Live Demo
**Professor:** Dr. Kamal Taha | **By:** Salem Alhaddad | **Date:** June 26, 2025

<div class="tech-stack">
🔧 Node.js + Express.js | 🗄️ PostgreSQL | 🔐 JWT Authentication
</div>

---

<!-- Slide 2: Requirements Engineering & Analysis -->
## 🎯 Requirements Engineering & Problem Analysis

• **Functional Requirements:** Interactive navigation, real-time booking, role-based access control
• **Non-Functional Requirements:** Performance (<2s response), security (JWT), scalability (100+ users)
• **Stakeholder Analysis:** Students, Faculty, Staff, Administrators, Visitors with distinct needs
• **Use Case Modeling:** 19 identified use cases with actor-system interactions
• **Requirements Traceability:** Each requirement mapped to implementation and testing
• **Risk Assessment:** Booking conflicts, security vulnerabilities, performance bottlenecks

---

<!-- Slide 3: Software Architecture & Design Patterns -->
## 🏗️ Software Architecture & Design Patterns

• **Architectural Pattern:** Layered Architecture (Presentation → Business → Data)
• **Design Patterns:** MVC separation, Repository pattern, Middleware pattern
• **SOLID Principles:** Single responsibility, Open/closed, Dependency inversion
• **Modular Design:** Separation of concerns with distinct service layers
• **API Design:** RESTful architecture following Richardson Maturity Model
• **Database Design:** Entity-Relationship modeling with normalization

```javascript
// Layered Architecture Implementation
// Presentation Layer → Business Logic → Data Access Layer
const app = express();
app.use(helmet()); // Security middleware
app.use('/api/auth', authRoutes); // Authentication layer
app.use('/api/bookings', authenticate, bookingRoutes); // Business logic
```

---

<!-- Slide 4: UML Modeling & Database Design -->
## 📊 UML Modeling & Database Design

• **UML Diagrams:** Use Case, Class, Sequence, Component diagrams following UML 2.5
• **Entity-Relationship Design:** 8 entities with proper normalization (3NF)
• **Class Modeling:** Domain objects with attributes, methods, and associations
• **Sequence Diagrams:** Authentication, booking, navigation interaction flows
• **Database Schema:** PostgreSQL with ACID transactions and referential integrity
• **Data Modeling:** Conceptual → Logical → Physical design progression

```sql
-- Entity-Relationship Implementation with Constraints
CREATE TABLE bookings (
  booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  CHECK (end_time > start_time) -- Business rule constraint
);
```

---

<!-- Slide 5: Live Demo -->
<!-- _class: demo-slide -->
# 🎮 LIVE DEMO

## **Demo URL:** http://localhost:3000

<div class="demo-box">
<strong>DEMO WORKFLOW:</strong><br><br>
<strong>1. System Overview & Authentication</strong><br>
• Navigate to localhost:3000<br>
• Register user: demo@university.edu / DemoPass123!<br>
• Show JWT token in localStorage (F12 → Application → Local Storage)<br>
• Demonstrate responsive design (resize window)<br><br>
<strong>2. Campus Navigation System</strong><br>
• Navigate to "Navigation" tab<br>
• Click buildings on interactive map<br>
• Select Library (LIB) → Computer Science Building (CSB)<br>
• Show route calculation with distance and time<br>
• Toggle accessibility route option<br><br>
<strong>3. Smart Booking System</strong><br>
• Navigate to "Booking" tab<br>
• Set criteria: Tomorrow, 10:00-11:00 AM, Study Room<br>
• Click "Search Available Rooms"<br>
• Select a room and fill booking form<br>
• Demonstrate conflict detection (try same time/room)
</div>

---

<!-- Slide 6: Security Implementation -->
## 🔐 Security Architecture

• **Password Hashing:** bcrypt with 12 salt rounds
• **JWT Tokens:** 24h expiration + refresh token rotation
• **Input Validation:** express-validator with custom rules
• **SQL Injection Prevention:** Parameterized queries only
• **Rate Limiting:** 100 requests/15min per IP
• **Security Headers:** Content Security Policy + HSTS

```javascript
// JWT Authentication Middleware
const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user?.isActive) throw new Error('User deactivated');
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};
```

---

<!-- Slide 7: Software Testing & Quality Assurance -->
## 🔌 Software Testing & Quality Assurance

• **Testing Strategy:** Test pyramid with Unit (70%), Integration (20%), E2E (10%)
• **Test-Driven Development:** Red-Green-Refactor cycle for core functions
• **Code Coverage:** 85% line coverage, 75% branch coverage, 90% function coverage
• **Quality Metrics:** Cyclomatic complexity, maintainability index, technical debt
• **API Testing:** Postman collections, automated endpoint validation
• **Performance Testing:** Load testing with 100 concurrent users, <2s response time

```javascript
// Unit Testing Example - TDD Approach
describe('Room Availability Service', () => {
  test('should return false for overlapping bookings', async () => {
    // Arrange
    const room = await createTestRoom();
    await createBooking(room.id, '09:00', '10:00');

    // Act
    const isAvailable = await checkAvailability(room.id, '09:30', '10:30');

    // Assert
    expect(isAvailable).toBe(false);
  });
});
```

---

<!-- Slide 8: Software Development Process & Methodology -->
## 📁 Software Development Process & Methodology

• **Development Methodology:** Iterative and Incremental development approach
• **Version Control:** Git with feature branches and pull request workflow
• **Code Organization:** Package-by-feature structure with dependency injection
• **Documentation:** Technical specs, API docs, UML diagrams, user manuals
• **Configuration Management:** Environment-based deployment configurations
• **DevOps Practices:** Automated testing, continuous integration readiness

```
Development Process Applied:
├── 1. Requirements Analysis     # Stakeholder interviews, use case modeling
├── 2. System Design            # Architecture, UML diagrams, DB schema
├── 3. Implementation           # Iterative coding with testing
├── 4. Testing & Validation     # Unit, integration, system testing
├── 5. Documentation           # Technical and user documentation
└── 6. Deployment & Maintenance # Production readiness assessment
```

---

<!-- Slide 9: Performance & Scalability -->
## ⚡ Performance & Scalability

• **Database Optimization:** 12 composite indexes + query optimization
• **Connection Pooling:** 20 max connections with 5s timeout
• **Frontend Performance:** <3s initial load, lazy loading components
• **Memory Management:** Efficient garbage collection + resource cleanup
• **Concurrent Users:** 100+ simultaneous sessions tested
• **API Response Time:** 95th percentile <500ms

```javascript
// Database Connection Pool Configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 5000,    // Close idle connections
  connectionTimeoutMillis: 2000,
  ssl: { rejectUnauthorized: false }
});
```

---

<!-- Slide 10: Production Deployment -->
## 🚀 Production Deployment

• **Environment Configuration:** Separate dev/staging/prod settings
• **Security Hardening:** HTTPS, security headers, rate limiting
• **Monitoring & Logging:** Winston + structured JSON logging
• **Error Handling:** Graceful degradation + user-friendly messages
• **Backup Strategy:** Automated database backups + point-in-time recovery
• **Scalability:** Stateless design supporting horizontal scaling

```bash
# Production Environment Variables
NODE_ENV=production
PORT=443
DATABASE_URL=postgresql://prod_user:secure_pass@db.host:5432/prod_db
JWT_SECRET=256-bit-production-secret
REDIS_URL=redis://redis.host:6379
RATE_LIMIT_REQUESTS=1000
```

---

<!-- Slide 11: COSC333 Learning Outcomes Achieved -->
## 🏆 COSC333 Learning Outcomes Achieved

• **Requirements Engineering:** Functional/non-functional requirements, stakeholder analysis
• **Software Design:** UML modeling, architectural patterns, design principles (SOLID)
• **Implementation:** Object-oriented programming, design patterns, code organization
• **Testing & QA:** Test-driven development, testing strategies, quality metrics
• **Project Management:** Iterative development, documentation, version control
• **Professional Practice:** Security, performance, maintainability, scalability

<div class="metrics-box">
<strong>Software Engineering Metrics:</strong><br>
✅ 19 Use Cases documented and implemented<br>
✅ 4 UML diagram types (Use Case, Class, Sequence, Component)<br>
✅ 8 Entity relationships with proper normalization<br>
✅ 85% test coverage demonstrating TDD practices<br>
✅ Layered architecture with separation of concerns<br>
✅ WCAG 2.1 AA accessibility and security best practices
</div>

---

<!-- Slide 12: Questions & Course Reflection -->
## ❓ Questions & Course Concept Discussion

• **Requirements Engineering:** How did stakeholder analysis influence design decisions?
• **UML Modeling:** Which diagram types were most valuable for system understanding?
• **Design Patterns:** How do SOLID principles manifest in the codebase?
• **Testing Methodologies:** What TDD practices improved code quality?
• **Software Architecture:** How does layered architecture support maintainability?
• **Project Management:** What iterative development challenges were encountered?

---

<!-- End Slide -->
<div class="center">

# Thank You

## Questions & Live Demo

**Ready for technical deep-dive discussion**

</div>
