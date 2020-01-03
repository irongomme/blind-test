import _ from 'lodash';
import MatchTeamListCard from '@components/matchs/MatchTeamListCard';
import DialogMatchSummary from '@components/matchs/DialogMatchSummary';
import DialogSuccess from '@components/matchs/DialogSuccess';
import DialogRoundSummary from '@components/rounds/DialogRoundSummary';
import Game from '@models/game.model';
import Match from '@models/match.model';
import MatchHistory from '@models/match_history.model';
import MatchTeam from '@models/match.team.model';
import Team from '@models/team.model';

export default {
  name: 'PageMatchs',
  components: {
    MatchTeamListCard,
    DialogMatchSummary,
    DialogRoundSummary,
    DialogSuccess,
  },
  data() {
    return {
      matchTab: 0,
      teamSuccessPopup: false,
      matchSummaryPopup: false,
      roundSummaryPopup: false,
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
    // Gestion des succès / echec / annulations
    acceptPoint() {
      MatchHistory.update({
        where: this.playingTeam.id,
        data: {
          is_playing: false,
          is_success: true,
        },
      }).then(() => {
        this.teamSuccessPopup = true;
        this.resetPending();

        const newScore = Number(this.playingTeam.matchTeam.score) + 1;
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
          && newScore === Number(this.game.finalMatchScore)) {
          // Recherche du rang
          const currentRank = this.currentMatch.matchTeams
            .filter(match => Number(match.score) === Number(this.game.finalMatchScore))
            .length;
          // Mise à jour du nouveau vainqueur
          Team.update({
            where: this.playingTeam.matchTeam.team_id,
            data: { rank: currentRank },
          });

          // Si tous les autres ont déjà gagnés
          if (currentRank === this.currentMatch.matchTeams.length - 1) {
            const lastMatchTeam = this.currentMatch.matchTeams
              .filter(match => Number(match.score) < Number(this.game.finalMatchScore));
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
        // Equipes en standby
        const pendingTeams = this.currentMatch.matchTeams
          .filter(matchTeam => matchTeam.is_pending === true);
        // Equipes gagnantes
        const winnerTeams = this.currentMatch.matchTeams
          .filter(matchTeam => Number(matchTeam.team.rank) > 0);
        // Nombre d'équipes encore en jeu
        const remainingTeamsCount = Number(this.game.numberOfTeamsPerMatch) - winnerTeams.length;

        // Si toutes les équipes sont en standby, on réactive tout le monde
        if (pendingTeams.length >= remainingTeamsCount - 1) {
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
            ? Number(this.playingTeam.matchTeam.score) - 1
            : this.playingTeam.matchTeam.score,
        },
      });
      // Si l'équipe a atteint le score de finale on annulle le rang
      if (this.playingTeam.is_success
        && Number(this.playingTeam.matchTeam.team.rank) > 0) {
        Team.update({
          where: team => Number(team.rank) >= Number(this.playingTeam.matchTeam.team.rank),
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
      const scores = this.currentMatch.matchTeams.map(matchTeam => Number(matchTeam.score));
      const bestScore = Math.max(...scores);

      return this.currentMatch.matchTeams
        .filter(matchTeam => Number(matchTeam.score) > 0 && Number(matchTeam.score) === bestScore)
        .map(matchTeam => matchTeam.id);
    },
    matchTeamsRanking() {
      return _.sortBy(this.currentMatch.matchTeams, ['score']).reverse();
    },
    bestMatchScore() {
      const scores = this.matchTeamsRanking.map(matchTeam => Number(matchTeam.score));
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
        .where(team => Number(team.rank) > 0)
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
        .with('matchTeam.team')
        .whereHas('matchTeam', (query) => {
          query.where('match_id', this.currentMatch.id);
        })
        .last();

      return lastSuccess ? lastSuccess.matchTeam : {};
    },
  },
};
