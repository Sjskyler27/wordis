<template>
  <div class="modal">
    <div class="modal-content">
            
      <div class="close-modal">
      <button ref="button1"class="modal-button" @click="close">&times;</button>
      </div>
      <h2>Thank You For Playing Dungeon Draft!</h2>

      <p>
        First and foremost I would like to thank my wife for her patience with me as I have made this game. 
        I would especially like to thank her for the 100+ hours of play testing and being Dungeon Drafts biggest fan. 
      </p>
      <p>
        Thank you Codex for all of your contributions, feedback, and for many great character ideas! 
      </p>
      <p>
        Thank you Myla for your UI/UX and Artistic feedback!
      </p>

      <p>Thanks you for giving Dungeon Draft a chance, I hope you enjoy playing as much as I enjoyed creating it!</p>
    </div>
  </div>
</template>


<script setup>
import { ref, defineProps, defineEmits, onMounted } from "vue";
const button1 = ref()
onMounted(() => {
  button1?.value?.focus();
});

// Emits event to close the modal
const emit = defineEmits(["close"]);
const close = () => emit("close");
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
.modal-modal{
  justify-content: left;
}
h2{
  margin-top: 30px;
  font-size: 17px;
  text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.8);
  justify-self: center;
}

.modal-content{
  max-width: 1200px;
  max-height: 900px;
  overflow-y: auto;
  text-align: left;
  text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.8);
}
.emoji {
  width: 30px;
  height: auto;
}
p{
  line-height: 1.5;
  margin-bottom: 40px;
}
ul{
  text-align:left;
  font-size: 16px;
  line-height: 1.5;
}


/* Mobile Adjustments */
@media (max-width: 1230px) {
  h1 {
    font-size: 16px;
    
  }
  .modal-content{
    max-width: 500px;
    max-height: 90vh;
    
  }
  p {
    line-height: 1.2;
    font-size: 12px;
  }
  .emoji {
   width: 20px;
  }
}

/* Mobile Adjustments */
@media (max-width: 600px) {
  .modal-content {
    width: 95%;
    padding: 15px;
  }

  h2, p {
    font-size: 11px;
  }
  ul{
    font-size: 11px;
  }

  .emoji {
    height: 15px;
    width: auto;
  }
}
</style>