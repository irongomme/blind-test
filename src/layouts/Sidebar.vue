<template>
  <q-drawer
      :value="opened"
      show-if-above
      bordered
      overlay
      dark
      content-class="q-pt-xl text-white">
    <q-list dark>
      <q-item clickable class="q-pb-lg" tag="a" to="/">
        <q-item-section avatar>
          <q-icon name="fas fa-music" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Partie</q-item-label>
        </q-item-section>
      </q-item>
      <q-item clickable class="q-pb-lg" tag="a" to="/equipes" v-if="game">
        <q-item-section avatar>
          <q-icon name="fas fa-users" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Équipes</q-item-label>
          <q-item-label caption>Construction des équipes</q-item-label>
        </q-item-section>
        <q-item-section
          side
          v-if="game"
          v-show="currentPage === '/equipes'">
          <q-btn
            round
            icon="fas fa-plus"
            size="sm"
            color="positive"
            :disabled="teamsCount >= game.numberOfTeams"
            @click.prevent="emitGlobalEvent('addTeam')" />
        </q-item-section>
      </q-item>
      <q-item
        v-for="(round, roundIndex) in rounds"
        :key="round.id" clickable tag="a"
        :to="'/manches/' + round.id">
        <q-item-section avatar>
          <q-icon name="fas fa-dice" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Manche {{ parseInt(roundIndex) + 1 }}</q-item-label>
          <q-item-label caption>Préparation des manches</q-item-label>
        </q-item-section>
      </q-item>
      <q-item clickable tag="a" @click.prevent="newRound()" v-if="game && teamsCount >= 4">
        <q-item-section avatar>
          <q-icon name="fas fa-plus" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Nouvelle manche</q-item-label>
          <q-item-label caption>Lancer une nouvelle manche de jeu</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script>
import _ from 'lodash';
import Game from '@models/game.model';
import Team from '@models/team.model';
import Round from '@models/round.model';
import Match from '@models/match.model';
import MatchTeam from '@models/match.team.model';
import EventBus from '@store/event-bus';

export default {
  name: 'Sidebar',
  components: { },
  props: {
    opened: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    emitGlobalEvent(event) {
      EventBus.$emit(event);
    },
    newRound() {
      // Ids de toutes les équipes
      const teams = Team.query().with('players').with('teamMatchs').all();
      const allTeams = _.shuffle(teams);
      // Valeurs max des incréments
      const matchCount = allTeams.length / this.game.numberOfTeamsPerMatch;
      const matchTeamsCount = this.game.numberOfTeamsPerMatch;
      // Nouveau round
      const newRound = new Round();

      // Pour chaque match on va attribuer x équipes
      for (let matchInc = 0; matchInc < matchCount; matchInc += 1) {
        // Préparation du tableau d'équipes pour le nouveau match
        const newMatch = new Match();
        const matchTeams = [];
        // Découpage des x équipes
        for (let teamInc = 0; teamInc < matchTeamsCount; teamInc += 1) {
          const currentTeam = allTeams[teamInc + matchInc * matchTeamsCount];
          // Fabrication du pool de x équipes dans ce match
          matchTeams.push(currentTeam);
          // Création de la relation
          MatchTeam.insert({
            data: {
              match_id: newMatch.id,
              team_id: currentTeam.id,
            },
          });
        }

        // Insertion du nouveau match
        Match.insert({
          data: {
            id: newMatch.id,
            round_id: newRound.id,
            teams: matchTeams,
          },
        });
      }

      // Enfin, insertion de nouveau round
      Round.insert({
        data: {
          id: newRound.id,
        },
      }).then(() => {
        // Redirection vers la nouvelle manche
        this.$router.push({
          path: `/manches/${newRound.id}`,
        });
      });
    },
  },
  computed: {
    game: () => Game.query().first(),
    rounds: () => Round.query().all(),
    teamsCount: () => Team.query().count(),
    currentPage() {
      return this.$route.path;
    },
  },
};
</script>
