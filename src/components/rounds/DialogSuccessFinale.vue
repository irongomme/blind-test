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
      <q-card-section :class="`text-center text-h2 text-bold text-${teamColor}`">
        {{ teamName }}
      </q-card-section>
      <q-card-section>
        <q-img
          style="height: 300px;"
          contain
          :src="`statics/avatars/${teamAvatar}`">
        </q-img>
      </q-card-section>
      <q-card-section :class="`text-center text-h2 text-${teamColor}`">
        {{ global.finalFrenchPosition[teamRank] }}
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
      default: false,
    },
    matchTeam: Object,
  },
  data() {
    return {
      teamColor: '',
      teamName: '',
      teamAvatar: '',
      teamRank: '',
      duration: 8000,
      timer: false,
      global,
    };
  },
  methods: {
    showSuccess() {
      this.teamColor = this.matchTeam.color;
      this.teamName = this.matchTeam.team.name;
      this.teamAvatar = this.matchTeam.team.avatar;
      this.teamRank = this.matchTeam.team.rank - 1;
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
