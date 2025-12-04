// lib/contentStorage.ts
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";

// Optimized flat structure for faster queries
export interface ContentTree {
  subjects: {
    [subjectTitle: string]: {
      chapters: {
        [chapterTitle: string]: Array<{
          id: string;
          title: string;
        }>; // Array of topic objects with ID and title
      };
    };
  };
}

interface ParsedContent {
  subjects: Array<{
    title: string;
    chapters: Array<{
      title: string;
      topics: Array<{
        title: string;
        content: string;
      }>;
    }>;
  }>;
}

export async function saveContentToFirestore(
  classroomSlug: string,
  parsedContent: ParsedContent
): Promise<void> {
  try {
    const classroomRef = doc(db, "classrooms", classroomSlug);
    const classroomDoc = await getDoc(classroomRef);

    if (!classroomDoc.exists()) {
      throw new Error("Classroom not found");
    }

    const existingTree: ContentTree = classroomDoc.data().contentTree || { subjects: {} };
    const batch = writeBatch(db);
    let batchCount = 0;

    // Process each subject
    for (const subject of parsedContent.subjects) {
      const subjectTitle = subject.title;

      // Initialize subject if it doesn't exist
      if (!existingTree.subjects[subjectTitle]) {
        existingTree.subjects[subjectTitle] = { chapters: {} };
      }

      // Process each chapter
      for (const chapter of subject.chapters) {
        const chapterTitle = chapter.title;

        // Initialize chapter if it doesn't exist
        if (!existingTree.subjects[subjectTitle].chapters[chapterTitle]) {
          existingTree.subjects[subjectTitle].chapters[chapterTitle] = [];
        }

        // Process each topic
        for (const topic of chapter.topics) {
          let topicTitle = topic.title;

          // Check for duplicates
          const existingTopics = existingTree.subjects[subjectTitle].chapters[chapterTitle];
          const duplicateCount = existingTopics.filter(t => t.title === topicTitle).length;
          
          if (duplicateCount > 0) {
            topicTitle = `${topicTitle} (${duplicateCount + 1})`;
          }

          // Create optimized document with indexed fields for fast queries
          const contentRef = doc(collection(db, "classrooms", classroomSlug, "content"));
          batch.set(contentRef, {
            subject: subjectTitle,
            chapter: chapterTitle,
            topic: topicTitle,
            content: topic.content,
            // Indexed fields for faster queries
            subjectLower: subjectTitle.toLowerCase(),
            chapterLower: chapterTitle.toLowerCase(),
            topicLower: topicTitle.toLowerCase(),
            createdAt: serverTimestamp(),
          });

          // Add topic object (ID + title) to tree
          existingTree.subjects[subjectTitle].chapters[chapterTitle].push({
            id: contentRef.id,
            title: topicTitle
          });

          batchCount++;

          // Firestore batch limit is 500 operations
          if (batchCount >= 450) {
            await batch.commit();
            batchCount = 0;
          }
        }
      }
    }

    // Commit remaining batch operations
    if (batchCount > 0) {
      await batch.commit();
    }

    // Update classroom document with new content tree
    await setDoc(classroomRef, { contentTree: existingTree }, { merge: true });
  } catch (error) {
    console.error("Error saving content to Firestore:", error);
    throw error;
  }
}

export async function getContentTree(classroomSlug: string): Promise<ContentTree> {
  try {
    const classroomRef = doc(db, "classrooms", classroomSlug);
    const classroomDoc = await getDoc(classroomRef);

    if (!classroomDoc.exists()) {
      throw new Error("Classroom not found");
    }

    return classroomDoc.data().contentTree || { subjects: {} };
  } catch (error) {
    console.error("Error getting content tree:", error);
    throw error;
  }
}

export async function getTopicContent(classroomSlug: string, topicId: string): Promise<any> {
  try {
    const topicRef = doc(db, "classrooms", classroomSlug, "content", topicId);
    const topicDoc = await getDoc(topicRef);

    if (!topicDoc.exists()) {
      throw new Error("Topic not found");
    }

    return topicDoc.data();
  } catch (error) {
    console.error("Error getting topic content:", error);
    throw error;
  }
}