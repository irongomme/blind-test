import _ from 'lodash';
import MatchTeamListCard from '@components/teams/MatchTeamListCard';
import Round from '@models/round.model';
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
    updateScore(matchId, teamId, score) {
      if (score < 0) {
        return;
      }

      const matchTeam = MatchTeam
        .query()
        .where('match_id', matchId)
        .where('team_id', teamId)
        .with('team')
        .first();

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
          match_id: matchId,
          team_id: teamId,
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
        this.currentMatch.map(matchTeam => matchTeam.team_id),
        teamId,
      );
    },
    isInBestMatchTeam(matchTeamId) {
      return _.indexOf(this.bestMatchTeam, matchTeamId) !== -1;
    },
  },
  computed: {
    currentRound() {
      const roundMatchs = Round.query()
        .whereId(this.$route.params.round_id)
        .with('matchs')
        .first();


      if (!roundMatchs) {
        return [];
      }

      const currentRoundMatchs = [];

      for (let matchInc = 0; matchInc < roundMatchs.matchs.length; matchInc += 1) {
        const currentMatchTeams = MatchTeam.query()
          .where('match_id', roundMatchs.matchs[matchInc].id)
          .with('match')
          .with('team.players')
          .all();

        currentRoundMatchs.push(currentMatchTeams);
      }

      return currentRoundMatchs;
    },
    isRoundClosed() {
      const reducer = (compute, value) => compute && value[0].match.is_closed;
      return this.currentRound.reduce(reducer, true);
    },
    currentMatch() {
      return this.currentRound[this.matchTab];
    },
    lastScored() {
      return this.scoreHistory[this.scoreHistory.length - 1];
    },
    bestMatchTeam() {
      let bestScore = 0;
      let bestMatchTeam = [];

      for (let teamInc = 0; teamInc < this.currentMatch.length; teamInc += 1) {
        const teamScore = this.currentMatch[teamInc].score;
        const matchTeamId = this.currentMatch[teamInc].id;

        if (teamScore > bestScore) {
          bestScore = teamScore;
          bestMatchTeam = [matchTeamId];
        } else if (teamScore > 0 && teamScore === bestScore) {
          bestMatchTeam.push(matchTeamId);
        }
      }

      return bestMatchTeam;
    },
    allScoresCount() {
      let count = 0;

      for (let teamInc = 0; teamInc < this.currentMatch.length; teamInc += 1) {
        count += this.currentMatch[teamInc].score;
      }

      return count;
    },
    animatedSucess: () => AnimatedSuccess,
  },
};
