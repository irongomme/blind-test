<template>
  <q-dialog
    ref="dialog-round-summary"
    persistent
    v-model="opened"
    transition-show="slide-down"
    transition-hide="fade">
    <q-card style="width: 80%;max-width: 80vw;">
      <q-card-section class="text-h6 bg-indigo text-white">
        Résumé du Round
      </q-card-section>
      <q-card-section>
        <div class="row">
          <div class="full-width">
            <q-list
              separator
              dense
              class="q-gutter-x-xl column"
              :style="{ height: (64 * (teamsRanking.length / 2)) + 'px' }">
              <q-item
                class="col-6"
                style="height: 64px;"
                v-for="matchTeam in teamsRanking"
                :key="matchTeam.id"
                :disable="!matchTeam.team.is_active">
               <q-item-section avatar>
                  <q-avatar rounded>
                    <q-img cover :src="`statics/avatars/${matchTeam.team.avatar}`" />
                  </q-avatar>
                </q-item-section>
                <q-item-section class="text-h6 text-indigo">
                  <q-item-label lines="1">{{ matchTeam.team.name }}</q-item-label>
                  <q-item-label caption>
                    <q-badge
                      class="text-bold text-body2 "
                      align="middle"
                      color="indigo"
                      text-color="white"
                      :label="matchTeam.score + ' Point' + (matchTeam.score > 1 ? 's' : '' )" />
                  </q-item-label>
                </q-item-section>
                <q-item-section>
                  <q-linear-progress
                    stripe
                    rounded
                    style="height: 24px"
                    :value="(matchTeam.score / bestScore)"
                    color="positive"
                    class="q-mb-sm" />
                </q-item-section>
                <q-item-section>
                  <q-toggle
                    :value="matchTeam.team.is_active"
                    @input="switchTeam(matchTeam.team)" />
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        Pour le prochain round
      </q-card-section>
      <q-separator />
      <q-card-actions align="between">
        <q-btn
          flat
          v-ripple
          color="grey"
          icon="fas fa-times"
          label="Annuler"
          size="lg"
          v-close-popup />
        <q-btn
          flat
          v-ripple
          color="indigo"
          icon="fas fa-dice"
          label="Nouveau Round"
          @click="newRound()"
          size="lg"
          v-close-popup />
        </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import RoundMixin from '@mixins/round.mixin';
import Team from '@models/team.model';

export default {
  name: 'DialogRoundSummary',
  mixins: [RoundMixin],
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    teamsRanking: Array,
  },
  methods: {
    switchTeam(team) {
      Team.update({
        where: team.id,
        data: {
          is_active: !team.is_active,
        },
      });
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
    bestScore() {
      const scores = this.teamsRanking.map(matchTeam => matchTeam.score);
      return Math.max(...scores);
    },
  },
};

</script>
