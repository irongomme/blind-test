<template>
  <q-dialog
    ref="dialog-close-match"
    v-model="opened"
    transition-show="slide-down"
    transition-hide="fade">
    <q-card style="width: 900px;max-width: 80vw;">
      <q-card-section>
        <div class="q-pa-md">
          <q-list separator>
            <q-item
              v-for="matchTeam in teamsRanking"
              :key="matchTeam.id">
             <q-item-section>
                <q-avatar rounded>
                  <q-img cover :src="`statics/avatars/${matchTeam.team.avatar}`" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-linear-progress
                  stripe
                  rounded
                  style="height: 40px"
                  :value="(matchTeam.score / bestScore)"
                  color="positive"
                  class="q-mt-sm" />
              </q-item-section>
              <q-item-section >
                <q-badge
                    class="text-bold text-body2 "
                    align="middle"
                    :color="matchTeam.color"
                    text-color="white"
                    :label="matchTeam.score + ' Point' + (matchTeam.score > 1 ? 's' : '' )" />
              </q-item-section>

              <q-item-section :class="'text-h6 text-' + matchTeam.color">
                {{ matchTeam.team.name }}
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="bg-blue-grey-2">
        <q-btn
          push
          v-ripple
          icon-right="fas fa-forward"
          label="Match suivant"
          color="indigo-5"
          size="lg"
          @click="$emit('next-match')"
          v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  name: 'DialogMatchSummary',
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    teamsRanking: Array,
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
    bestScore() {
      const scores = this.teamsRanking.map(matchTeam => matchTeam.score);
      return Math.max(...scores);
    },
  },
};
</script>
