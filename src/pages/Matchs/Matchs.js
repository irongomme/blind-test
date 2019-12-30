import _ from 'lodash';
import MatchTeamListCard from '@components/matchs/MatchTeamListCard';
import DialogMatchSummary from '@components/matchs/DialogMatchSummary';
import DialogRoundSummary from '@components/rounds/DialogRoundSummary';
import Game from '@models/game.model';
import Match from '@models/match.model';
import MatchTeam from '@models/match.team.model';
import Team from '@models/team.model';
import AnimatedSuccess from '@json/animated_success.json';

export default {
  name: 'PageMatchs',
  components: {
    MatchTeamListCard,
    DialogMatchSummary,
    DialogRoundSummary,
  },
  data() {
    return {
      matchTab: 0,
      scoreHistory: [],
      teamSuccessPopup: false,
      matchSummaryPopup: false,
      roundSummaryPopup: false,
      successTeamColor: '',
      successTeamName: '',
      successImage: '',
      wordNumbers: ['one', 'two', 'three', 'four', 'five', 'six'],
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
        this.showSuccess(matchTeam);
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

      // En finale, il faut détecter la position des gagnants
      if (score === this.game.finalMatchScore) {
        // Recherche du rang
        const currentRank = this.currentMatch.matchTeams
          .filter(match => match.score === this.game.finalMatchScore)
          .length;
        // Mise à jour du nouveau vainqueur
        Team.update({
          where: matchTeam.team_id,
          data: { rank: currentRank },
        });

        // Si tous les autres ont déjà gagnés
        if (currentRank === this.currentMatch.matchTeams.length - 1) {
          const lastMatchTeam = this.currentMatch.matchTeams
            .filter(match => match.score < this.game.finalMatchScore);
          // Mise à jour du dernier
          Team.update({
            where: lastMatchTeam[0].team_id,
            data: { rank: currentRank + 1 },
          });
        }
      }
    },
    closeMatch() {
      return Match.update({
        where: this.currentMatch.id,
        data: { is_closed: true },
      });
    },
    nextMatch() {
      if (!this.currentMatch.is_closed && this.matchSummaryPopup === false) {
        this.matchSummaryPopup = true;
      } else {
        this.closeMatch().then(() => {
          setTimeout(() => {
            if (this.isRoundClosed && this.matchTab === (this.matchs.length - 1)) {
              this.roundSummaryPopup = true;
            } else {
              this.$refs.matchTabs.next();
            }
          }, 400);
        });
      }
    },
    showSuccess(matchTeam) {
      // Attribution des differentes valeurs pour la popup
      this.successImage = '/statics/success/';
      this.successImage += this.animatedSucess[
        Math.floor(Math.random() * this.animatedSucess.length)
      ];
      this.successTeamColor = matchTeam.color;
      this.successTeamName = matchTeam.team.name;
      // Ouverture
      this.teamSuccessPopup = true;
      // Timer
      setTimeout(() => {
        this.teamSuccessPopup = false;
      }, 8000);
    },
    isInBestMatchTeam(matchTeamId) {
      return _.indexOf(this.bestMatchTeam, matchTeamId) !== -1;
    },
    showRoundSummary() {
      this.closeMatch().then(() => {
        this.roundSummaryPopup = true;
      });
    },
  },
  computed: {
    animatedSucess: () => AnimatedSuccess,
    game: () => Game.query().first() || false,
    matchs() {
      const currentMatchs = [];

      const matchs = Match.query()
        .where('round_id', this.$route.params.round_id)
        .all();

      for (let matchInc = 0; matchInc < matchs.length; matchInc += 1) {
        currentMatchs.push({
          id: matchs[matchInc].id,
          is_closed: matchs[matchInc].is_closed,
          is_final: matchs[matchInc].is_final,
          matchTeams: MatchTeam.query()
            .where('match_id', matchs[matchInc].id)
            .with('team|match')
            .all(),
        });
      }

      return currentMatchs;
    },
    currentMatch() {
      return this.matchs[this.matchTab];
    },
    lastScored() {
      return this.scoreHistory[this.scoreHistory.length - 1];
    },
    allScoresCount() {
      const reducer = (compute, value) => compute + value.score;
      return this.currentMatch.matchTeams.reduce(reducer, 0);
    },
    bestMatchTeam() {
      const scores = this.currentMatch.matchTeams.map(matchTeam => matchTeam.score);
      const bestScore = Math.max(...scores);

      return this.currentMatch.matchTeams
        .filter(matchTeam => matchTeam.score > 0 && matchTeam.score === bestScore)
        .map(matchTeam => matchTeam.id);
    },
    matchTeamsRanking() {
      return _.sortBy(this.currentMatch.matchTeams, ['score']).reverse();
    },
    bestMatchScore() {
      const scores = this.matchTeamsRanking.map(matchTeam => matchTeam.score);
      return Math.max(...scores);
    },
    roundTeamsRanking() {
      const teamsRanking = MatchTeam.query()
        .with('team')
        .with('match')
        .whereHas('match', (query) => {
          query.where('round_id', this.$route.params.round_id);
        })
        .all();

      return _.sortBy(teamsRanking, ['score']).reverse();
    },
    isRoundClosed() {
      const reducer = (compute, value) => compute && value.is_closed;
      return this.matchs.reduce(reducer, true);
    },
    isGameOver() {
      const winningPlayersCount = Team.query()
        .where(team => team.rank > 0)
        .count();

      return this.currentMatch.is_final
        && winningPlayersCount === this.currentMatch.matchTeams.length - 1;
    },
  },
};
