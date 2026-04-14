<template>
    <div v-if="visible" class="modal">
      <div class="modal-content">
        <h2>Sign Up to Save Progress</h2>
        <p>You can dismiss this or create an account to save and sync your game across devices. Currently sync will happen only on log out.</p>
  
        <input v-model="email" type="email" placeholder="Email" />
        <input v-model="password" type="password" placeholder="Password" />
        <div class="button-column">
            <button class="modal-button" @click="dismiss">Maybe Later</button>
            <button class="modal-button" @click="signUp">Sign Up</button>
            <button class="modal-button" @click="login">Log In</button>
        </div>
  
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
  import { auth } from "../main.js"
// import { syncFromDB, syncStatsFromDB } from "../syncUserState.js";
  
  const emit = defineEmits(["close", "loggedIn"]);
  
  const visible = ref(true);
  const email = ref("");
  const password = ref("");
  const error = ref("");
  
  const dismiss = () => {
    localStorage.setItem("userAgreed", true);
    visible.value = false;
    emit("close");
  };
  
  const signUp = async () => {
    error.value = "";
    if (!email.value || !password.value) {
        error.value = "Email and password are required.";
        return;
    }
    if (password.value.length < 6) {
        error.value = "Password must be at least 6 characters.";
        return;
    }
    try {
        await createUserWithEmailAndPassword(auth, email.value, password.value);
        localStorage.setItem("userAgreed", true);
        visible.value = false;
        emit("close");
    } catch (err) {
        error.value = err.message;
    }
    };

    const login = async () => {
    error.value = "";
    if (!email.value || !password.value) {
        error.value = "Email and password are required.";
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, email.value, password.value);
        // syncFromDB(auth.currentUser.uid)
        // syncStatsFromDB(auth.currentUser.uid)
        localStorage.setItem("userAgreed", true);
        visible.value = false;
        emit("loggedIn");
        // window.location.reload();
    } catch (err) {
        error.value = err.message;
    }

    };
  </script>
  
  <style scoped>
  .modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }
  
  /* Modal Content */
  .modal-content {
    background-color: #1a1a1a;
    font-family: 'Press Start 2P', cursive;
    color: #fff;
    padding: 24px;
    border-radius: 12px;
    width: 90%;
    max-width: 420px;
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.25);
    display: flex;
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .modal-content h2 {
    font-size: 16px;
    margin-bottom: 8px;
  }
  
  .modal-content p {
    font-size: 10px;
    line-height: 1.6;
    color: #ccc;
  }
  
  .button-column {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }
  /* Inputs */
  input {
    padding: 10px;
    font-size: 10px;
    font-family: inherit;
    border: none;
    border-radius: 6px;
    background-color: #2d2d2d;
    color: white;
    text-align: center;
  }
  
  input::placeholder {
    color: #777;
  }
  
  /* Buttons */
  .modal-button {
    padding: 10px 12px;
    font-size: 10px;
    font-family: inherit;
    border-radius: 6px;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    width: fit-content;
    align-self: center;
  }
  

  
  .error {
    color: #ff5f5f;
    font-size: 8px;
    margin-top: -4px;
  }
  @media (max-width: 600px) {
    .modal-content {
      width: 95%;
      padding: 20px;
      font-size: 8px;
    }
  
    input {
      padding: 8px;
      font-size: 9px;
    }
  
    .modal-button {
      font-size: 9px;
      padding: 8px 10px;
    }
  
    .modal-content h2 {
      font-size: 14px;
    }
  
    .modal-content p {
      font-size: 9px;
    }
  }


  </style>