# AI in Edutech - Authentication System

A modern, professional authentication system for students and teachers built with Next.js, Firebase, and Tailwind CSS.

## Features

### 🎓 Student Features
- **Registration**: Students can register with comprehensive details:
  - Full name
  - Email
  - Standard/Class
  - Division
  - Roll Number
  - School Name
  - Parent's Mobile Number (10 digits, validated)
  - Parent's Email
  - Gender (Male/Female/Other)
  - Password (minimum 6 characters)
  
- **Login**: Secure email and password authentication
- **Validation**: All fields are properly validated with user-friendly error messages
- **Dashboard**: Personalized student dashboard after successful login

### 👨‍🏫 Teacher Features
- **Registration**: Teachers can register with:
  - Full name
  - Email
  - Password (minimum 6 characters)
  
- **Login**: Secure email and password authentication
- **Dashboard**: Personalized teacher dashboard after successful login
- **Dual Role Support**: Teachers can also be students (can have both roles)

## Business Logic

### Role Separation
1. **Teachers can be students**: A teacher account can also register as a student
2. **Students cannot be teachers**: If an email is registered as a teacher, it cannot register as a student
3. **Separate Collections**: 
   - Teachers are stored in the `teachers` collection
   - Students are stored in the `students` collection

### Validation Rules
- **Email**: Must be a valid email format
- **Password**: Minimum 6 characters
- **Parent's Mobile**: Must be exactly 10 digits
- **All Required Fields**: Form validation ensures all fields are filled

### Firebase Integration
- **Authentication**: Firebase Authentication for user management
- **Firestore**: 
  - `teachers` collection for teacher data
  - `students` collection for student data
- **Security**: Passwords are securely handled by Firebase Auth

## Design

### UI/UX Features
- **Professional & Modern Design**: Clean, attractive interface with gradient backgrounds
- **Poppins Font**: Beautiful typography throughout the application
- **Responsive**: Works on all device sizes
- **Tailwind CSS v4**: Latest Tailwind CSS for styling
- **Modular Components**: Separate pages for each user type and action
- **User Feedback**: Clear success and error messages
- **Loading States**: Visual feedback during async operations

### Color Schemes
- **Student Pages**: Blue and Indigo gradients
- **Teacher Pages**: Purple and Pink gradients
- **Common Elements**: Clean white cards with subtle shadows

## Project Structure

```
app/
├── login/
│   ├── student/
│   │   ├── page.tsx          # Student login page
│   │   └── register/
│   │       └── page.tsx      # Student registration page
│   └── teacher/
│       ├── page.tsx          # Teacher login page
│       └── register/
│           └── page.tsx      # Teacher registration page
├── dashboard/
│   ├── student/
│   │   └── page.tsx          # Student dashboard
│   └── teacher/
│       └── page.tsx          # Teacher dashboard
├── layout.tsx                # Root layout with Poppins font
└── page.tsx                  # Home page

lib/
├── firebase.ts               # Firebase configuration
└── auth.ts                   # Authentication service (business logic)
```

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Font**: Poppins (Google Fonts)

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Firebase project set up

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd AI-in-Edutech
```

2. Install dependencies
```bash
npm install
```

3. Configure Firebase
- Update `lib/firebase.ts` with your Firebase configuration (already configured)

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage

### Student Workflow
1. Navigate to `/login/student`
2. Click "Register Now" if you don't have an account
3. Fill in all required information
4. After successful registration, you'll be redirected to the login page
5. Login with your email and password
6. Access your student dashboard

### Teacher Workflow
1. Navigate to `/login/teacher`
2. Click "Register Now" if you don't have an account
3. Fill in your name, email, and password
4. After successful registration, you'll be redirected to the login page
5. Login with your email and password
6. Access your teacher dashboard

### Navigation
- From student pages, you can navigate to teacher pages using the "Are you a teacher?" link
- From teacher pages, you can navigate to student pages using the "Are you a student?" link

## Authentication Service (`lib/auth.ts`)

The authentication logic is completely separated from the UI for maintainability:

### Functions
- `registerStudent()`: Handles student registration with validation
- `registerTeacher()`: Handles teacher registration with validation
- `loginStudent()`: Authenticates students and verifies role
- `loginTeacher()`: Authenticates teachers
- `validateEmail()`: Email format validation
- `validatePassword()`: Password strength validation
- `validatePhone()`: Phone number validation
- `validateStudentData()`: Comprehensive student data validation
- `validateTeacherData()`: Comprehensive teacher data validation

## Future Enhancements

- [ ] Email verification
- [ ] Password reset functionality
- [ ] Profile editing
- [ ] File upload (profile pictures)
- [ ] Admin dashboard
- [ ] Class management system
- [ ] Assignment submission
- [ ] Grade tracking
- [ ] Parent portal

## License

This project is private and proprietary.

## Support

For support, please contact the development team.
