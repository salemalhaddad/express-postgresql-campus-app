#!/bin/bash

# Script to register sample students and faculty members
API_BASE="http://localhost:3000/api/auth/register"

echo "🎓 Registering sample campus users..."

# Students
echo "📚 Registering Students..."

curl -X POST $API_BASE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_johnson",
    "email": "alice.johnson@student.university.edu",
    "password": "StudentPass123!",
    "firstName": "Alice",
    "lastName": "Johnson",
    "role": "STUDENT",
    "studentId": "STU2024001",
    "phone": "+1-555-0101"
  }' && echo ""

curl -X POST $API_BASE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bob_smith",
    "email": "bob.smith@student.university.edu",
    "password": "StudentPass456@",
    "firstName": "Bob",
    "lastName": "Smith",
    "role": "STUDENT",
    "studentId": "STU2024002",
    "phone": "+1-555-0102"
  }' && echo ""

curl -X POST $API_BASE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "carol_davis",
    "email": "carol.davis@student.university.edu",
    "password": "MyPassword789#",
    "firstName": "Carol",
    "lastName": "Davis",
    "role": "STUDENT",
    "studentId": "STU2024003",
    "phone": "+1-555-0103"
  }' && echo ""

curl -X POST $API_BASE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "david_wilson",
    "email": "david.wilson@student.university.edu",
    "password": "SecurePass321$",
    "firstName": "David",
    "lastName": "Wilson",
    "role": "STUDENT",
    "studentId": "STU2024004",
    "phone": "+1-555-0104"
  }' && echo ""

curl -X POST $API_BASE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "emma_brown",
    "email": "emma.brown@student.university.edu",
    "password": "StudentLife888%",
    "firstName": "Emma",
    "lastName": "Brown",
    "role": "STUDENT",
    "studentId": "STU2024005",
    "phone": "+1-555-0105"
  }' && echo ""

curl -X POST $API_BASE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "frank_garcia",
    "email": "frank.garcia@student.university.edu",
    "password": "Campus2024!@",
    "firstName": "Frank",
    "lastName": "Garcia",
    "role": "STUDENT",
    "studentId": "STU2024006",
    "phone": "+1-555-0106"
  }' && echo ""

# Faculty
echo "👨‍🏫 Registering Faculty..."

curl -X POST $API_BASE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "prof_anderson",
    "email": "dr.anderson@university.edu",
    "password": "Faculty2024!",
    "firstName": "Dr. Sarah",
    "lastName": "Anderson",
    "role": "FACULTY",
    "employeeId": "FAC001",
    "phone": "+1-555-0201"
  }' && echo ""

curl -X POST $API_BASE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "prof_thompson",
    "email": "dr.thompson@university.edu",
    "password": "Professor123@",
    "firstName": "Dr. Michael",
    "lastName": "Thompson",
    "role": "FACULTY",
    "employeeId": "FAC002",
    "phone": "+1-555-0202"
  }' && echo ""

curl -X POST $API_BASE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "prof_martinez",
    "email": "dr.martinez@university.edu",
    "password": "Academic456#",
    "firstName": "Dr. Maria",
    "lastName": "Martinez",
    "role": "FACULTY",
    "employeeId": "FAC003",
    "phone": "+1-555-0203"
  }' && echo ""

curl -X POST $API_BASE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "prof_lee",
    "email": "dr.lee@university.edu",
    "password": "Teaching789$",
    "firstName": "Dr. James",
    "lastName": "Lee",
    "role": "FACULTY",
    "employeeId": "FAC004",
    "phone": "+1-555-0204"
  }' && echo ""

# Staff
echo "👥 Registering Staff..."

curl -X POST $API_BASE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_jones",
    "email": "admin.jones@university.edu",
    "password": "StaffPass111!",
    "firstName": "Jennifer",
    "lastName": "Jones",
    "role": "STAFF",
    "employeeId": "STF001",
    "phone": "+1-555-0301"
  }' && echo ""

curl -X POST $API_BASE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "librarian_white",
    "email": "librarian.white@university.edu",
    "password": "LibraryStaff222@",
    "firstName": "Robert",
    "lastName": "White",
    "role": "STAFF",
    "employeeId": "STF002",
    "phone": "+1-555-0302"
  }' && echo ""

curl -X POST $API_BASE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tech_support",
    "email": "tech.support@university.edu",
    "password": "TechHelp333#",
    "firstName": "Lisa",
    "lastName": "Chen",
    "role": "STAFF",
    "employeeId": "STF003",
    "phone": "+1-555-0303"
  }' && echo ""

# Visitors
echo "🏃 Registering Visitors..."

curl -X POST $API_BASE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "visitor_taylor",
    "email": "guest.taylor@gmail.com",
    "password": "VisitorPass444$",
    "firstName": "Mark",
    "lastName": "Taylor",
    "role": "VISITOR",
    "phone": "+1-555-0401"
  }' && echo ""

curl -X POST $API_BASE \
  -H "Content-Type: application/json" \
  -d '{
    "username": "conference_guest",
    "email": "conference.guest@company.com",
    "password": "Conference555%",
    "firstName": "Susan",
    "lastName": "Miller",
    "role": "VISITOR",
    "phone": "+1-555-0402"
  }' && echo ""

echo "✅ Registration complete! Summary:"
echo "   • 6 Students (STU2024001-006)"
echo "   • 4 Faculty (FAC001-004)"  
echo "   • 3 Staff (STF001-003)"
echo "   • 2 Visitors"
echo "   Total: 15 users registered"

echo ""
echo "📝 Sample Login Credentials:"
echo "Student: alice.johnson@student.university.edu / StudentPass123!"
echo "Faculty: dr.anderson@university.edu / Faculty2024!"
echo "Staff: admin.jones@university.edu / StaffPass111!"
echo "Visitor: guest.taylor@gmail.com / VisitorPass444$"