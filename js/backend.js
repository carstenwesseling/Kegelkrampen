// Ersetzt die Laufzeit von claude.ai durch Firebase. Die App ruft weiterhin
// claude.use('db' | 'user' | 'assets' | 'downloads') auf; hier wird das auf Firestore,
// Firebase Auth und Storage abgebildet. Lesen ist für alle erlaubt, Schreiben nur für
// den Besitzer (siehe firestore.rules und storage.rules).

firebase.initializeApp(firebaseConfig);
const fbAuth = firebase.auth();
const fbDb = firebase.firestore();
const fbStore = firebase.storage();


// Erster Auth-Status abwarten, bevor die App fragt, ob jemand Besitzer ist.
const kkAuthReady = new Promise(resolve => {
  const off = fbAuth.onAuthStateChanged(() => { off(); resolve(); });
});

const kkIsOwner = () => {
  const u = fbAuth.currentUser;
  return !!(u && u.email === KK_OWNER_EMAIL && u.emailVerified);
};

// PIN-Zugang für Mitglieder: Der Besitzer legt je Mitglied pins/<Name> = {pin, level:'lesen'|'speichern'} an.
// Das Mitglied meldet sich anonym an und schreibt access/<uid> = {name, pin, level}. Die Firestore-Regeln lassen
// das nur bei passender PIN und Stufe zu und prüfen den Abgleich bei jedem Zugriff erneut (siehe firestore.rules).
let kkMember = null;        // {name, level} des angemeldeten PIN-Mitglieds, sonst null
let kkMemberP = null;       // laufende/abgeschlossene Prüfung des vorhandenen Zugangs
const kkLevels = ["speichern", "lesen"];
const kkAnon = () => { const u = fbAuth.currentUser; return !!(u && u.isAnonymous); };

// Vorhandenen Zugang prüfen und die Stufe erneuern (der Besitzer kann PIN oder Stufe geändert haben).
function kkMemberCheck() {
  if (!kkMemberP) kkMemberP = (async () => {
    await kkAuthReady;
    const u = fbAuth.currentUser;
    kkMember = null;
    if (!u || !u.isAnonymous) return null;
    let d = null;
    try { const s = await fbDb.doc("access/" + u.uid).get(); d = s.exists ? s.data() : null; } catch (e) { d = null; }
    if (!d) return null;
    for (const level of [d.level, ...kkLevels.filter(l => l !== d.level)]) {
      try { await fbDb.doc("access/" + u.uid).set({ name: d.name, pin: d.pin, level }); kkMember = { name: d.name, level }; return kkMember; } catch (e) {}
    }
    // PIN oder Name gibt es nicht mehr: Zugang beenden.
    try { await fbDb.doc("access/" + u.uid).delete(); } catch (e) {}
    return null;
  })();
  return kkMemberP;
}

const kkUser = {
  async can(perm) { await kkAuthReady; return perm === "data.write" ? kkIsOwner() : false; },
  async isOwner() { await kkAuthReady; return kkIsOwner(); },
  // Freigegebene Mitglieder: Dokument editors/<google-mail> (siehe firestore.rules) oder PIN-Zugang mit Stufe „speichern“.
  // Der Besitzer zählt immer.
  async isEditor() {
    await kkAuthReady;
    if (kkIsOwner()) return true;
    const u = fbAuth.currentUser;
    if (u && u.isAnonymous) { const m = await kkMemberCheck(); return !!(m && m.level === "speichern"); }
    if (!u || !u.emailVerified || !u.email) return false;
    try { return (await fbDb.doc("editors/" + u.email.toLowerCase()).get()).exists; } catch (e) { return false; }
  },
  // Mitglied mit gültigem PIN-Zugang (Stufe „lesen“ oder „speichern“).
  async isMember() { await kkAuthReady; return !!(await kkMemberCheck()); },
  async memberLevel() { await kkMemberCheck(); return kkMember ? kkMember.level : null; },
  async memberLogin(name, pin) {
    await kkAuthReady;
    let created = false;
    if (!fbAuth.currentUser) {
      try { await fbAuth.signInAnonymously(); created = true; }
      catch (e) { throw new Error(e && e.code === "auth/operation-not-allowed" ? "Die Mitglieder-Anmeldung ist noch nicht eingerichtet (anonyme Anmeldung in Firebase aktivieren)." : "Anmeldung fehlgeschlagen: " + (e.message || e.code)); }
    } else if (!fbAuth.currentUser.isAnonymous) throw new Error("Bitte zuerst abmelden.");
    const u = fbAuth.currentUser;
    for (const level of kkLevels) {
      try { await fbDb.doc("access/" + u.uid).set({ name, pin, level }); kkMember = { name, level }; kkMemberP = Promise.resolve(kkMember); return kkMember; } catch (e) {}
    }
    if (created) { try { await u.delete(); } catch (e) { try { await fbAuth.signOut(); } catch (x) {} } }
    throw new Error("Name oder PIN falsch.");
  },
  async memberLogout() {
    const u = fbAuth.currentUser;
    if (u && u.isAnonymous) {
      try { await fbDb.doc("access/" + u.uid).delete(); } catch (e) {}
      try { await u.delete(); } catch (e) { await fbAuth.signOut(); }
    } else await fbAuth.signOut();
    kkMember = null; kkMemberP = null;
  },
  async me() {
    await kkAuthReady;
    const u = fbAuth.currentUser;
    if (u && u.isAnonymous) { const m = await kkMemberCheck(); return m ? { id: u.uid, name: m.name, avatarUrl: "", email: "" } : null; }
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
    if (fbAuth.currentUser) { await kkUser.memberLogout(); }
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
