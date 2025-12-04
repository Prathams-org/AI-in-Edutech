// lib/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// Types
export interface StudentData {
  name: string;
  email: string;
  std: string;
  div: string;
  rollNo: string;
  school: string;
  parentsNo: string;
  parentEmail: string;
  gender: string;
  role: "student";
  createdAt: any;
}

export interface TeacherData {
  name: string;
  email: string;
  role: "teacher";
  createdAt: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Validation functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
}

export function validateStudentData(data: Omit<StudentData, "role" | "createdAt">): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name.trim()) {
    errors.push({ field: "name", message: "Name is required" });
  }

  if (!data.email.trim()) {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: "email", message: "Invalid email format" });
  }

  if (!data.std.trim()) {
    errors.push({ field: "std", message: "Standard is required" });
  }

  if (!data.div.trim()) {
    errors.push({ field: "div", message: "Division is required" });
  }

  if (!data.rollNo.trim()) {
    errors.push({ field: "rollNo", message: "Roll number is required" });
  }

  if (!data.school.trim()) {
    errors.push({ field: "school", message: "School name is required" });
  }

  if (!data.parentsNo.trim()) {
    errors.push({ field: "parentsNo", message: "Parent's number is required" });
  } else if (!validatePhone(data.parentsNo)) {
    errors.push({ field: "parentsNo", message: "Invalid phone number (10 digits required)" });
  }

  if (!data.parentEmail.trim()) {
    errors.push({ field: "parentEmail", message: "Parent's email is required" });
  } else if (!validateEmail(data.parentEmail)) {
    errors.push({ field: "parentEmail", message: "Invalid parent email format" });
  }

  if (!data.gender) {
    errors.push({ field: "gender", message: "Gender is required" });
  }

  return errors;
}

export function validateTeacherData(data: Omit<TeacherData, "role" | "createdAt">): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name.trim()) {
    errors.push({ field: "name", message: "Name is required" });
  }

  if (!data.email.trim()) {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: "email", message: "Invalid email format" });
  }

  return errors;
}

// Auth functions
export async function registerStudent(
  studentData: Omit<StudentData, "role" | "createdAt">,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Validate password
    if (!validatePassword(password)) {
      return { success: false, error: "Password must be at least 6 characters long" };
    }

    // Validate student data
    const validationErrors = validateStudentData(studentData);
    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors[0].message };
    }

    // Check if user is already a teacher
    const teacherDoc = await getDoc(doc(db, "teachers", studentData.email));
    if (teacherDoc.exists()) {
      return { success: false, error: "This email is already registered as a teacher. Teachers cannot register as students." };
    }

    // Create user
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      studentData.email,
      password
    );

    // Save student data to Firestore
    await setDoc(doc(db, "students", userCredential.user.uid), {
      ...studentData,
      role: "student",
      createdAt: serverTimestamp(),
    });

    return { success: true, user: userCredential.user };
  } catch (error: any) {
    let errorMessage = "Registration failed";
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "Email already in use";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak";
    }
    return { success: false, error: errorMessage };
  }
}

export async function registerTeacher(
  teacherData: Omit<TeacherData, "role" | "createdAt">,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Validate password
    if (!validatePassword(password)) {
      return { success: false, error: "Password must be at least 6 characters long" };
    }

    // Validate teacher data
    const validationErrors = validateTeacherData(teacherData);
    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors[0].message };
    }

    // Create user
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      teacherData.email,
      password
    );

    // Save teacher data to Firestore
    await setDoc(doc(db, "teachers", userCredential.user.uid), {
      ...teacherData,
      role: "teacher",
      createdAt: serverTimestamp(),
    });

    return { success: true, user: userCredential.user };
  } catch (error: any) {
    let errorMessage = "Registration failed";
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "Email already in use";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak";
    }
    return { success: false, error: errorMessage };
  }
}

export async function loginStudent(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User; userData?: StudentData }> {
  try {
    // Validate inputs
    if (!validateEmail(email)) {
      return { success: false, error: "Invalid email format" };
    }

    if (!validatePassword(password)) {
      return { success: false, error: "Password must be at least 6 characters long" };
    }

    // Sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Check if user is a teacher
    const teacherDoc = await getDoc(doc(db, "teachers", userCredential.user.uid));
    if (teacherDoc.exists()) {
      await signOut(auth);
      return { success: false, error: "This account is registered as a teacher. Please use teacher login." };
    }

    // Get student data
    const studentDoc = await getDoc(doc(db, "students", userCredential.user.uid));
    if (!studentDoc.exists()) {
      await signOut(auth);
      return { success: false, error: "Student account not found. Please register first." };
    }

    return {
      success: true,
      user: userCredential.user,
      userData: studentDoc.data() as StudentData,
    };
  } catch (error: any) {
    let errorMessage = "Login failed";
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      errorMessage = "Invalid email or password";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Please try again later.";
    }
    return { success: false, error: errorMessage };
  }
}

export async function loginTeacher(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User; userData?: TeacherData }> {
  try {
    // Validate inputs
    if (!validateEmail(email)) {
      return { success: false, error: "Invalid email format" };
    }

    if (!validatePassword(password)) {
      return { success: false, error: "Password must be at least 6 characters long" };
    }

    // Sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Get teacher data - teachers can also be students
    const teacherDoc = await getDoc(doc(db, "teachers", userCredential.user.uid));
    if (!teacherDoc.exists()) {
      await signOut(auth);
      return { success: false, error: "Teacher account not found. Please register first." };
    }

    return {
      success: true,
      user: userCredential.user,
      userData: teacherDoc.data() as TeacherData,
    };
  } catch (error: any) {
    let errorMessage = "Login failed";
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      errorMessage = "Invalid email or password";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Please try again later.";
    }
    return { success: false, error: errorMessage };
  }
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

// Classroom types and functions
export interface Classroom {
  id: string;
  name: string;
  school?: string;
  requiresPermission: boolean;
  teacherId: string;
  createdAt: any;
  slug: string;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createClassroom(
  teacherId: string,
  name: string,
  school?: string,
  requiresPermission: boolean = false
): Promise<{ success: boolean; error?: string; classroomId?: string; slug?: string }> {
  try {
    if (!name.trim()) {
      return { success: false, error: "Classroom name is required" };
    }

    const slug = generateSlug(name);
    const classroomRef = doc(db, "classrooms", slug);

    // Check if classroom with this slug already exists
    const existingClassroom = await getDoc(classroomRef);
    if (existingClassroom.exists()) {
      return { success: false, error: "A classroom with this name already exists" };
    }

    // Create classroom document
    await setDoc(classroomRef, {
      name: name.trim(),
      school: school?.trim() || "",
      requiresPermission,
      teacherId,
      createdAt: serverTimestamp(),
      slug,
    });

    // Update teacher document with classroom reference
    const teacherRef = doc(db, "teachers", teacherId);
    const teacherDoc = await getDoc(teacherRef);
    
    if (teacherDoc.exists()) {
      const currentClassrooms = teacherDoc.data().classrooms || [];
      await setDoc(
        teacherRef,
        { classrooms: [...currentClassrooms, slug] },
        { merge: true }
      );
    }

    return { success: true, classroomId: slug, slug };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create classroom" };
  }
}

export async function getTeacherClassrooms(
  teacherId: string
): Promise<{ success: boolean; classrooms?: Classroom[]; error?: string }> {
  try {
    const teacherDoc = await getDoc(doc(db, "teachers", teacherId));
    
    if (!teacherDoc.exists()) {
      return { success: false, error: "Teacher not found" };
    }

    const classroomSlugs = teacherDoc.data().classrooms || [];
    
    if (classroomSlugs.length === 0) {
      return { success: true, classrooms: [] };
    }

    const classroomPromises = classroomSlugs.map((slug: string) =>
      getDoc(doc(db, "classrooms", slug))
    );

    const classroomDocs = await Promise.all(classroomPromises);
    const classrooms = classroomDocs
      .filter((doc) => doc.exists())
      .map((doc) => ({ id: doc.id, ...doc.data() } as Classroom));

    return { success: true, classrooms };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch classrooms" };
  }
}

export async function getClassroomBySlug(
  slug: string
): Promise<{ success: boolean; classroom?: Classroom; error?: string }> {
  try {
    const classroomDoc = await getDoc(doc(db, "classrooms", slug));
    
    if (!classroomDoc.exists()) {
      return { success: false, error: "Classroom not found" };
    }

    return {
      success: true,
      classroom: { id: classroomDoc.id, ...classroomDoc.data() } as Classroom,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch classroom" };
  }
}
