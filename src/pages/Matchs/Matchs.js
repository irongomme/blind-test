import _ from 'lodash';
import MatchTeamListCard from '@components/teams/MatchTeamListCard';
import Match from '@models/match.model';
import MatchTeam from '@models/match.team.model';
import AnimatedSuccess from '@json/animated_success.json';

export default {
  name: 'PageMatchs',
  components: { MatchTeamListCard },
  data() {
    return {
      matchTab: 0,
      matchColors: [
        'blue-9',
        'yellow-8',
        'green',
        'red-9',
      ],
      scoreHistory: [],
      teamSuccessPopup: false,
      successTeamColor: '',
      successTeamName: '',
      successImage: '',
    };
  },
  beforeRouteUpdate(to, from, next) {
    // Destruction du composant pour que celui
    // se renouvelle au changement de page
    this.$destroy();
    next();
  },
  methods: {
    updateScore(matchTeam, score) {
      if (score < 0) {
        return;
      }

      // Gain de score
      if (score > matchTeam.score) {
        // Ajout du point dans l'historique
        this.scoreHistory.push(matchTeam.id);
        // Noticiation
        this.showSuccess(matchTeam.team);
      // Correction de point
      } else if (score < matchTeam.score) {
        // Recherche du dernier point attribué à l'équipe
        const lastMatchTeamScored = _.lastIndexOf(this.scoreHistory, matchTeam.id);
        this.scoreHistory.splice(lastMatchTeamScored, 1);
      }

      // Mise à jour du score
      MatchTeam.update({
        where: matchTeam.id,
        data: {
          match_id: matchTeam.match_id,
          team_id: matchTeam.team_id,
          score,
        },
      });
    },
    switchMatch(matchId, matchState) {
      Match.update({
        where: matchId,
        data: {
          is_closed: !matchState,
        },
      });
    },
    showSuccess(team) {
      // Attribution des differentes valeurs pour la popup
      this.successImage = '/statics/success/';
      this.successImage += this.animatedSucess[
        Math.floor(Math.random() * Math.floor(this.animatedSucess.length))
      ];
      this.successTeamColor = this.matchColors[this.getTeamColorIndex(team.id)];
      this.successTeamName = team.name;
      // Ouverture
      this.teamSuccessPopup = true;
      // Timer
      setTimeout(() => {
        this.teamSuccessPopup = false;
      }, 8000);
    },
    getTeamColorIndex(teamId) {
      return _.indexOf(
        this.currentMatch.matchTeams.map(matchTeam => matchTeam.team_id),
        teamId,
      );
    },
    isInBestMatchTeam(matchTeamId) {
      return _.indexOf(this.bestMatchTeam, matchTeamId) !== -1;
    },
  },
  computed: {
    matchs() {
      const currentMatchs = [];

      const matchs = Match.query()
        .where('round_id', this.$route.params.round_id)
        .all();

      for (let matchInc = 0; matchInc < matchs.length; matchInc += 1) {
        currentMatchs.push({
          id: matchs[matchInc].id,
          is_closed: matchs[matchInc].is_closed,
          matchTeams: MatchTeam.query()
            .where('match_id', matchs[matchInc].id)
            .with('team')
            .all(),
        });
      }

      return currentMatchs;
    },
    isRoundClosed() {
      const reducer = (compute, value) => compute && value.is_closed;
      return this.matchs.reduce(reducer, true);
    },
    currentMatch() {
      return this.matchs[this.matchTab];
    },
    lastScored() {
      return this.scoreHistory[this.scoreHistory.length - 1];
    },
    bestMatchTeam() {
      const scores = this.currentMatch.matchTeams.map(matchTeam => matchTeam.score);
      const bestScore = Math.max(...scores);

      return this.currentMatch.matchTeams
        .filter(matchTeam => matchTeam.score > 0 && matchTeam.score === bestScore)
        .map(matchTeam => matchTeam.id);
    },
    allScoresCount() {
      const reducer = (compute, value) => compute + value.score;
      return this.currentMatch.matchTeams.reduce(reducer, 0);
    },
    animatedSucess: () => AnimatedSuccess,
  },
};
