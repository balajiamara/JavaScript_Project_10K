// group.js
import { auth, db } from './firebaseConfig.js';
import { collection, addDoc, doc, updateDoc, arrayUnion, getDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { openGroupUI } from './dashboard.js';

document.getElementById('btn-create').addEventListener('click', createGroup);
document.getElementById('btn-join').addEventListener('click', joinGroup);

function genCode(len=6){
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for(let i=0;i<len;i++) code += chars[Math.floor(Math.random()*chars.length)];
  return code;
}

async function createGroup(){
  const name = document.getElementById('group-name').value.trim();
  const subject = document.getElementById('group-subject').value.trim();
  const desc = document.getElementById('group-desc').value.trim();
  const user = auth.currentUser;
  if(!user) return alert('Not logged in');
  if(!name || !subject) return alert('Provide name and subject');

  const code = genCode();
  try{
    const groupsRef = collection(db, 'groups');
    const docRef = await addDoc(groupsRef, {
      name, subject, description: desc, code,
      createdBy: user.uid,
      members: [user.uid],
      createdAt: new Date()
    });
    document.getElementById('create-group-result').textContent = `Group created! Code: ${code}`;
    // open UI
    openGroupUI(docRef.id, {name,subject,code,description:desc});
  }catch(err){
    alert(err.message);
  }
}

async function joinGroup(){
  const code = document.getElementById('join-code').value.trim();
  const user = auth.currentUser;
  if(!user) return alert('Not logged in');
  if(!code) return alert('Provide code');

  try{
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('code', '==', code));
    const snap = await getDocs(q);
    if(snap.empty) return document.getElementById('join-result').textContent = 'No group with this code.';
    const gdoc = snap.docs[0];
    const gid = gdoc.id;
    // add current user to members
    await updateDoc(doc(db,'groups',gid), { members: arrayUnion(user.uid) });
    document.getElementById('join-result').textContent = 'Joined group!';
    openGroupUI(gid, gdoc.data());
  }catch(err){
    alert(err.message);
  }
}
