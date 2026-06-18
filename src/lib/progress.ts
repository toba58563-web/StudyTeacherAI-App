import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "./firebase";
import { format, differenceInDays } from "date-fns";

export async function incrementUserProgress(userId: string, field: 'questionsAsked' | 'quizzesCompleted' | 'notesGenerated' | 'goalsCompleted', xpGain: number) {
  if (!userId) return;
  const userRef = doc(db, "users", userId);
  
  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    
    // Streak logic
    const data = userSnap.data();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let newStreak = data.streak || 1;
    let lastActiveDateStr = data.lastActiveDateStr || todayStr;
    
    if (lastActiveDateStr !== todayStr) {
      const daysDiff = differenceInDays(new Date(), new Date(lastActiveDateStr));
      if (daysDiff === 1) {
        newStreak += 1;
      } else if (daysDiff > 1) {
        newStreak = 1;
      }
      lastActiveDateStr = todayStr;
    }
    
    // Level logic
    const currentXp = (data.xp || 0) + xpGain;
    const newLevel = Math.floor(currentXp / 1000) + 1;

    await updateDoc(userRef, {
      [field]: increment(1),
      xp: increment(xpGain),
      streak: newStreak,
      lastActiveDateStr: lastActiveDateStr,
      level: newLevel
    });
  } catch (error) {
    console.error("Error updating progress:", error);
  }
}
