<template>
  <q-dialog
    ref="dialog-success"
    maximized
    auto-close
    v-model="opened"
    transition-show="fade"
    transition-hide="fade"
    @hide="clearTimer()"
    @before-show="showSuccess()">
    <q-card dark style="overflow: hidden;">
      <q-card-section v-show="!teamDisplay" style="height: 178px;" />
      <transition-group
      appear
      enter-active-class="animated swing">
        <q-card-section
          :class="`text-h2 text-center q-py-xl text-${teamColor}`"
          v-show="teamDisplay"
          key="team-name-section">
          <q-icon name="fas fa-star q-mr-lg" style="margin-bottom:22px;" />
          Point pour
          <span class="text-uppercase text-bold">
            {{ teamName }}
          </span>
          <q-icon name="fas fa-star q-ml-lg" style="margin-bottom:22px;" />
        </q-card-section>
      </transition-group>

      <q-card-section class="flex flex-center">
        <img
          contain
          :src="successImage"
          class="rounded-borders shadow-8"
          style="height: 80vh;" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import AnimatedSuccess from '@json/animated_success.json';

export default {
  name: 'DialogSuccess',
  props: {
    value: {
      type: Boolean,
      required: true,
      default: false,
    },
    matchTeam: Object,
  },
  data() {
    return {
      duration: 80000,
      timerDialog: false,
      timerTeam: false,
      teamDisplay: false,
      teamColor: '',
      teamName: '',
      successImage: '',
    };
  },
  methods: {
    showSuccess() {
      const randomAnimation = this.animatedSucess[
        Math.floor(Math.random() * this.animatedSucess.length)
      ];

      // Attribution des differentes valeurs pour la popup
      this.teamColor = this.matchTeam.color;
      this.successImage = `statics/success/${randomAnimation}`;
      this.teamName = this.matchTeam.team.name;

      // Puis on retarde l'affichage
      this.timerTeam = setTimeout(() => { this.teamDisplay = true; }, 500);

      // Timer
      this.timerDialog = setTimeout(() => { this.opened = false; }, this.duration);
    },
    clearTimer() {
      clearTimeout(this.timerDialog);
      clearTimeout(this.timerTeam);
      this.teamDisplay = false;
    },
  },
  computed: {
    animatedSucess: () => AnimatedSuccess,
    opened: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit('input', value);
      },
    },
  },
};
</script>
