<template>
  <div class="modal animated-fade-in">
    <div class="modal-content animated-slide-up">
      <div class="close-modal">
      <button ref="button1" class="modal-button" @click="close">&times;</button>
      </div>
      <h1>Submit Feedback</h1>
      <p>Have suggestions or found a bug? Let us know!</p>

      <form @submit.prevent="submitFeedback">
      <input type="text" v-model="name" placeholder="Your Name" required />

      
      <textarea v-model="message" placeholder="Your Feedback" required></textarea>
      <div class="radio-container">
        <div class="feedback-type">
          <label><input type="radio" v-model="type" value="Bug" /><span> Bug</span></label>
          <label><input type="radio" v-model="type" value="Feature" /><span> Feature</span></label>
          <label><input type="radio" v-model="type" value="Other" /><span> Other</span></label>
          <input
            v-if="type === 'Other'"
            v-model="customType"
            type="text"
            placeholder="Enter custom type"
            class="custom-type"
          />
        </div>

        <div class="feedback-type">
          <label>
            <input
              type="radio"
              v-model="priority"
              value="low"
              title="Cosmetic or typo related"
            />
            <span>Low</span>
          </label>
          <label>
            <input
              type="radio"
              v-model="priority"
              value="medium"
              title="Affects gameplay in a minor way but easily resolvable"
            />
            <span>Medium</span>
          </label>
          <label>
            <input
              type="radio"
              v-model="priority"
              value="urgent"
              title="Breaks or crashes the game, needs immediate attention"
            />
            <span>Urgent</span>
          </label>
        </div>
      </div>

      <button type="submit" class="modal-button">{{ loading ? "Submitting..." : "Submit" }}</button>

      <p v-if="successMessage" class="success">{{ successMessage }}</p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, onMounted } from "vue";
import { db } from "../../main.js";
import { push, ref as dbRef } from "firebase/database";
import { firebaseEnabled } from "../../firebaseClient.js";

console.log('show feedback');

const button1 = ref();
onMounted(() => {
  button1?.value?.focus();
});

const emit = defineEmits(["close"]);

const name = ref("");
const message = ref("");
const type = ref("Bug");        // default selection
const customType = ref("");     // input if "Other" selected
const priority = ref("low");    // default priority
const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

const submitFeedback = async () => {
  loading.value = true;
  successMessage.value = "";
  errorMessage.value = "";
  if (name.value === "") name.value = "Anonymous";

  const finalType = type.value === "Other" && customType.value
    ? customType.value
    : type.value;

  try {
    if (!firebaseEnabled || !db) {
      throw new Error("Feedback is unavailable right now.");
    }

    const feedbackRef = dbRef(db, "feedback");
    await push(feedbackRef, {
      name: name.value,
      message: message.value,
      type: finalType,
      priority: priority.value,
      timestamp: Date.now()
    });

    successMessage.value = "Feedback submitted! Thanks!";
    name.value = "";
    message.value = "";
    type.value = "Bug";
    customType.value = "";
    priority.value = "low";
    setTimeout(() => {
    successMessage.value = "";
    errorMessage,value = "";
  }
    , 1500);
  } catch (error) {
    errorMessage.value = firebaseEnabled
      ? "Feedback could not be submitted right now."
      : "Feedback is unavailable while Firebase is disabled.";
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const close = () => emit("close");
</script>

<style scoped>
/* Modal Overlay */
.modal {
  visibility: hidden;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

/* Modal Content */
.modal-content {
  visibility: hidden;
  font-family: 'Press Start 2P', cursive;
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  max-width: 600px;
  width: 80%;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  position: relative;
}
.radio-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 20%;
}
.feedback-type label{
  width: 50%;
  gap: 5px;
  display: flex;
  align-items: center;
  justify-content: left;
  margin-bottom: 10px;
}
.feedback-type input[type="radio"] {
  width: 20px;
}



/* Form Inputs */
input, textarea {
  width: 100%;
  padding: 8px;
  font-size: 14px;
  border-radius: 5px;
  margin-bottom: 10px;
}

/* Success and Error Messages */
.success {
  color: #0f0;
  font-size: 14px;
}

.error {
  color: #f00;
  font-size: 14px;
}

</style>
