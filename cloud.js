// PointPlan cloud sync: Google sign-in, trips shared by email, offline-first via Firestore's local cache.
//
// Data layout in Firestore:
//   trips/{tripId}                 the trip, plus owner (uid) and editors (lower-case emails, owner included)
//   trips/{tripId}/items/{itemId}  every stop and expense of that trip
// Security rules (firestore.rules) only let a trip's editors read or change it.

import { initializeApp } from './vendor/firebase/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut as fbSignOut } from './vendor/firebase/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, query, where, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from './vendor/firebase/firebase-firestore.js';

export function startCloud(config, hooks) {
  const app = initializeApp(config);
  const auth = getAuth(app);
  // keeps a copy of your trips on the device, so the app works offline and syncs when back online
  const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });

  let user = null, unTrips = null;
  const itemSubs = new Map();   // tripId -> unsubscribe
  const itemsByTrip = new Map(); // tripId -> items[]
  let pending = 0;

  const email = () => (user && user.email || '').toLowerCase();
  const strip = o => { const r = {}; for (const [k, v] of Object.entries(o)) if (v !== undefined && !(typeof v === 'number' && Number.isNaN(v))) r[k] = v; return r; };
  const status = () => hooks.onStatus(!navigator.onLine ? 'offline' : pending ? 'syncing' : 'synced');
  const track = p => { pending++; status(); p.catch(e => hooks.onError(e)).finally(() => { pending--; status(); }); };
  addEventListener('online', status); addEventListener('offline', status);

  function stopAll() {
    if (unTrips) { unTrips(); unTrips = null; }
    itemSubs.forEach(u => u()); itemSubs.clear(); itemsByTrip.clear();
  }
  function emitItems() { hooks.onItems([].concat(...itemsByTrip.values())); }

  function listen() {
    stopAll();
    const q = query(collection(db, 'trips'), where('editors', 'array-contains', email()));
    unTrips = onSnapshot(q, { includeMetadataChanges: false }, snap => {
      const trips = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      const ids = new Set(trips.map(t => t.id));
      // follow the stops of every trip you can see
      for (const [id, un] of itemSubs) if (!ids.has(id)) { un(); itemSubs.delete(id); itemsByTrip.delete(id); }
      for (const id of ids) if (!itemSubs.has(id)) {
        itemSubs.set(id, onSnapshot(collection(db, 'trips', id, 'items'), s => {
          itemsByTrip.set(id, s.docs.map(d => ({ ...d.data(), id: d.id, tripId: id })));
          emitItems();
        }, e => { if (e.code !== 'permission-denied') hooks.onError(e); })); // denied = you left or were removed from the trip
      }
      hooks.onTrips(trips, { fromServer: !snap.metadata.fromCache });
      emitItems();
    }, e => hooks.onError(e));
  }

  onAuthStateChanged(auth, u => {
    user = u;
    hooks.onUser(u ? { uid: u.uid, email: email(), name: u.displayName || '', photo: u.photoURL || '' } : null);
    if (u) listen(); else stopAll();
  });
  getRedirectResult(auth).catch(e => hooks.onError(e));

  return {
    async signIn() {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      try { await signInWithPopup(auth, provider); }
      catch (e) {
        const c = e.code || '';
        if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') return;
        // phones and installed apps sometimes block popups: fall back to a full-page sign-in
        if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment') return signInWithRedirect(auth, provider);
        throw e;
      }
    },
    signOut: () => fbSignOut(auth),
    saveTrip(t) {
      const data = strip({ ...t, owner: t.owner || user.uid, editors: (t.editors && t.editors.length ? t.editors : [email()]).map(e => e.toLowerCase()), updatedAt: Date.now() });
      track(setDoc(doc(db, 'trips', t.id), data));
      return data;
    },
    saveItem(it) { track(setDoc(doc(db, 'trips', it.tripId, 'items', it.id), strip({ ...it, updatedAt: Date.now() }))); },
    deleteItem(tripId, id) { track(deleteDoc(doc(db, 'trips', tripId, 'items', id))); },
    deleteTrip(id, itemIds) {
      // stops first: once the trip is gone, the rules can no longer check who may delete its stops.
      // Firestore sends queued writes in order, also after being offline.
      for (let k = 0; k < itemIds.length; k += 400) {
        const b = writeBatch(db); itemIds.slice(k, k + 400).forEach(i => b.delete(doc(db, 'trips', id, 'items', i)));
        track(b.commit());
      }
      track(deleteDoc(doc(db, 'trips', id)));
    },
    // copy trips that were saved only on this device into your account
    upload(trips, items) {
      for (const t of trips) {
        track(setDoc(doc(db, 'trips', t.id), strip({ ...t, owner: user.uid, editors: [email()], updatedAt: Date.now() })));
        const its = items.filter(i => i.tripId === t.id);
        for (let k = 0; k < its.length; k += 400) {
          const b = writeBatch(db); its.slice(k, k + 400).forEach(i => b.set(doc(db, 'trips', t.id, 'items', i.id), strip(i)));
          track(b.commit());
        }
      }
    },
    me: () => user && { uid: user.uid, email: email() }
  };
}
