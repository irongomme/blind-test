<template>
  <q-dialog
    id="dialog-finale"
    class="bg-dark"
    ref="dialog-success-finale"
    maximized
    auto-close
    v-model="opened"
    transition-show="fade"
    transition-hide="fade"
    @hide="clearTimer()"
    @before-show="showSuccess()">
    <q-card style="width: 640px;height: 500px;">
      <q-card-section :class="`text-center text-h2 text-bold text-${matchTeam.color}`">
        {{ matchTeam.team.name }}
      </q-card-section>
      <q-card-section>
        <q-img
          style="height: 300px;"
          contain
          :src="`statics/avatars/${matchTeam.team.avatar}`">
        </q-img>
      </q-card-section>
      <q-card-section :class="`text-center text-h2 text-${matchTeam.color}`">
        {{ global.finalFrenchPosition[matchTeam.team.rank - 1] }}
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { global } from '@utils/global.js';

export default {
  name: 'DialogSuccessFinale',
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
      global,
    };
  },
  methods: {
    showSuccess() {
      // Timer
      this.timer = setTimeout(
        () => { this.$refs['dialog-success-finale'].hide(); }, this.duration,
      );
    },
    clearTimer() {
      clearTimeout(this.timer);
    },
  },
  computed: {
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

<style lang="scss">
  #dialog-finale {
    background: url('~assets/finale.gif') no-repeat center;
    background-size: cover;
  }
</style>
