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
import { db } from '../firebaseconfig';

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
  if (!currentUser?.uid || !peerUid) {
    throw new Error('Missing participant details');
  }

  const pairKey = buildPairKey(currentUser.uid, peerUid);
  const existingChatSnap = await getDocs(query(collection(db, 'chats'), where('pairKey', '==', pairKey)));
  if (!existingChatSnap.empty) {
    const existing = existingChatSnap.docs[0];
    return { id: existing.id };
  }

  const newChatRef = await addDoc(collection(db, 'chats'), {
    pairKey,
    participants: [currentUser.uid, peerUid],
    participantNames: {
      [currentUser.uid]: currentUser.name || currentUser.email || 'You',
      [peerUid]: peerName || 'Community member',
    },
    lastMessage: '',
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  });

  return { id: newChatRef.id };
};

export const fetchUserChatThreads = async (uid) => {
  if (!uid) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, 'chats'), where('participants', 'array-contains', uid)));
  return snapshot.docs
    .map((item) => normalizeChat(item, uid))
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

export const fetchChatMessages = async (chatId) => {
  if (!chatId) {
    return [];
  }

  const snapshot = await getDocs(query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc')));
  return snapshot.docs.map(normalizeMessage);
};

export const sendChatMessage = async ({ chatId, senderUid, senderName, text }) => {
  if (!chatId || !senderUid || !text?.trim()) {
    throw new Error('Missing message payload');
  }

  const trimmed = text.trim();
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderUid,
    senderName: senderName || 'Unknown user',
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
  });
};
