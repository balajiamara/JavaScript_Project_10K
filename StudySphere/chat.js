// chat.js
// import { auth, rdb } from './firebaseConfig.js';
// import { ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
// import { auth, db, storage, rtdb } from './firebaseConfig.js';
// import { auth, db, rdb, storage, rtdb } from './firebaseConfig.js';
// import { ref, push, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
// import { auth, rdb } from './firebaseConfig.js';
// import { ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";



const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
document.getElementById('btn-send-chat').addEventListener('click', sendChat);
window.addEventListener('group-opened', subscribeChat);

let chatRef = null;

function formatMessage(msg){
  const div = document.createElement('div');
  div.className = 'message';
  div.textContent = `${msg.senderName || 'User'}: ${msg.text}`;
  return div;
}

function subscribeChat(){
  const groupId = window.currentGroupId;
  if(!groupId) return;
  if(chatRef) chatRef.off?.();
  chatRef = ref(rdb, `chats/${groupId}`);
  onValue(chatRef, snapshot => {
    chatBox.innerHTML = '';
    const data = snapshot.val() || {};
    const keys = Object.keys(data);
    keys.forEach(k=>{
      const message = data[k];
      chatBox.appendChild(formatMessage(message));
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

async function sendChat(){
  const user = auth.currentUser;
  if(!user) return alert('Log in to send messages');
  const groupId = window.currentGroupId;
  if(!groupId) return alert('Open a group first');
  const text = chatInput.value.trim();
  if(!text) return;
  const messageRef = ref(rdb, `chats/${groupId}`);
  await push(messageRef, {
    text,
    senderId: user.uid,
    senderName: user.displayName || user.email,
    ts: Date.now()
  });
  chatInput.value = '';
}
