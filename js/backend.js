// Ersetzt die Laufzeit von claude.ai durch Firebase. Die App ruft weiterhin
// claude.use('db' | 'user' | 'assets' | 'downloads') auf; hier wird das auf Firestore,
// Firebase Auth und Storage abgebildet. Lesen ist für alle erlaubt, Schreiben nur für
// den Besitzer (siehe firestore.rules und storage.rules).

firebase.initializeApp(firebaseConfig);
const fbAuth = firebase.auth();
const fbDb = firebase.firestore();
const fbStore = firebase.storage();

// Öffentliche Adresse eines Fotos; die App baut damit die <img>-Adressen.
const KK_STORAGE_BASE = "https://firebasestorage.googleapis.com/v0/b/" + firebaseConfig.storageBucket + "/o/";
window.kkBlobUrl = id => KK_STORAGE_BASE + encodeURIComponent(id) + "?alt=media";

// Erster Auth-Status abwarten, bevor die App fragt, ob jemand Besitzer ist.
const kkAuthReady = new Promise(resolve => {
  const off = fbAuth.onAuthStateChanged(() => { off(); resolve(); });
});

const kkIsOwner = () => {
  const u = fbAuth.currentUser;
  return !!(u && u.email === KK_OWNER_EMAIL && u.emailVerified);
};

const kkUser = {
  async can(perm) { await kkAuthReady; return perm === "data.write" ? kkIsOwner() : false; },
  async isOwner() { await kkAuthReady; return kkIsOwner(); },
  // Freigegebene Mitglieder: Dokument editors/<google-mail> (siehe firestore.rules). Der Besitzer zählt immer.
  async isEditor() {
    await kkAuthReady;
    if (kkIsOwner()) return true;
    const u = fbAuth.currentUser;
    if (!u || !u.emailVerified || !u.email) return false;
    try { return (await fbDb.doc("editors/" + u.email.toLowerCase()).get()).exists; } catch (e) { return false; }
  },
  async me() {
    await kkAuthReady;
    const u = fbAuth.currentUser;
    return u ? { id: u.uid, name: u.displayName || u.email, avatarUrl: u.photoURL || "", email: u.emailVerified && u.email ? u.email.toLowerCase() : "" } : null;
  }
};

const kkAssets = {
  // Speichert ein Bild im Ordner touren/ und gibt seinen Pfad als id zurück.
  async upload(blob) {
    const name = (blob.name || "bild").replace(/[^\w.-]/g, "_");
    const path = "touren/" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8) + "-" + name;
    await fbStore.ref(path).put(blob, { contentType: blob.type || "image/jpeg" });
    return { id: path };
  },
  async delete(id) { await fbStore.ref(id).delete(); },
  // Nutzungsanzeige ist im Firebase-Tarif nicht vorgesehen; die App blendet sie dann aus.
  async list() { return null; }
};

window.claude = {
  use(name) {
    const map = {
      db: fbDb,
      user: kkUser,
      assets: kkAssets,
      downloads: {
        save({ filename, data }) {
          const url = URL.createObjectURL(new Blob([data], { type: "text/csv;charset=utf-8" }));
          const a = document.createElement("a");
          a.href = url; a.download = filename; document.body.appendChild(a); a.click();
          setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
        }
      }
    };
    return Promise.resolve(map[name] || null);
  }
};

// Anmelde-Schaltfläche neben dem Anmeldestatus. Nach An- oder Abmelden neu laden,
// damit die App den Besitzerstatus neu bestimmt.
(function kkLoginButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "kk-login";
  // Die Anmelde-Knöpfe stehen unter „Mehr“ → Konto.
  const box = document.getElementById("loginbox");
  btn.className = "mi";
  if (box) box.appendChild(btn);
  btn.onclick = async () => {
    if (fbAuth.currentUser) { await fbAuth.signOut(); }
    else { await fbAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }
    location.reload();
  };
  // Anmeldung ohne Google-Konto (z. B. @aol.com): Die App schickt einen Anmelde-Link per E-Mail.
  // Nach dem Klick auf den Link ist die Adresse bestätigt (email_verified), damit greifen die Freigaberegeln.
  const mail = document.createElement("button");
  mail.type = "button";
  mail.id = "kk-mail";
  mail.className = "mi";
  mail.textContent = "Per Link anmelden";
  btn.insertAdjacentElement("afterend", mail);
  const KEY = "kkEmailForSignIn";
  const note = t => { const s = document.getElementById("st"); if (s) s.textContent = t; };
  mail.onclick = async () => {
    const email = (prompt("E-Mail-Adresse, an die der Anmelde-Link geschickt wird:") || "").trim().toLowerCase();
    if (!email) return;
    try {
      await fbAuth.sendSignInLinkToEmail(email, { url: location.origin + location.pathname, handleCodeInApp: true });
      try { localStorage.setItem(KEY, email); } catch (e) {}
      alert("Der Anmelde-Link wurde an " + email + " geschickt. Bitte den Link in der E-Mail öffnen (am besten im selben Browser).");
    } catch (e) { alert("Link konnte nicht gesendet werden: " + (e.message || e.code)); }
  };
  if (fbAuth.isSignInWithEmailLink(location.href)) {
    let email = "";
    try { email = localStorage.getItem(KEY) || ""; } catch (e) {}
    if (!email) email = (prompt("Bitte die E-Mail-Adresse zur Bestätigung eingeben:") || "").trim().toLowerCase();
    if (email) {
      fbAuth.signInWithEmailLink(email, location.href)
        .then(() => { try { localStorage.removeItem(KEY); } catch (e) {} location.replace(location.origin + location.pathname); })
        .catch(e => note("E-Mail-Anmeldung fehlgeschlagen: " + (e.message || e.code)));
    }
  }
  fbAuth.onAuthStateChanged(u => { btn.textContent = u ? "Abmelden" : "Mit Google anmelden"; mail.hidden = !!u; });
})();
