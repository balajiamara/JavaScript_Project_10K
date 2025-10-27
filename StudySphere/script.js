// =====================
  // Simple IndexedDB wrapper
  // =====================
  const DB_NAME = 'studysphere-demo';
  const DB_VERSION = 1;
  let db;
  function openDB(){
    return new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const idb = e.target.result;
        if(!idb.objectStoreNames.contains('groups')) idb.createObjectStore('groups', {keyPath:'id'});
        if(!idb.objectStoreNames.contains('notes')) idb.createObjectStore('notes', {keyPath:'id'});
        if(!idb.objectStoreNames.contains('messages')) idb.createObjectStore('messages', {keyPath:'id'});
      }
      req.onsuccess = e => { db = e.target.result; res(db); }
      req.onerror = e => rej(e.target.error);
    });
  }
  function put(store, val){
    return new Promise((res, rej) => {
      const tx = db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      const r = os.put(val);
      r.onsuccess = () => res(r.result);
      r.onerror = e => rej(e.target.error);
    });
  }
  function getAll(store){
    return new Promise((res, rej) => {
      const tx = db.transaction(store,'readonly');
      const os = tx.objectStore(store);
      const r = os.getAll();
      r.onsuccess = () => res(r.result);
      r.onerror = e => rej(e.target.error);
    });
  }
  function getByKey(store, key){
    return new Promise((res, rej) => {
      const tx = db.transaction(store,'readonly');
      const os = tx.objectStore(store);
      const r = os.get(key);
      r.onsuccess = () => res(r.result);
      r.onerror = e => rej(e.target.error);
    });
  }
  function deleteKey(store, key){
    return new Promise((res, rej) => {
      const tx = db.transaction(store,'readwrite');
      const os = tx.objectStore(store);
      const r = os.delete(key);
      r.onsuccess = () => res();
      r.onerror = e => rej(e.target.error);
    });
  }

  // =====================
  // Helpers
  // =====================
  function uid(len=8){return Math.random().toString(36).slice(2,2+len).toUpperCase();}
  function el(selector){return document.querySelector(selector)}
  function showPage(id){document.querySelectorAll('main section').forEach(s=>s.style.display='none'); const node = el(id); if(node) node.style.display='block'}

  // =====================
  // Auth (localStorage)
  // =====================
  function currentUser(){try{return JSON.parse(localStorage.getItem('study_user') || 'null');}catch(e){return null}}
  function setUser(u){localStorage.setItem('study_user', JSON.stringify(u));}
  function logout(){localStorage.removeItem('study_user'); renderHeader(); showPage('#page-landing');}

  // =====================
  // Boot
  // =====================
  (async function init(){
    await openDB();
    attachUI();
    renderHeader();
    // If logged in, open dashboard
    if(currentUser()){
      openDashboard();
    } else {
      showPage('#page-landing');
    }
    seedDiscover();
  })();

  // =====================
  // UI wiring
  // =====================
  function attachUI(){
    // Landing
    const openSignupBtn = el('#open-signup'); if(openSignupBtn) openSignupBtn.addEventListener('click', ()=>openAuth('signup'));
    const openLoginBtn = el('#open-login'); if(openLoginBtn) openLoginBtn.addEventListener('click', ()=>openAuth('login'));
    const quickSignupBtn = el('#quick-signup'); if(quickSignupBtn) quickSignupBtn.addEventListener('click', quickSignup);
    const demoResetBtn = el('#demo-reset'); if(demoResetBtn) demoResetBtn.addEventListener('click', resetDemo);

    // Auth
    const authCancel = el('#auth-cancel'); if(authCancel) authCancel.addEventListener('click', ()=>{showPage('#page-landing')});
    const authSubmit = el('#auth-submit'); if(authSubmit) authSubmit.addEventListener('click', submitAuth);

    // Header
    const btnLogout = el('#btn-logout'); if(btnLogout) btnLogout.addEventListener('click', ()=>{logout();});

    // Dashboard nav
    document.querySelectorAll('.nav-item').forEach(it=>it.addEventListener('click', e=>{
      document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const section = e.currentTarget.dataset.section;
      document.querySelectorAll('[id^="section-"]').forEach(s=>s.style.display='none');
      const target = el('#section-'+section);
      if(target) target.style.display='block';
    }));

    // Create group
    const createBtn = el('#create-group'); if(createBtn) createBtn.addEventListener('click', createGroup);
    const createCancel = el('#create-cancel'); if(createCancel) createCancel.addEventListener('click', ()=>{document.querySelectorAll('.nav-item')[0].click();});

    // Notes
    const uploadBtn = el('#upload-note'); if(uploadBtn) uploadBtn.addEventListener('click', uploadNote);
    const notesRefresh = el('#notes-refresh'); if(notesRefresh) notesRefresh.addEventListener('click', populateNotesGroups);

    // Group page
    const backBtn = el('#back-dashboard'); if(backBtn) backBtn.addEventListener('click', ()=>openDashboard());
    const sendChat = el('#send-chat'); if(sendChat) sendChat.addEventListener('click', sendMessageFromInput);
    const chatInput = el('#chat-input'); if(chatInput) chatInput.addEventListener('keypress', e=>{ if(e.key==='Enter') sendMessageFromInput(); });
  }

  // =====================
  // Auth functions
  // =====================
  function openAuth(mode){
    const titleNode = el('#auth-title'); if(titleNode) titleNode.textContent = mode==='signup' ? 'Sign up' : 'Log in';
    const landing = el('#page-landing'); if(landing) landing.style.display='none';
    const auth = el('#page-auth'); if(auth) auth.style.display='block';
  }
  function submitAuth(){
    const nameInput = el('#auth-name'); const emailInput = el('#auth-email'); const passInput = el('#auth-password');
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const pass = passInput ? passInput.value : '';
    if(!email || !pass){alert('Provide email and password');return}
    // Very simple local users store
    let users = JSON.parse(localStorage.getItem('study_users') || '[]');
    const exists = users.find(u=>u.email===email);
    const titleNode = el('#auth-title');
    if(titleNode && titleNode.textContent==='Sign up'){
      if(exists){alert('Account exists — log in instead');return}
      const u = {id:uid(6),name: name || email.split('@')[0], email, password: pass};
      users.push(u); localStorage.setItem('study_users', JSON.stringify(users));
      setUser({id:u.id,name:u.name,email:u.email});
      openDashboard();
    } else {
      if(!exists || exists.password !== pass){alert('Invalid credentials');return}
      setUser({id:exists.id,name:exists.name,email:exists.email});
      openDashboard();
    }
  }
  function quickSignup(){
    const demo = {id:uid(6),name:'Demo User',email:'demo@local'};
    // add to users store
    let users = JSON.parse(localStorage.getItem('study_users') || '[]');
    users = users.filter(u=>u.email!=='demo@local'); users.push({...demo,password:'demo'}); localStorage.setItem('study_users', JSON.stringify(users));
    setUser(demo); openDashboard();
  }
  function resetDemo(){
    if(!confirm('Clear all demo data stored in your browser for StudySphere?')) return;
    indexedDB.deleteDatabase(DB_NAME);
    localStorage.removeItem('study_user');
    localStorage.removeItem('study_users');
    setTimeout(()=>location.reload(),250);
  }

  // =====================
  // Header & dashboard
  // =====================
  function renderHeader(){
    const u = currentUser();
    if(u){ el('#header-user').textContent = u.name + ' • ' + u.email; const b = el('#btn-logout'); if(b) b.style.display='inline-block'; } 
    else { const hu = el('#header-user'); if(hu) hu.textContent=''; const b = el('#btn-logout'); if(b) b.style.display='none'; }
  }
  async function openDashboard(){
    renderHeader();
    showPage('#page-dashboard');
    const u = currentUser();
    el('#dash-welcome').textContent = `Welcome, ${u ? u.name : 'Guest'}`;
    el('#dash-email').textContent = u ? u.email : '';
    // default nav
    const navs = document.querySelectorAll('.nav-item'); if(navs.length>0) navs[0].click();
    await refreshGroupsList();
    populateNotesGroups();
  }

  // =====================
  // Groups
  // =====================
  async function createGroup(){
    const u = currentUser(); if(!u){alert('You must be logged in to create a group. Use Quick Signup or Sign up.'); return}
    const name = el('#grp-name').value.trim();
    const subject = el('#grp-subject').value.trim();
    const desc = el('#grp-desc').value.trim();
    if(!name) {alert('Provide group name');return}
    const group = {id:uid(7),name,subject,description:desc,members:[u.id],public:true,code:uid(5)};
    await put('groups', group);
    el('#grp-name').value=''; el('#grp-subject').value=''; el('#grp-desc').value='';
    await refreshGroupsList();
    document.querySelectorAll('.nav-item')[0].click();
    alert('Group created (local) — open it from My Groups to interact');
  }

  async function refreshGroupsList(){
    const all = await getAll('groups');
    const user = currentUser();
    const container = el('#groups-container'); if(container) container.innerHTML='';
    let my = [];
    if(user){ my = all.filter(g=>g.members && g.members.includes(user.id)); }
    if(my.length===0){ const ng = el('#no-groups'); if(ng) ng.style.display='block'; } else { const ng = el('#no-groups'); if(ng) ng.style.display='none'; }
    my.forEach(g=>{
      const div = document.createElement('div'); div.className='group-card';
      div.innerHTML = `<div style=\"display:flex;justify-content:space-between;align-items:center\"><div><strong>${g.name}</strong><div class=\"small\">${g.subject} • ${g.members.length} members</div></div><div><button data-gid=\"${g.id}\">Open</button></div></div>`;
      div.querySelector('button').addEventListener('click', ()=>openGroup(g.id));
      container.appendChild(div);
    });

    // Discover list (public groups not joined)
    const discover = el('#discover-list'); if(discover) discover.innerHTML='';
    const discoverLoginNote = el('#discover-login-note'); if(discoverLoginNote) discoverLoginNote.style.display = user ? 'none' : 'block';
    const others = user ? all.filter(g=>!(g.members || []).includes(user.id)) : all;
    others.forEach(g=>{
      const d = document.createElement('div'); d.className='group-card';
      if(user){
        d.innerHTML = `<div style=\"display:flex;justify-content:space-between;align-items:center\"><div><strong>${g.name}</strong><div class=\"small\">${g.subject} • ${g.members.length} members</div></div><div><button data-join=\"${g.id}\">Join</button></div></div>`;
        d.querySelector('button').addEventListener('click', async ()=>{ g.members = g.members || []; if(!g.members.includes(user.id)){ g.members.push(user.id); await put('groups',g); await refreshGroupsList(); alert('Joined (local)'); } });
      } else {
        d.innerHTML = `<div style=\"display:flex;justify-content:space-between;align-items:center\"><div><strong>${g.name}</strong><div class=\"small\">${g.subject} • ${g.members.length} members</div></div><div class=\"small\">(Log in to join)</div></div>`;
      }
      discover.appendChild(d);
    });
  }

  async function openGroup(gid){
    const g = await getByKey('groups', gid);
    if(!g) {alert('Group not found');return}
    // render group page
    el('#group-title').textContent = g.name;
    el('#group-sub').textContent = `${g.subject} • ${(g.members||[]).length} members`;
    el('#group-desc').textContent = g.description || '—';
    el('#group-code').textContent = g.code || '—';
    const dashboard = el('#page-dashboard'); if(dashboard) dashboard.style.display='none';
    showPage('#page-group');
    // members
    const membersNode = el('#group-members'); if(membersNode) membersNode.innerHTML = '';
    const users = JSON.parse(localStorage.getItem('study_users') || '[]');
    (g.members || []).forEach(mid => {
      const uu = users.find(u=>u.id===mid);
      const name = uu ? uu.name : mid;
      const div = document.createElement('div'); div.textContent = name; if(membersNode) membersNode.appendChild(div);
    });
    // notes
    const notes = (await getAll('notes')).filter(n=>n.groupId===gid);
    renderNotesList(notes, el('#group-notes'));
    // messages
    renderMessagesForGroup(gid);
    // attach leave
    const leaveBtn = el('#leave-group');
    if(leaveBtn){
      leaveBtn.onclick = async ()=>{
        const u = currentUser(); if(!u){alert('You must be logged in to leave a group.'); return}
        if(!confirm('Leave this group?')) return;
        g.members = (g.members || []).filter(x=>x!==u.id); await put('groups',g); openDashboard();
      }
    }
  }

  // =====================
  // Notes
  // =====================
  function populateNotesGroups(){
    getAll('groups').then(all=>{
      const sel = el('#notes-group'); if(!sel) return; sel.innerHTML='';
      all.forEach(g=>{
        const opt = document.createElement('option'); opt.value = g.id; opt.textContent = g.name; sel.appendChild(opt);
      });
    });
  }

  async function uploadNote(){
    const u = currentUser(); if(!u){alert('You must be logged in to upload notes.'); return}
    const gidNode = el('#notes-group'); const gid = gidNode ? gidNode.value : null; if(!gid){alert('Choose a group');return}
    const titleNode = el('#note-title'); const title = titleNode ? titleNode.value.trim() : 'Untitled';
    const fileInput = el('#note-file'); if(!fileInput || fileInput.files.length===0){alert('Choose a file');return}
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async (e)=>{
      const blob = new Blob([e.target.result], {type:file.type});
      const note = {id:uid(9),groupId:gid,title,filename:file.name,uploadedBy:u.id,createdAt:Date.now(),fileBlob:blob};
      await put('notes', note);
      fileInput.value=''; if(titleNode) titleNode.value='';
      alert('Note saved locally in IndexedDB');
    };
    reader.readAsArrayBuffer(file);
  }

  function renderNotesList(notes, container){
    if(!container) return;
    container.innerHTML='';
    if(!notes || notes.length===0) {container.textContent='No notes yet'; return}
    notes.forEach(n=>{
      const d = document.createElement('div'); d.style.marginBottom='8px';
      const date = new Date(n.createdAt).toLocaleString();
      d.innerHTML = `<div style=\"display:flex;justify-content:space-between;align-items:center\"><div><strong>${n.title}</strong><div class=\"small\">${n.filename} • ${date}</div></div><div><button data-download=\"${n.id}\">Download</button></div></div>`;
      d.querySelector('button').addEventListener('click', async ()=>{
        // re-open note from db and download
        const rec = await getByKey('notes', n.id);
        if(rec && rec.fileBlob){
          const url = URL.createObjectURL(rec.fileBlob);
          const a = document.createElement('a'); a.href = url; a.download = rec.filename; a.click(); URL.revokeObjectURL(url);
        } else alert('File not found (this would normally be on server)');
      });
      container.appendChild(d);
    });
  }

  // =====================
  // Messages (local only)
  // =====================
  async function sendMessageFromInput(){
    const u = currentUser(); if(!u){alert('You must be logged in to send messages.'); return}
    const chatInput = el('#chat-input'); const text = chatInput ? chatInput.value.trim() : '';
    if(!text) return;
    const gid = (await currentOpenGroupId()); if(!gid) return;
    const msg = {id:uid(10),groupId:gid,from:u.id,text,ts:Date.now()};
    await put('messages', msg);
    if(chatInput) chatInput.value='';
    renderMessagesForGroup(gid);
  }
  async function renderMessagesForGroup(groupId){
    const all = await getAll('messages');
    const msgs = (all || []).filter(m=>m.groupId===groupId).sort((a,b)=>a.ts-b.ts);
    const container = el('#messages'); if(!container) return; container.innerHTML='';
    msgs.forEach(m=>{
      const div = document.createElement('div'); div.className='msg '+(m.from=== (currentUser() && currentUser().id) ? 'me':'them');
      const users = JSON.parse(localStorage.getItem('study_users')||'[]');
      const name = (users.find(u=>u.id===m.from) || {name:m.from}).name;
      div.innerHTML = `<div style=\"font-weight:600;font-size:13px\">${name}</div><div style=\"margin-top:6px;white-space:pre-wrap\">${m.text}</div><div class=\"small\" style=\"margin-top:6px;text-align:right\">${new Date(m.ts).toLocaleTimeString()}</div>`;
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  }

  async function currentOpenGroupId(){
    const titleNode = el('#group-title'); const title = titleNode ? titleNode.textContent : '';
    const all = await getAll('groups');
    const g = (all || []).find(x=>x.name===title);
    return g? g.id : null;
  }

  // =====================
  // Seed some discover groups for demo
  // =====================
  async function seedDiscover(){
    const all = await getAll('groups');
    if(all && all.length>0) return; // already seeded
    const sample = [
      {id:uid(7),name:'Calculus Study Group',subject:'Mathematics',description:'Weekly calculus exercises',members:[],public:true,code:uid(5)},
      {id:uid(7),name:'Organic Chemistry Notes',subject:'Chemistry',description:'Share practice problems and notes',members:[],public:true,code:uid(5)},
      {id:uid(7),name:'History Discussion',subject:'History',description:'Discuss topics and share resources',members:[],public:true,code:uid(5)}
    ];
    for(const g of sample) await put('groups', g);
    // Only refresh lists if the UI is ready; refreshGroupsList handles absence of user safely
    await refreshGroupsList();
  }