import { db, collection, getDocs, updateDoc, doc, deleteDoc, Timestamp } from '../firebase';
import { ServerInstance } from '../types';

export async function checkExpiredServers() {
  const now = Timestamp.now();
  const serversRef = collection(db, 'servers');

  const querySnapshot = await getDocs(serversRef);

  for (const serverDoc of querySnapshot.docs) {
    const server = { id: serverDoc.id, ...serverDoc.data() } as ServerInstance;

    if (!server.expiresAt) continue;

    const expiresAt = server.expiresAt instanceof Timestamp
      ? server.expiresAt.toDate()
      : new Date(server.expiresAt);

    const diffTime = now.toDate().getTime() - expiresAt.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays > 0 && server.status !== 'suspended') {
      await updateDoc(doc(db, 'servers', server.id), {
        status: 'suspended',
        isSuspended: true
      });
    }

    if (diffDays > 5) {
      await deleteDoc(doc(db, 'servers', server.id));
    }
  }
}
