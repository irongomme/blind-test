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
      <q-card-section class="text-h3 text-center q-py-xl">
        <q-icon name="fas fa-star q-mr-lg" style="margin-bottom:22px;" />
        Point pour
        <span :class="'text-uppercase text-' + teamColor">
          {{ teamName }}
        </span>
        <q-icon name="fas fa-star q-ml-lg" style="margin-bottom:22px;" />
      </q-card-section>
      <q-card-section class="flex flex-center">
        <img
          contain
          :src="successImage"
          class="rounded-borders"
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
    },
    matchTeam: Object,
  },
  data() {
    return {
      duration: 8000,
      timer: false,
      teamColor: '',
      teamName: '',
      successImage: '',
    };
  },
  methods: {
    showSuccess() {
      // Attribution des differentes valeurs pour la popup
      this.successImage = '/statics/success/';
      this.successImage += this.animatedSucess[
        Math.floor(Math.random() * this.animatedSucess.length)
      ];
      this.teamColor = this.matchTeam.color;
      this.teamName = this.matchTeam.team.name;
      // Timer
      this.timer = setTimeout(() => { this.$refs['dialog-success'].hide(); }, this.duration);
    },
    clearTimer() {
      clearTimeout(this.timer);
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
