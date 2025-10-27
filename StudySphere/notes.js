// notes.js
import { auth, db, storage } from './firebaseConfig.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { collection, addDoc, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { auth, db, storage, rtdb } from './firebaseConfig.js';


document.getElementById('btn-upload-note').addEventListener('click', uploadNote);
window.addEventListener('group-opened', loadNotes);

async function uploadNote(){
  const user = auth.currentUser;
  if(!user) return alert('Not logged in');
  const groupId = window.currentGroupId;
  if(!groupId) return alert('Open a group first');

  const fileInput = document.getElementById('note-file');
  const title = document.getElementById('note-title').value.trim();
  const desc = document.getElementById('note-desc').value.trim();
  if(!fileInput.files.length) return alert('Choose a file');
  const file = fileInput.files[0];

  try{
    const filePath = `notes/${groupId}/${Date.now()}_${file.name}`;
    const sRef = storageRef(storage, filePath);
    await uploadBytes(sRef, file);
    const url = await getDownloadURL(sRef);

    // save metadata in Firestore
    await addDoc(collection(db, 'notes'), {
      groupId, title: title || file.name, description: desc, fileName: file.name, url,
      uploadedBy: user.uid, uploadedAt: new Date()
    });
    alert('Uploaded successfully');
    loadNotes();
  }catch(err){
    alert(err.message);
  }
}

async function loadNotes(){
  const groupId = window.currentGroupId;
  if(!groupId) return;
  const notesList = document.getElementById('notes-list');
  notesList.innerHTML = 'Loading...';
  try{
    const notesRef = collection(db,'notes');
    const q = query(notesRef, where('groupId','==',groupId), orderBy('uploadedAt','desc'));
    const snap = await getDocs(q);
    notesList.innerHTML = '';
    if(snap.empty) notesList.innerHTML = '<li>No notes yet.</li>';
    snap.forEach(docSnap=>{
      const n = docSnap.data();
      const li = document.createElement('li');
      li.innerHTML = `<strong>${n.title}</strong> — ${n.fileName} 
        <a href="${n.url}" target="_blank" rel="noopener noreferrer">Download</a>`;
      notesList.appendChild(li);
    });
  }catch(err){ notesList.innerHTML = 'Error loading notes'; console.error(err); }
}
