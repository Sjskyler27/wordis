<template>
    <div v-if="visible" class="modal animated-fade-in">
      <div class="modal-content animated-slide-up">
        <div class="close-modal">
          <button ref="closeButton" class="modal-close-button" @click="dismiss">&times;</button>
        </div>
        <h2>Save Progress</h2>
        <p>You can create an account to save and sync your game across devices.</p>
  
        <div class="modal-actions">
          <div class="text-inputs">
            <input ref="emailInput" v-model="email" type="email" placeholder="Email" />
            <input ref="passwordInput" v-model="password" type="password" placeholder="Password" />
          </div>
          <div class="button-column">
            <button ref="dismissButton" class="modal-button quiet" @click="dismiss">Maybe Later</button>
            <button ref="signUpButton" class="modal-button" @click="signUp">Sign Up</button>
            <button ref="loginButton" class="modal-button primary" @click="login">Log In</button>
          </div>
        </div>
  
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { onBeforeUnmount, onMounted, ref } from "vue";
  import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
  import { auth } from "../main.js"
  import { firebaseEnabled } from "../firebaseClient.js";
  import { initializeNewUser } from "../userstate/initializeNewUser.js";
// import { syncFromDB, syncStatsFromDB } from "../syncUserState.js";
  
  const emit = defineEmits(["close", "loggedIn"]);
  
  const visible = ref(true);
  const email = ref("");
  const password = ref("");
  const error = ref("");
  const closeButton = ref(null);
  const emailInput = ref(null);
  const passwordInput = ref(null);
  const dismissButton = ref(null);
  const signUpButton = ref(null);
  const loginButton = ref(null);
  const focusTargets = [
    closeButton,
    emailInput,
    passwordInput,
    dismissButton,
    signUpButton,
    loginButton
  ];
  const focusTarget = (index) => {
    const availableTargets = focusTargets.filter((target) => target.value);
    const targetIndex = (index + availableTargets.length) % availableTargets.length;
    availableTargets[targetIndex]?.value?.focus();
  };
  
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
        if (!firebaseEnabled || !auth) {
            throw new Error("Account features are unavailable right now.");
        }
        const credential = await createUserWithEmailAndPassword(auth, email.value, password.value);
        await initializeNewUser(credential.user);
        localStorage.setItem("userAgreed", true);
        visible.value = false;
        emit("loggedIn");
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
        if (!firebaseEnabled || !auth) {
            throw new Error("Account features are unavailable right now.");
        }
        await signInWithEmailAndPassword(auth, email.value, password.value);
        localStorage.setItem("userAgreed", true);
        visible.value = false;
        emit("loggedIn");
        // window.location.reload();
    } catch (err) {
        error.value = err.message;
    }

    };

  const handleKeyDown = (event) => {
    if (event.key === "Escape" || event.key === "b") {
      event.preventDefault();
      dismiss();
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }

    const availableTargets = focusTargets.filter((target) => target.value);
    const currentIndex = availableTargets.findIndex((target) => target.value === document.activeElement);
    const nextIndex = event.key === "ArrowDown" ? currentIndex + 1 : currentIndex - 1;
    event.preventDefault();
    focusTarget(currentIndex === -1 ? 0 : nextIndex);
  };

  onMounted(() => {
    emailInput.value?.focus();
    window.addEventListener("keydown", handleKeyDown);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleKeyDown);
  });
  </script>
  
  <style scoped>
  .modal {
    visibility: hidden;
    position: fixed;
    inset: 0;
    background:
      radial-gradient(circle at 22% 18%, rgba(255, 203, 121, 0.18), transparent 32%),
      rgba(15, 6, 20, 0.74);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 18px;
  }
  
  .modal-content {
    visibility: hidden;
    position: relative;
    background:
      linear-gradient(180deg, rgba(78, 25, 43, 0.97), rgba(42, 15, 40, 0.97)),
      radial-gradient(circle at 18% 0%, rgba(255, 202, 123, 0.2), transparent 38%);
    font-family: 'Press Start 2P', cursive;
    color: #fff4df;
    padding: 34px;
    border: 1px solid rgba(255, 231, 190, 0.24);
    border-radius: 22px;
    width: min(92vw, 620px);
    max-height: 86vh;
    overflow-y: auto;
    box-shadow:
      inset 0 1px 0 rgba(255, 238, 205, 0.14),
      0 24px 54px rgba(23, 8, 25, 0.46);
    display: flex;
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .close-modal {
    position: absolute;
    top: 18px;
    left: 18px;
  }
  
  .modal-content h2 {
    margin: 0 52px 8px;
    color: #fff2ce;
    font-size: 1.05rem;
    line-height: 1.5;
    letter-spacing: 0;
    text-shadow: 0 3px 0 rgba(41, 10, 22, 0.34);
  }
  
  .modal-content p {
    margin: 0;
    font-size: 0.68rem;
    line-height: 1.6;
    color: rgba(255, 244, 223, 0.78);
  }
  
  .text-inputs {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 15px;
  }
  .button-column {
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
    width: min(280px, 100%);
    margin: 0 auto;
  }

  input {
    width: min(320px, 100%);
    padding: 13px 14px;
    font-size: 0.66rem;
    line-height: 1.4;
    font-family: inherit;
    border: 1px solid rgba(255, 225, 180, 0.18);
    border-radius: 12px;
    background: rgba(28, 10, 28, 0.46);
    color: #fff4df;
    text-align: center;
    outline: none;
    margin: 0 auto;
  }
  
  input::placeholder {
    color: rgba(255, 244, 223, 0.42);
  }

  input:focus,
  input:focus-visible,
  .modal-button:focus-visible,
  .modal-close-button:focus-visible {
    outline: 3px solid rgba(130, 253, 238, 0.72);
    outline-offset: 2px;
  }
  
  .modal-button,
  .modal-close-button {
    font-family: inherit;
    border: 1px solid rgba(255, 230, 190, 0.16);
    color: rgba(255, 244, 223, 0.86);
    cursor: pointer;
    transition: background 140ms ease, border-color 140ms ease, color 140ms ease, transform 140ms ease;
  }

  .modal-button {
    width: min(260px, 100%);
    padding: 12px 14px;
    border-radius: 12px;
    background: rgba(255, 245, 224, 0.08);
    font-size: 0.66rem;
    line-height: 1.4;
  }

  .modal-close-button {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(32, 10, 24, 0.74);
    color: #fff2ce;
    font-size: 1.25rem;
    line-height: 1;
  }

  .modal-button:hover,
  .modal-close-button:hover {
    background: rgba(67, 21, 45, 0.86);
    border-color: rgba(255, 226, 177, 0.34);
    color: #fff4df;
  }

  .modal-button.primary {
    background: linear-gradient(180deg, rgba(83, 216, 194, 0.94), rgba(21, 151, 128, 0.92));
    color: #fff4df;
  }

  .modal-button.quiet {
    color: rgba(255, 244, 223, 0.68);
  }
  

  
  .error {
    color: #ff9b9b;
    font-size: 0.58rem;
    line-height: 1.5;
    margin: 0;
  }
  @media (max-width: 600px) {
    .modal-content {
      padding: 26px 18px 22px;
    }
  
    input {
      font-size: 0.58rem;
    }
  
    .modal-button {
      font-size: 0.58rem;
    }
  
    .modal-content h2 {
      font-size: 0.86rem;
    }
  
    .modal-content p {
      font-size: 0.58rem;
    }
  }


  </style>
