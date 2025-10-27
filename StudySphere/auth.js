// auth.js
// import { auth } from './firebaseConfig.js';
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut,
//   onAuthStateChanged,
//   GoogleAuthProvider,
//   signInWithPopup,
//   updateProfile
// } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
// import { auth, db, storage, rtdb } from './firebaseConfig.js';


const landing = document.getElementById('landing');
const authSection = document.getElementById('auth');
const dashboardSection = document.getElementById('dashboard');
const userControls = document.getElementById('user-controls');

const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');

// buttons
document.getElementById('btn-show-signup').addEventListener('click', () => showAuthForm('signup'));
document.getElementById('btn-show-login').addEventListener('click', () => showAuthForm('login'));
document.querySelectorAll('.btn-back').forEach(b=>b.addEventListener('click', () => showView('landing')));

document.getElementById('btn-signup').addEventListener('click', handleSignUp);
document.getElementById('btn-login').addEventListener('click', handleLogin);
document.getElementById('btn-logout').addEventListener('click', () => signOut(auth));

document.getElementById('btn-google-signup').addEventListener('click', ()=>googleSignIn());
document.getElementById('btn-google-login').addEventListener('click', ()=>googleSignIn());

function showView(id){
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function showAuthForm(which){
  showView('auth');
  signupForm.classList.add('hidden');
  loginForm.classList.add('hidden');
  if(which === 'signup') signupForm.classList.remove('hidden');
  else loginForm.classList.remove('hidden');
}

async function handleSignUp(){
  const name = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const password = document.getElementById('su-password').value;

  if(!email || !password || !name) return alert('Fill all fields');
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCred.user, { displayName: name });
    // onAuthStateChanged will handle UI transition
  } catch (err) {
    alert(err.message);
  }
}

async function handleLogin(){
  const email = document.getElementById('li-email').value.trim();
  const password = document.getElementById('li-password').value;
  if(!email || !password) return alert('Fill all fields');
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    alert(err.message);
  }
}

async function googleSignIn(){
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    alert(err.message);
  }
}

// Observe auth state
onAuthStateChanged(auth, user => {
  if(user){
    // show dashboard
    userControls.innerHTML = `<strong>${user.displayName || user.email}</strong>`;
    showView('dashboard');
    // let dashboard.js handle rendering user-specific data via auth.currentUser
    window.dispatchEvent(new Event('user-logged-in'));
  } else {
    userControls.innerHTML = '';
    showView('landing');
    window.dispatchEvent(new Event('user-logged-out'));
  }
});
