# Quick Start Guide - Smart Campus Navigation & Booking System

Get your campus system running in 10 minutes!

## 🚀 Step 1: Set Up Supabase Database

### Create Your Project
1. Go to [supabase.com](https://supabase.com) and create account
2. Click **"New Project"**
3. Fill in:
   - **Name**: `campus-navigation`
   - **Database Password**: `YourSecurePassword123!` (save this!)
   - **Region**: Choose closest to you
4. Click **"Create new project"** (takes ~2 minutes)

### Get Your Credentials
Once ready, go to **Settings → API** and copy:
- **Project URL**: `https://abcdefg.supabase.co`
- **anon public key**: `eyJhbGci...`
- **service_role secret**: `eyJhbGci...`

## 🔧 Step 2: Configure Environment

Update your `.env` file with real values:

```bash
# Replace these with YOUR actual Supabase credentials:
DATABASE_URL=postgresql://postgres:YourSecurePassword123!@db.abcdefg.supabase.co:5432/postgres
SUPABASE_URL=https://abcdefg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmciLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjk...
```

## 🗄️ Step 3: Set Up Database Schema

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `database-schema.sql`
4. Paste into SQL Editor
5. Click **"Run"** button

## ✅ Step 4: Test Database Connection

```bash
npm run test-db
```

You should see:
```
✅ Database connection successful!
📋 Tables in database:
   - users
   - buildings
   - rooms
   - bookings
   - notifications
   ...
```

## 🏃‍♂️ Step 5: Start the Application

```bash
npm start
```

Visit: **http://localhost:3000**

## 🎯 Step 6: Test the System

### Register a User
1. Click **"Register"**
2. Fill out the form
3. Choose role (Student/Faculty/Staff)

### Add Sample Data
Go to Supabase **SQL Editor** and run:

```sql
-- Add sample buildings
INSERT INTO buildings (code, name, address, latitude, longitude, floors, is_accessible, description) VALUES
('CSB', 'Computer Science Building', '123 University Ave', 40.7128, -74.0060, 4, true, 'Main CS building'),
('LIB', 'Main Library', '456 Campus Drive', 40.7130, -74.0058, 3, true, 'Central library'),
('GYM', 'Recreation Center', '789 Fitness Lane', 40.7125, -74.0062, 2, true, 'Sports facilities');

-- Add sample rooms
INSERT INTO rooms (building_id, room_number, name, type, capacity, floor, is_accessible, description) VALUES
((SELECT building_id FROM buildings WHERE code = 'CSB'), '101', 'CS Lab 1', 'LABORATORY', 30, 1, true, 'Computer lab'),
((SELECT building_id FROM buildings WHERE code = 'LIB'), 'S1', 'Study Room 1', 'STUDY_ROOM', 8, 1, true, 'Group study room'),
((SELECT building_id FROM buildings WHERE code = 'GYM'), 'COURT1', 'Basketball Court', 'SPORTS_VENUE', 50, 1, true, 'Full court');
```

### Test Features
1. **Navigate** → Search for buildings
2. **Book Facility** → Search and book a room
3. **View Facilities** → Browse all buildings

## 🎉 You're Done!

Your campus navigation and booking system is now running with:
- ✅ Real database (Supabase)
- ✅ User authentication
- ✅ Facility management
- ✅ Booking system
- ✅ Responsive web interface

## 🐛 Troubleshooting

### Connection Issues
```bash
# Test your database connection
npm run test-db
```

### Common Problems
- **"Database not configured"** → Check your .env file has real Supabase values
- **"Connection failed"** → Verify your database password
- **"No tables found"** → Run the database schema in SQL Editor

### Need Help?
- Check `supabase-setup.md` for detailed instructions
- Review your Supabase project settings
- Ensure your project is not paused (free tier pauses after 1 week inactivity)

## 🚀 Next Steps

1. **Customize Data**: Add your real campus buildings and rooms
2. **Configure Email**: Set up email notifications
3. **Add Users**: Register faculty and student accounts
4. **Test Booking**: Create and manage reservations
5. **Deploy**: Consider deploying to Vercel, Netlify, or Railway

Happy coding! 🎓✨