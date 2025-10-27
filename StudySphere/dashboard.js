// dashboard.js
import { auth, db } from './firebaseConfig.js';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const groupsList = document.getElementById('groups-list');
const dashboardInfo = document.getElementById('dashboard-info');

document.getElementById('btn-create-group').addEventListener('click', ()=>showView('create-group'));
document.getElementById('btn-join-group').addEventListener('click', ()=>showView('join-group'));

document.getElementById('btn-open-notes').addEventListener('click', ()=>alert('Open a group to view notes.'));
document.getElementById('btn-open-chat').addEventListener('click', ()=>alert('Open a group to chat.'));

window.addEventListener('user-logged-in', loadUserGroups);
window.addEventListener('user-logged-out', () => groupsList.innerHTML = '');

async function loadUserGroups(){
  const user = auth.currentUser;
  if(!user) return;
  dashboardInfo.textContent = `Hello, ${user.displayName || user.email}`;
  // Query groups where members array contains user.uid
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, where('members', 'array-contains', user.uid));
  const snap = await getDocs(q);
  groupsList.innerHTML = '';
  snap.forEach(docSnap => {
    const g = docSnap.data();
    const li = document.createElement('li');
    li.textContent = `${g.name} (${g.subject})`;
    li.dataset.groupId = docSnap.id;
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => openGroup(docSnap.id));
    groupsList.appendChild(li);
  });
}

// helper to show named view
function showView(id){
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// Called by group.js after creating/joining
export function openGroupUI(groupId, groupData){
  showView('group-details');
  document.getElementById('group-title').textContent = groupData.name;
  document.getElementById('group-meta').textContent = `Subject: ${groupData.subject} — Code: ${groupData.code}`;
  // set a global current group id for other modules
  window.currentGroupId = groupId;
  window.currentGroup = groupData;
  // load notes & chat
  window.dispatchEvent(new Event('group-opened'));
}

async function openGroup(groupId){
  // fetch group data and then call openGroupUI
  const gdoc = doc(db, 'groups', groupId);
  const snap = await gdoc.get?.() /* older SDK check */; // fallback in case
  // use onSnapshot instead:
  import("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js").then(fb => {
    fb.getDoc(gdoc).then(res=>{
      if(!res.exists()) return alert('Group not found');
      openGroupUI(groupId, res.data());
    });
  });
}
