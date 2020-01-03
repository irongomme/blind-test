import _ from 'lodash';
import MatchTeamListCard from '@components/matchs/MatchTeamListCard';
import DialogMatchSummary from '@components/matchs/DialogMatchSummary';
import DialogRoundSummary from '@components/rounds/DialogRoundSummary';
import Game from '@models/game.model';
import Match from '@models/match.model';
import MatchHistory from '@models/match_history.model';
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
      teamPlayingPopup: false,
      teamSuccessPopup: false,
      matchSummaryPopup: false,
      roundSummaryPopup: false,
      successTeamColor: '',
      successTeamName: '',
      successImage: '',
      playingCountdown: 10,
      timerPlaying: false,
      timerSuccess: false,
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
    focusTeam(matchTeam) {
      // Empécher la double action
      if (this.playingTeam.is_playing || matchTeam.team.rank > 0) {
        return;
      }

      // Nouvelle participation
      MatchHistory.insert({
        data: {
          matchTeam_id: matchTeam.id,
          is_playing: true,
        },
      }).then(() => {
        // Initialisation du temps restant
        const tick = 100; // Millisecondes
        const tickIncrement = (1 / tick) / (this.game.answerTimerDuration / 100);
        // this.game.answerTimerDuration;
        // Lancement du compte à rebours
        this.timerPlaying = setInterval(() => {
          this.playingCountdown -= tickIncrement;

          if (this.playingCountdown <= 0) {
            // On stop tout, le point est perdu
            this.discardPoint();
          }
        }, tick);
      });
    },
    stopCountdown() {
      // Arrêt du timer
      clearInterval(this.timerPlaying);
      // Remise à zéro du compteur de progression de la barre de chargement
      this.playingCountdown = 10;
    },
    acceptPoint() {
      MatchHistory.update({
        where: this.playingTeam.id,
        data: {
          is_playing: false,
          is_success: true,
        },
      }).then(() => {
        this.stopCountdown();
        this.showSuccess(this.playingTeam.matchTeam);
        this.resetPending();

        const newScore = this.playingTeam.matchTeam.score + 1;
        // Mise à jour du score
        MatchTeam.update({
          where: this.playingTeam.matchTeam.id,
          data: {
            match_id: this.playingTeam.matchTeam.match_id,
            team_id: this.playingTeam.matchTeam.team_id,
            score: newScore,
          },
        });

        // Pour le match final, on va surveiller le score
        if (this.playingTeam.matchTeam.match.is_final
          && newScore === this.game.finalMatchScore) {
          // Recherche du rang
          const currentRank = this.currentMatch.matchTeams
            .filter(match => match.score === this.game.finalMatchScore)
            .length;
          // Mise à jour du nouveau vainqueur
          Team.update({
            where: this.playingTeam.matchTeam.team_id,
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
      });
    },
    discardPoint() {
      MatchHistory.update({
        where: this.playingTeam.id,
        data: {
          is_playing: false,
          is_pending: true,
        },
      }).then(() => {
        this.stopCountdown();
        // Si toutes les équipes sont en standby, on réactive tout le monde
        const pendingTeams = this.currentMatch.matchTeams
          .filter(matchTeam => matchTeam.is_pending === true);
        if (pendingTeams.length === this.game.numberOfTeamsPerMatch - 1) {
          this.resetPending();
        } else {
          // On met l'équipe en standby pour ce match
          MatchTeam.update({
            where: this.playingTeam.matchTeam_id,
            data: { is_pending: true },
          });
        }
      });
    },
    undo() {
      // Si l'équipe est en sommeil, on la remet en cours
      // Si elle a gagné un point, on l'annule
      MatchTeam.update({
        where: this.playingTeam.matchTeam.id,
        data: {
          is_pending: false,
          score: this.playingTeam.is_success
            ? this.playingTeam.matchTeam.score - 1
            : this.playingTeam.matchTeam.score,
        },
      });
      // Si l'équipe a atteint le score de finale on annulle le rang
      if (this.playingTeam.is_success && this.playingTeam.matchTeam.team.rank > 0) {
        Team.update({
          where: this.playingTeam.matchTeam.team_id,
          data: { rank: 0 },
        });
      }
      // Annulation du dernier historique
      MatchHistory.update({
        where: this.playingTeam.id,
        data: { is_cancelled: true },
      });
    },
    resetPending() {
      this.currentMatch.matchTeams.forEach((pendingTeam) => {
        MatchTeam.update({
          where: pendingTeam.id,
          data: { is_pending: false },
        });
      });
    },
    closeMatch() {
      this.resetPending();
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
      this.timerSuccess = setTimeout(() => {
        this.teamSuccessPopup = false;
      }, 8000);
    },
    resetSuccess() {
      clearTimeout(this.timerSuccess);
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
    playingTeam() {
      // Dernière entrée de l'historique pour le match en cours
      return MatchHistory.query()
        .with('matchTeam.team')
        .with('matchTeam.match')
        .where('is_cancelled', false)
        .whereHas('matchTeam', (query) => {
          query
            .where('match_id', this.currentMatch.id);
        })
        .last() || new MatchHistory();
    },
    lastScored() {
      const lastSuccess = MatchHistory.query()
        .where('is_success', true)
        .where('is_cancelled', false)
        .with('matchTeam')
        .whereHas('matchTeam', (query) => {
          query.where('match_id', this.currentMatch.id);
        })
        .last();

      return lastSuccess ? lastSuccess.matchTeam.team_id : false;
    },
  },
};
