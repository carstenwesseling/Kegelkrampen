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
    if (!u) return null;
    // Anmeldung per Handynummer: Die Nummer steht unter telefon/<nummer> mit dem Namen des Mitglieds.
    // Ist sie keinem Mitglied zugeordnet, bleibt member leer und die Person darf nicht abstimmen.
    let member = null;
    if (u.phoneNumber) {
      try { const d = await fbDb.doc("telefon/" + u.phoneNumber).get(); if (d.exists) member = (d.data() || {}).name || null; } catch (e) {}
    }
    return {
      id: u.uid,
      name: member || u.displayName || u.email || u.phoneNumber || "",
      avatarUrl: u.photoURL || "",
      email: u.emailVerified && u.email ? u.email.toLowerCase() : "",
      phone: !!u.phoneNumber,
      member
    };
  }
};

// Handynummer in der Schreibweise +49… (E.164). „0171 1234567“ wird als +49 171 1234567 gelesen,
// „0049…“ wie „+49…“. Liefert null, wenn die Nummer nicht passt, und „“ für eine leere Eingabe.
function normTel(v) {
  let s = String(v || "").trim().replace(/[\s\-\/().]/g, "");
  if (!s) return "";
  if (s.startsWith("00")) s = "+" + s.slice(2);
  else if (s.startsWith("0")) s = "+49" + s.slice(1);
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
}

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
  // Anmeldung per Handynummer (Mitglieder, die abstimmen): Firebase schickt einen Code per SMS.
  // Nur wer mit der Nummer in telefon/ eingetragen ist, wird in der Umfrage als Mitglied erkannt.
  const tel = document.createElement("button");
  tel.type = "button";
  tel.id = "kk-tel";
  tel.className = "mi";
  tel.textContent = "Per Handynummer anmelden";
  mail.insertAdjacentElement("afterend", tel);
  const recaptchaBox = document.createElement("div");
  recaptchaBox.id = "kk-recaptcha";
  document.body.appendChild(recaptchaBox);
  let telVerifier = null, telConfirm = null;
  const telMsg = e => {
    const c = (e && e.code) || "";
    if (c == "auth/operation-not-allowed") return "Anmeldung per Handynummer ist noch nicht eingeschaltet. Bitte den Besitzer informieren.";
    if (c == "auth/invalid-phone-number") return "Die Handynummer wird nicht angenommen. Bitte mit Vorwahl eingeben, z. B. 0171 1234567.";
    if (c == "auth/invalid-verification-code") return "Der Code stimmt nicht. Bitte noch einmal per Handynummer anmelden.";
    if (c == "auth/code-expired") return "Der Code ist abgelaufen. Bitte noch einmal per Handynummer anmelden.";
    if (c == "auth/too-many-requests") return "Zu viele Versuche. Bitte später noch einmal probieren.";
    return "Anmeldung fehlgeschlagen: " + ((e && e.message) || c);
  };
  tel.onclick = async () => {
    const raw = prompt("Deine Handynummer (z. B. 0171 1234567 oder +49 171 1234567):");
    if (raw === null) return;
    const nr = normTel(raw);
    if (!nr) return alert("Die Handynummer sieht nicht richtig aus. Bitte mit Vorwahl eingeben, z. B. 0171 1234567.");
    try {
      if (!telVerifier) telVerifier = new firebase.auth.RecaptchaVerifier("kk-recaptcha", { size: "invisible" });
      telConfirm = await fbAuth.signInWithPhoneNumber(nr, telVerifier);
    } catch (e) {
      try { if (telVerifier) telVerifier.clear(); } catch (x) {}
      telVerifier = null;
      return alert(telMsg(e));
    }
    const code = prompt("Der Code wurde per SMS an " + nr + " geschickt. Bitte den Code eingeben:");
    if (!code) return;
    try { await telConfirm.confirm(code.trim()); location.reload(); }
    catch (e) { alert(telMsg(e)); }
  };
  fbAuth.onAuthStateChanged(u => {
    btn.textContent = u ? "Abmelden" : "Mit Google anmelden";
    mail.hidden = !!u;
    tel.hidden = !!u;
  });
})();
