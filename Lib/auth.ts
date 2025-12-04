// lib/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "./firebase";

// Types
export interface StudentData {
  name: string;
  parentEmail: string;
  std: string;
  div: string;
  rollNo: string;
  school: string;
  parentsNo: string;
  gender: string;
  role: "student";
  classrooms?: Array<{
    slug: string;
    status: "joined" | "pending";
    joinedAt?: any;
  }>;
  createdAt: any;
}

export interface TeacherData {
  name: string;
  email: string;
  role: "teacher";
  classrooms?: string[];
  createdAt: any;
}

export interface CollaborationRequest {
  id: string;
  classroomSlug: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: any;
  acceptedAt?: any;
}

export interface StudentInClassroom {
  id: string;
  name: string;
  email: string;
  std?: string;
  div?: string;
  rollNo?: string;
  status: "pending" | "joined";
  joinedAt?: any;
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

  if (!data.parentEmail.trim()) {
    errors.push({ field: "parentEmail", message: "Parent's email is required" });
  } else if (!validateEmail(data.parentEmail)) {
    errors.push({ field: "parentEmail", message: "Invalid parent email format" });
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

    // Check if parent email is already a teacher
    const teacherDoc = await getDoc(doc(db, "teachers", studentData.parentEmail));
    if (teacherDoc.exists()) {
      return { success: false, error: "This email is already registered as a teacher. Teachers cannot register as students." };
    }

    // Create user with parent email
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      studentData.parentEmail,
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
      classrooms: [],
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
  teacherName: string;
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

export function generateUniqueId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createClassroom(
  teacherId: string,
  teacherName: string,
  name: string,
  school?: string,
  requiresPermission: boolean = false
): Promise<{ success: boolean; error?: string; classroomId?: string; slug?: string }> {
  try {
    if (!name.trim()) {
      return { success: false, error: "Classroom name is required" };
    }

    const baseSlug = generateSlug(name);
    const uniqueId = generateUniqueId();
    const slug = `${baseSlug}-${uniqueId}`;
    const classroomRef = doc(db, "classrooms", slug);

    // Create classroom document
    await setDoc(classroomRef, {
      name: name.trim(),
      school: school?.trim() || "",
      requiresPermission,
      teacherId,
      teacherName: teacherName,
      students: [],
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

// Teacher Collaboration Functions
export async function getTeacherByEmail(
  email: string
): Promise<{ success: boolean; teacher?: TeacherData & { uid: string }; error?: string }> {
  try {
    const teachersRef = collection(db, "teachers");
    const q = query(teachersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: "Teacher not found" };
    }

    const teacherDoc = querySnapshot.docs[0];
    return {
      success: true,
      teacher: { uid: teacherDoc.id, ...teacherDoc.data() } as TeacherData & { uid: string },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch teacher" };
  }
}

export async function sendCollaborationRequest(
  classroomSlug: string,
  targetTeacherId: string,
  requesterId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get requester data
    const requesterDoc = await getDoc(doc(db, "teachers", requesterId));
    if (!requesterDoc.exists()) {
      return { success: false, error: "Requester not found" };
    }

    const requesterData = requesterDoc.data() as TeacherData;

    // Get classroom data
    const classroomDoc = await getDoc(doc(db, "classrooms", classroomSlug));
    if (!classroomDoc.exists()) {
      return { success: false, error: "Classroom not found" };
    }

    // Check if teacher already has access
    const targetTeacherDoc = await getDoc(doc(db, "teachers", targetTeacherId));
    if (targetTeacherDoc.exists()) {
      const targetClassrooms = targetTeacherDoc.data().classrooms || [];
      if (targetClassrooms.includes(classroomSlug)) {
        return { success: false, error: "Teacher already has access to this classroom" };
      }
    }

    // Check if request already exists
    const existingRequestRef = doc(db, "classrooms", classroomSlug, "requests", requesterId);
    const existingRequest = await getDoc(existingRequestRef);
    if (existingRequest.exists() && existingRequest.data().status === "pending") {
      return { success: false, error: "Request already sent" };
    }

    // Create request in classroom's requests subcollection
    const requestRef = doc(db, "classrooms", classroomSlug, "requests", requesterId);
    await setDoc(requestRef, {
      classroomSlug,
      requesterId,
      requesterName: requesterData.name,
      requesterEmail: requesterData.email,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to send request" };
  }
}

export async function addTeacherDirectly(
  classroomSlug: string,
  targetTeacherId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if teacher already has access
    const targetTeacherDoc = await getDoc(doc(db, "teachers", targetTeacherId));
    if (targetTeacherDoc.exists()) {
      const targetClassrooms = targetTeacherDoc.data().classrooms || [];
      if (targetClassrooms.includes(classroomSlug)) {
        return { success: false, error: "Teacher already has access to this classroom" };
      }
      
      // Add classroom to teacher's classrooms array
      await setDoc(
        doc(db, "teachers", targetTeacherId),
        { classrooms: [...targetClassrooms, classroomSlug] },
        { merge: true }
      );
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add teacher" };
  }
}

export async function cancelCollaborationRequest(
  classroomSlug: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const requestRef = doc(db, "classrooms", classroomSlug, "requests", requestId);
    await setDoc(
      requestRef,
      {
        status: "cancelled",
      },
      { merge: true }
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to cancel request" };
  }
}

export async function getCollaborationRequests(
  classroomSlug: string
): Promise<{ success: boolean; requests?: CollaborationRequest[]; error?: string }> {
  try {
    const requestsRef = collection(db, "classrooms", classroomSlug, "requests");
    const querySnapshot = await getDocs(requestsRef);

    const requests: CollaborationRequest[] = [];
    querySnapshot.forEach((doc) => {
      requests.push({
        id: doc.id,
        ...doc.data(),
      } as CollaborationRequest);
    });

    return { success: true, requests };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch requests" };
  }
}

export async function acceptCollaborationRequest(
  classroomSlug: string,
  requestId: string,
  requesterId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update request status
    const requestRef = doc(db, "classrooms", classroomSlug, "requests", requestId);
    await setDoc(
      requestRef,
      {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Add classroom to teacher's classrooms array
    const teacherRef = doc(db, "teachers", requesterId);
    const teacherDoc = await getDoc(teacherRef);

    if (teacherDoc.exists()) {
      const currentClassrooms = teacherDoc.data().classrooms || [];
      if (!currentClassrooms.includes(classroomSlug)) {
        await setDoc(
          teacherRef,
          { classrooms: [...currentClassrooms, classroomSlug] },
          { merge: true }
        );
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to accept request" };
  }
}

export async function rejectCollaborationRequest(
  classroomSlug: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const requestRef = doc(db, "classrooms", classroomSlug, "requests", requestId);
    await setDoc(
      requestRef,
      {
        status: "rejected",
      },
      { merge: true }
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reject request" };
  }
}

// Student Management Functions
export async function getClassroomStudents(
  classroomSlug: string
): Promise<{ success: boolean; students?: StudentInClassroom[]; requiresPermission?: boolean; error?: string }> {
  try {
    const classroomDoc = await getDoc(doc(db, "classrooms", classroomSlug));
    if (!classroomDoc.exists()) {
      return { success: false, error: "Classroom not found" };
    }

    const classroomData = classroomDoc.data();
    const studentIds = classroomData.students || [];
    const requiresPermission = classroomData.requiresPermission || false;

    if (studentIds.length === 0) {
      return { success: true, students: [], requiresPermission };
    }

    const studentsPromises = studentIds.map(async (studentEntry: any) => {
      const studentId = typeof studentEntry === "string" ? studentEntry : studentEntry.id;
      const status = typeof studentEntry === "string" ? "joined" : studentEntry.status || "joined";
      
      const studentDoc = await getDoc(doc(db, "students", studentId));
      if (studentDoc.exists()) {
        const studentData = studentDoc.data() as StudentData;
        return {
          id: studentId,
          name: studentData.name,
          email: studentData.parentEmail,
          std: studentData.std,
          div: studentData.div,
          rollNo: studentData.rollNo,
          status,
          joinedAt: studentEntry.joinedAt || null,
        } as StudentInClassroom;
      }
      return null;
    });

    const studentsData = await Promise.all(studentsPromises);
    const students = studentsData.filter((s) => s !== null) as StudentInClassroom[];

    return { success: true, students, requiresPermission };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch students" };
  }
}

export async function updateClassroomPermission(
  classroomSlug: string,
  requiresPermission: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const classroomRef = doc(db, "classrooms", classroomSlug);
    await setDoc(classroomRef, { requiresPermission }, { merge: true });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update permission" };
  }
}

export async function acceptStudentRequest(
  classroomSlug: string,
  studentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const classroomRef = doc(db, "classrooms", classroomSlug);
    const classroomDoc = await getDoc(classroomRef);

    if (!classroomDoc.exists()) {
      return { success: false, error: "Classroom not found" };
    }

    const students = classroomDoc.data().students || [];
    const timestamp = Date.now();
    const updatedStudents = students.map((s: any) =>
      s.id === studentId ? { ...s, status: "joined", joinedAt: timestamp } : s
    );

    await setDoc(classroomRef, { students: updatedStudents }, { merge: true });

    // Update student document
    const studentRef = doc(db, "students", studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (studentDoc.exists()) {
      const studentClassrooms = studentDoc.data().classrooms || [];
      const updatedClassrooms = studentClassrooms.map((c: any) =>
        c.slug === classroomSlug ? { ...c, status: "joined", joinedAt: timestamp } : c
      );
      await setDoc(studentRef, { classrooms: updatedClassrooms }, { merge: true });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to accept student" };
  }
}

export async function rejectStudentRequest(
  classroomSlug: string,
  studentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const classroomRef = doc(db, "classrooms", classroomSlug);
    const classroomDoc = await getDoc(classroomRef);

    if (!classroomDoc.exists()) {
      return { success: false, error: "Classroom not found" };
    }

    const students = classroomDoc.data().students || [];
    const updatedStudents = students.filter((s: any) => s.id !== studentId);

    await setDoc(classroomRef, { students: updatedStudents }, { merge: true });

    // Update student document
    const studentRef = doc(db, "students", studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (studentDoc.exists()) {
      const studentClassrooms = studentDoc.data().classrooms || [];
      const updatedClassrooms = studentClassrooms.filter((c: any) => c.slug !== classroomSlug);
      await setDoc(studentRef, { classrooms: updatedClassrooms }, { merge: true });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reject student" };
  }
}

// Student Classroom Functions
export async function searchClassrooms(
  searchQuery: string
): Promise<{ success: boolean; classrooms?: Classroom[]; error?: string }> {
  try {
    const classroomsRef = collection(db, "classrooms");
    const querySnapshot = await getDocs(classroomsRef);

    const classrooms: Classroom[] = [];
    const searchLower = searchQuery.toLowerCase();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const classroom = { id: doc.id, ...data } as Classroom;
      
      // Search by classroom name, school, or teacher name
      if (
        classroom.name.toLowerCase().includes(searchLower) ||
        (classroom.school && classroom.school.toLowerCase().includes(searchLower)) ||
        classroom.teacherName.toLowerCase().includes(searchLower)
      ) {
        classrooms.push(classroom);
      }
    });

    return { success: true, classrooms };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to search classrooms" };
  }
}

export async function joinClassroom(
  studentId: string,
  classroomSlug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const classroomDoc = await getDoc(doc(db, "classrooms", classroomSlug));
    if (!classroomDoc.exists()) {
      return { success: false, error: "Classroom not found" };
    }

    const classroomData = classroomDoc.data();
    const requiresPermission = classroomData.requiresPermission || false;
    const students = classroomData.students || [];

    // Check if student is already in the classroom
    const existingStudent = students.find((s: any) => s.id === studentId);
    if (existingStudent) {
      return { success: false, error: "You are already in this classroom" };
    }

    const studentRef = doc(db, "students", studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      return { success: false, error: "Student not found" };
    }

    const studentClassrooms = studentDoc.data().classrooms || [];
    
    // Check if already requested or joined
    const existingEntry = studentClassrooms.find((c: any) => c.slug === classroomSlug);
    if (existingEntry) {
      if (existingEntry.status === "joined") {
        return { success: false, error: "You are already in this classroom" };
      } else {
        return { success: false, error: "You have already requested to join this classroom" };
      }
    }

    const status = requiresPermission ? "pending" : "joined";
    const timestamp = Date.now();

    // Add to classroom
    const studentEntry = {
      id: studentId,
      status,
      joinedAt: status === "joined" ? timestamp : null,
    };
    
    await setDoc(
      doc(db, "classrooms", classroomSlug),
      { students: [...students, studentEntry] },
      { merge: true }
    );

    // Add to student document
    const classroomEntry = {
      slug: classroomSlug,
      status,
      joinedAt: status === "joined" ? timestamp : null,
    };
    
    await setDoc(
      studentRef,
      { classrooms: [...studentClassrooms, classroomEntry] },
      { merge: true }
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to join classroom" };
  }
}

export async function withdrawClassroomRequest(
  studentId: string,
  classroomSlug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Remove from classroom
    const classroomRef = doc(db, "classrooms", classroomSlug);
    const classroomDoc = await getDoc(classroomRef);

    if (classroomDoc.exists()) {
      const students = classroomDoc.data().students || [];
      const updatedStudents = students.filter((s: any) => s.id !== studentId);
      await setDoc(classroomRef, { students: updatedStudents }, { merge: true });
    }

    // Remove from student document
    const studentRef = doc(db, "students", studentId);
    const studentDoc = await getDoc(studentRef);

    if (studentDoc.exists()) {
      const classrooms = studentDoc.data().classrooms || [];
      const updatedClassrooms = classrooms.filter((c: any) => c.slug !== classroomSlug);
      await setDoc(studentRef, { classrooms: updatedClassrooms }, { merge: true });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to withdraw request" };
  }
}

export async function getStudentClassrooms(
  studentId: string
): Promise<{ success: boolean; classrooms?: Array<Classroom & { status: string; joinedAt?: any }>; error?: string }> {
  try {
    const studentDoc = await getDoc(doc(db, "students", studentId));
    
    if (!studentDoc.exists()) {
      return { success: false, error: "Student not found" };
    }

    const studentClassrooms = studentDoc.data().classrooms || [];
    
    if (studentClassrooms.length === 0) {
      return { success: true, classrooms: [] };
    }

    const classroomPromises = studentClassrooms.map(async (entry: any) => {
      const classroomDoc = await getDoc(doc(db, "classrooms", entry.slug));
      if (classroomDoc.exists()) {
        return {
          id: classroomDoc.id,
          ...classroomDoc.data(),
          status: entry.status,
          joinedAt: entry.joinedAt,
        } as Classroom & { status: string; joinedAt?: any };
      }
      return null;
    });

    const classroomData = await Promise.all(classroomPromises);
    const classrooms = classroomData.filter((c) => c !== null) as Array<Classroom & { status: string; joinedAt?: any }>;

    return { success: true, classrooms };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch classrooms" };
  }
}
