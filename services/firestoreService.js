import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebaseconfig';

const getAuthUidOrThrow = () => {
  const authUid = auth.currentUser?.uid;
  if (!authUid) {
    throw new Error('Your session expired. Please sign in again.');
  }
  return authUid;
};

const resolveAuthUid = (expectedUid) => {
  const authUid = getAuthUidOrThrow();
  if (expectedUid && expectedUid !== authUid) {
    throw new Error('Your account session changed. Please reopen chat.');
  }
  return authUid;
};

const normalizeSkill = (docSnap) => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data?.title || '',
    type: data?.type || 'offer',
    ownerUid: data?.ownerUid || '',
    ownerName: data?.ownerName || 'Unknown user',
  };
};

const normalizeReview = (docSnap) => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    bookingId: data?.bookingId || null,
    mentor: data?.mentor || '',
    rating: Number(data?.rating || 0),
    reviewText: data?.reviewText || '',
    reviewerUid: data?.reviewerUid || '',
    createdAt: data?.createdAt?.toDate?.()?.toISOString?.() || null,
  };
};

const normalizeBooking = (docSnap) => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    requesterUid: data?.requesterUid || '',
    requesterName: data?.requesterName || 'Unknown user',
    receiverUid: data?.receiverUid || '',
    receiverName: data?.receiverName || 'Unknown user',
    skill: data?.skill || '',
    date: data?.date || '',
    time: data?.time || '',
    duration: data?.duration || '',
    status: data?.status || 'pending',
    createdAt: data?.createdAt?.toDate?.()?.toISOString?.() || null,
  };
};

export const upsertUserProfile = async (profile) => {
  if (!profile?.uid) {
    return;
  }

  // Avoid permission failures during app boot before Firebase auth restores.
  if (auth.currentUser?.uid !== profile.uid) {
    return;
  }

  await setDoc(
    doc(db, 'users', profile.uid),
    {
      uid: profile.uid,
      name: profile.name || '',
      email: profile.email || '',
      photo: profile.photo || '',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const fetchUserSkills = async (uid) => {
  if (!uid) {
    return [];
  }

  const q = query(collection(db, 'skills'), where('ownerUid', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(normalizeSkill);
};

export const fetchCommunitySkills = async () => {
  const snapshot = await getDocs(collection(db, 'skills'));
  return snapshot.docs.map(normalizeSkill);
};

export const createSkill = async ({ ownerUid, ownerName, title, type }) => {
  const skillRef = await addDoc(collection(db, 'skills'), {
    ownerUid,
    ownerName: ownerName || 'Unknown user',
    title,
    type,
    createdAt: serverTimestamp(),
  });

  return {
    id: skillRef.id,
    ownerUid,
    ownerName: ownerName || 'Unknown user',
    title,
    type,
  };
};

export const removeSkill = async ({ skillId, ownerUid }) => {
  const targetRef = doc(db, 'skills', skillId);
  const current = await getDoc(targetRef);
  if (!current.exists()) {
    return;
  }

  const data = current.data();
  if (data?.ownerUid !== ownerUid) {
    throw new Error('You can only delete your own skills.');
  }

  await deleteDoc(targetRef);
};

export const createReview = async ({
  bookingId,
  mentor,
  rating,
  reviewText,
  reviewerUid,
}) => {
  const reviewRef = await addDoc(collection(db, 'reviews'), {
    bookingId: bookingId || null,
    mentor,
    rating,
    reviewText: reviewText || '',
    reviewerUid,
    createdAt: serverTimestamp(),
  });

  return reviewRef.id;
};

export const fetchReviewsByReviewer = async (reviewerUid) => {
  if (!reviewerUid) {
    return [];
  }

  const q = query(collection(db, 'reviews'), where('reviewerUid', '==', reviewerUid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(normalizeReview);
};

export const createBookingRequest = async ({
  requesterUid,
  requesterName,
  receiverUid,
  receiverName,
  skill,
  date,
  time,
  duration,
}) => {
  const bookingRef = await addDoc(collection(db, 'bookings'), {
    requesterUid,
    requesterName: requesterName || 'Unknown user',
    receiverUid,
    receiverName: receiverName || 'Unknown user',
    skill,
    date,
    time,
    duration,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  return bookingRef.id;
};

export const fetchBookingsForUser = async (uid) => {
  if (!uid) {
    return [];
  }

  const [requestedByUserSnapshot, receivedByUserSnapshot] = await Promise.all([
    getDocs(query(collection(db, 'bookings'), where('requesterUid', '==', uid))),
    getDocs(query(collection(db, 'bookings'), where('receiverUid', '==', uid))),
  ]);

  const merged = [...requestedByUserSnapshot.docs, ...receivedByUserSnapshot.docs];
  const seen = new Set();
  const deduped = [];
  merged.forEach((entry) => {
    if (!seen.has(entry.id)) {
      seen.add(entry.id);
      deduped.push(normalizeBooking(entry));
    }
  });

  return deduped.sort((a, b) => {
    if (!a.createdAt) {
      return 1;
    }
    if (!b.createdAt) {
      return -1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export const updateBookingRequestStatus = async ({ bookingId, status }) => {
  if (!bookingId) {
    throw new Error('Missing booking id');
  }

  await setDoc(
    doc(db, 'bookings', bookingId),
    {
      status,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

const buildPairKey = (uidA, uidB) => [uidA, uidB].sort().join('__');

const normalizeChat = (docSnap, currentUserId) => {
  const data = docSnap.data();
  const peerNameByUid = data?.participantNames || {};
  const peerUid = (Array.isArray(data?.participants) ? data.participants : []).find((uid) => uid !== currentUserId) || '';
  return {
    id: docSnap.id,
    peerUid,
    peerName: peerNameByUid?.[peerUid] || 'Community member',
    lastMessage: data?.lastMessage || '',
    lastMessageAt: data?.lastMessageAt?.toDate?.()?.toISOString?.() || null,
  };
};

const normalizeMessage = (docSnap) => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    senderUid: data?.senderUid || '',
    senderName: data?.senderName || 'Unknown user',
    text: data?.text || '',
    createdAt: data?.createdAt?.toDate?.()?.toISOString?.() || null,
  };
};

export const getOrCreateChatThread = async ({ currentUser, peerUid, peerName }) => {
  const currentUid = resolveAuthUid(currentUser?.uid);

  if (!peerUid) {
    throw new Error('Missing participant details');
  }

  if (peerUid === currentUid) {
    throw new Error('You cannot start a chat with yourself.');
  }

  const pairKey = buildPairKey(currentUid, peerUid);
  const existingChatSnap = await getDocs(
    query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUid),
      where('pairKey', '==', pairKey)
    )
  );
  if (!existingChatSnap.empty) {
    const existing = existingChatSnap.docs[0];
    return { id: existing.id };
  }

  const newChatRef = await addDoc(collection(db, 'chats'), {
    pairKey,
    participants: [currentUid, peerUid],
    participantNames: {
      [currentUid]: currentUser.name || currentUser.email || 'You',
      [peerUid]: peerName || 'Community member',
    },
    lastMessage: '',
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  });

  return { id: newChatRef.id };
};

export const fetchUserChatThreads = async (uid) => {
  const currentUid = resolveAuthUid(uid);

  const snapshot = await getDocs(query(collection(db, 'chats'), where('participants', 'array-contains', currentUid)));
  return snapshot.docs
    .map((item) => normalizeChat(item, currentUid))
    .sort((a, b) => {
      if (!a.lastMessageAt) {
        return 1;
      }
      if (!b.lastMessageAt) {
        return -1;
      }
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
};

export const fetchChatMessages = async (chatId, uid) => {
  const currentUid = resolveAuthUid(uid);

  if (!chatId) {
    throw new Error('Missing chat thread id.');
  }

  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) {
    return [];
  }

  const participants = Array.isArray(chatSnap.data()?.participants) ? chatSnap.data().participants : [];
  if (!participants.includes(currentUid)) {
    throw new Error('You do not have access to this conversation.');
  }

  const snapshot = await getDocs(query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc')));
  return snapshot.docs.map(normalizeMessage);
};

export const sendChatMessage = async ({ chatId, senderUid, senderName, text }) => {
  const currentUid = resolveAuthUid(senderUid);

  if (!chatId || !text?.trim()) {
    throw new Error('Missing message payload');
  }

  const trimmed = text.trim();
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) {
    throw new Error('This chat no longer exists.');
  }

  const participants = Array.isArray(chatSnap.data()?.participants) ? chatSnap.data().participants : [];
  if (!participants.includes(currentUid)) {
    throw new Error('You are not a participant in this chat.');
  }

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderUid: currentUid,
    senderName: senderName || 'Unknown user',
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  await updateDoc(chatRef, {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
  });
};
