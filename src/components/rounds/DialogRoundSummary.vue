<template>
  <q-dialog
    ref="dialog-round-summary"
    persistent
    v-model="opened"
    transition-show="slide-down"
    transition-hide="fade"
    @show="processSeparation">
    <q-card style="width: 80%;max-width: 80vw;">
      <q-card-section>
        <div class="row">
          <div class="full-width">
            <q-list

              dense
              class="q-gutter-x-sm column"
              :style="{ height: (listItemHeight * (teamsRanking.length / 2)) + 'px' }">
              <q-item
                v-ripple
                :class="{ 'col-6': true, 'bg-indigo-2': matchTeam.need_separation }"
                :style="{ height: listItemHeight + 'px' }"
                v-for="matchTeam in teamsRanking"
                :key="matchTeam.id"
                :disable="matchTeam.is_disqualified">
               <q-item-section avatar>
                  <q-avatar rounded>
                    <q-img cover :src="`statics/avatars/${matchTeam.team.avatar}`" />
                  </q-avatar>
                </q-item-section>
                <q-item-section class="text-h6 text-indigo">
                  <q-item-label lines="1">{{ matchTeam.team.name }}</q-item-label>

                </q-item-section>
                <q-item-section>
                  <q-linear-progress
                    stripe
                    rounded
                    style="height: 24px;margin-top: 8px;"
                    :value="(matchTeam.score / bestScore)"
                    color="positive"
                    class="q-mb-sm" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>
                    <q-badge
                      class="text-bold text-body2 "
                      align="middle"
                      color="indigo"
                      text-color="white"
                      :label="matchTeam.score + ' Point' + (matchTeam.score > 1 ? 's' : '' )" />
                  </q-item-label>
                </q-item-section>
                <q-item-section class="text-white text-bold text-subtitle1">
                  <q-item-label>
                    <q-icon
                      class="q-mr-md"
                      color="white"
                      name="fas fa-balance-scale"
                      v-show="matchTeam.need_separation" />
                      EGALITÉ !
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>
      <q-separator v-if="roundId === lastRoundId" />
      <q-card-section class="bg-indigo text-white" v-if="roundId === lastRoundId">
        <div class="row">
          <div class="col-9 text-right">
            <div class="q-gutter-sm">
              <q-radio
                color="white"
                v-model="keepTeamsQuantity"
                :val="teamsRanking.length"
                label="Non éliminatoire"
                @input="processSeparation()" />
              <q-radio
                color="white"
                v-model="keepTeamsQuantity"
                :val="teamsRanking.length / 2"
                label="Disqualifier la moitié"
                @input="processSeparation()" />
              <q-radio
                color="white"
                v-model="keepTeamsQuantity"
                :val="teamsRanking.length / 4 * 3"
                label="Disqualifier un quart"
                @input="processSeparation()" />
            </div>
          </div>
          <div class="col-3 text-right">
            <q-toggle
              color="white"
              v-model="cumulativeScores"
              label="Conserver les scores"
              v-show="!needSeparation" />
          </div>

        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="between" v-if="roundId === lastRoundId">
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
          @click="newRound({ cumulativeScores })"
          size="lg"
          v-if="!needSeparation"
          v-close-popup />
        <q-btn
          flat
          v-ripple
          color="indigo"
          icon="fas fa-balance-scale"
          label="Départager les équipes"
          @click="sendSeparationMatch()"
          size="lg"
          v-if="needSeparation"
          v-close-popup />
        </q-card-actions>
        <q-card-actions align="right" v-if="roundId !== lastRoundId">
          <q-btn
            flat
            v-ripple
            color="indigo"
            label="Ok"
            size="lg"
            v-close-popup />
        </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import _ from 'lodash';
import RoundMixin from '@mixins/round.mixin';
import Round from '@models/round.model';
import MatchTeam from '@models/match.team.model';

export default {
  name: 'DialogRoundSummary',
  mixins: [RoundMixin],
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    roundId: {
      type: String,
      required: true,
    },
    teamsRanking: Array,
  },
  data() {
    return {
      listItemHeight: 64,
      cumulativeScores: true,
      keepTeamsQuantity: this.teamsRanking.length,
    };
  },
  methods: {
    processSeparation() {
      let waiversTeams = [];

      // Equipes qualifiees
      const qualifiedMatchTeams = this.teamsRanking
        .filter((matchTeam, index) => index < this.keepTeamsQuantity);
      // Equipes non qualifiees
      const unqualifiedMatchTeams = this.teamsRanking
        .filter((matchTeam, index) => index >= this.keepTeamsQuantity);

      // Score le plus bas des equipes qualifiees
      const leastScore = Math.min(...qualifiedMatchTeams.map(matchTeam => matchTeam.score));
      // Equipes a ne pas disqualifier tout de suite
      const unqualifiedWaiversTeams = unqualifiedMatchTeams
        .filter(matchTeam => matchTeam.score === leastScore);

      // Si des equipes doivent se trouver en ballotage
      if (unqualifiedWaiversTeams.length > 0) {
        // On extrait toutes les équipes à départager
        waiversTeams = this.teamsRanking
          .filter(matchTeam => matchTeam.score === leastScore);
        // On les insere dans la liste des equipes toujours qualifiees
        unqualifiedWaiversTeams
          .forEach(matchTeam => qualifiedMatchTeams.push(matchTeam));
      }

      // On met à jour toutes les entrées match-equipe
      this.teamsRanking.forEach(matchTeam => MatchTeam.update({
        where: matchTeam.id,
        data: {
          is_disqualified: (
            _.indexOf(qualifiedMatchTeams.map(item => item.id), matchTeam.id) === -1
          ),
          need_separation: (
            _.indexOf(waiversTeams.map(item => item.id), matchTeam.id) !== -1
          ),
        },
      }));
    },
    sendSeparationMatch() {
      const matchTeamsToSeparate = MatchTeam.query()
        .where('need_separation', true)
        .with('team')
        .with('match')
        .whereHas('match', (query) => {
          query.where('round_id', this.roundId);
        })
        .all();

      this.newSeparationMatch(this.roundId, matchTeamsToSeparate)
        .then(() => {
          this.$emit('newMatch');
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
    keepTeamsQuantityOptions() {
      return Array
        .from(Array(this.teamsRanking.length).keys())
        .map(number => number + 1);
    },
    lastRoundId() {
      const lastRound = Round.query().last();
      return lastRound.id;
    },
    needSeparation() {
      const reducer = (compute, value) => compute + (value.need_separation ? 1 : 0);
      return this.teamsRanking.reduce(reducer, 0) > 0;
    },
  },
};

</script>
